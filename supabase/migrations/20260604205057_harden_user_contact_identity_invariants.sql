begin;

update public.profiles
set email = lower(btrim(email))
where email is distinct from lower(btrim(email));

do $$
begin
  if exists (
    select 1
    from public.profiles
    where email is null
       or btrim(email) = ''
  ) then
    raise exception 'Cannot enforce profile email invariants: blank profile emails exist';
  end if;

  if exists (
    select 1
    from public.profiles
    group by lower(btrim(email))
    having count(*) > 1
  ) then
    raise exception 'Cannot enforce profile email invariants: normalized duplicate emails exist';
  end if;

  if exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where lower(btrim(p.email)) is distinct from lower(btrim(u.email))
  ) then
    raise exception 'Cannot enforce profile email invariants: auth/profile email drift exists';
  end if;
end;
$$;

alter table public.profiles
  alter column email set not null;

alter table public.profiles
  drop constraint if exists profiles_email_key;
create unique index profiles_email_normalized_uidx
  on public.profiles (lower(btrim(email)));

update public.profiles
set phone = case
  when regexp_replace(phone, '\D', '', 'g') ~ '^8[0-9]{10}$'
    then '+7' || substr(regexp_replace(phone, '\D', '', 'g'), 2)
  when regexp_replace(phone, '\D', '', 'g') ~ '^7[0-9]{10}$'
    then '+' || regexp_replace(phone, '\D', '', 'g')
  when regexp_replace(phone, '\D', '', 'g') ~ '^[0-9]{10}$'
    then '+7' || regexp_replace(phone, '\D', '', 'g')
  else phone
end
where nullif(btrim(phone), '') is not null;

alter table public.profiles
  drop constraint if exists profiles_phone_format_check;
alter table public.profiles
  add constraint profiles_phone_format_check
  check (phone is null or btrim(phone) = '' or phone ~ '^\+7[0-9]{10}$')
  not valid;

create or replace function public.enforce_profile_auth_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth_email text;
  v_provision_role text;
begin
  select
    lower(btrim(u.email)),
    coalesce(nullif(u.raw_app_meta_data ->> 'provision_role', ''), 'student')
  into v_auth_email, v_provision_role
  from auth.users u
  where u.id = new.id;

  if v_auth_email is null then
    raise exception 'Profile must reference an Auth user with an email'
      using errcode = '23503';
  end if;

  new.email := lower(btrim(new.email));
  if new.email is distinct from v_auth_email then
    raise exception 'Profile email must match Auth email'
      using errcode = '23514';
  end if;

  if (tg_op = 'INSERT' or new.role is distinct from old.role)
     and new.role is distinct from v_provision_role then
    raise exception 'Profile role must match Auth provision_role'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_profile_auth_identity on public.profiles;
create trigger trg_enforce_profile_auth_identity
before insert or update of email, role on public.profiles
for each row execute function public.enforce_profile_auth_identity();

create or replace function public.sync_auth_user_email_to_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.email is distinct from new.email then
    update public.profiles
    set email = lower(btrim(new.email))
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute function public.sync_auth_user_email_to_profile();

create unique index if not exists user_roles_user_id_uidx
  on public.user_roles (user_id);

create or replace function public.enforce_user_role_matches_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_role text;
  v_role_key text;
begin
  select p.role into v_profile_role
  from public.profiles p
  where p.id = new.user_id;

  select r.key into v_role_key
  from public.roles r
  where r.id = new.role_id;

  if v_profile_role is null or v_role_key is null or v_profile_role is distinct from v_role_key then
    raise exception 'RBAC role must match profile role'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_user_role_matches_profile on public.user_roles;
create trigger trg_enforce_user_role_matches_profile
before insert or update of user_id, role_id on public.user_roles
for each row execute function public.enforce_user_role_matches_profile();

create or replace function public.prevent_dual_linked_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = new.profile_id
      and p.role = case when tg_table_name = 'students' then 'student' else 'teacher' end
  ) then
    raise exception 'Linked identity must match profile role'
      using errcode = '23514';
  end if;

  if tg_table_name = 'students' and exists (
    select 1 from public.teachers t where t.profile_id = new.profile_id
  ) then
    raise exception 'Profile already has a teacher identity'
      using errcode = '23514';
  end if;

  if tg_table_name = 'teachers' and exists (
    select 1 from public.students s where s.profile_id = new.profile_id
  ) then
    raise exception 'Profile already has a student identity'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_dual_student_identity on public.students;
create trigger trg_prevent_dual_student_identity
before insert or update of profile_id on public.students
for each row execute function public.prevent_dual_linked_identity();

drop trigger if exists trg_prevent_dual_teacher_identity on public.teachers;
create trigger trg_prevent_dual_teacher_identity
before insert or update of profile_id on public.teachers
for each row execute function public.prevent_dual_linked_identity();

drop policy if exists students_insert_own on public.students;
drop policy if exists students_insert_own_or_manage on public.students;
drop policy if exists teachers_insert_manage on public.teachers;
drop policy if exists profiles_select_policy on public.profiles;
drop policy if exists profiles_update_own_or_admin on public.profiles;
drop policy if exists profiles_update_policy on public.profiles;
drop policy if exists students_select_own_teacher_admin on public.students;
drop policy if exists students_select_policy on public.students;
drop policy if exists students_update_policy on public.students;
drop policy if exists teachers_select_policy on public.teachers;
drop policy if exists teachers_update_policy on public.teachers;

revoke all on function public.enforce_profile_auth_identity() from public;
revoke all on function public.enforce_profile_auth_identity() from anon;
revoke all on function public.enforce_profile_auth_identity() from authenticated;
revoke all on function public.sync_auth_user_email_to_profile() from public;
revoke all on function public.sync_auth_user_email_to_profile() from anon;
revoke all on function public.sync_auth_user_email_to_profile() from authenticated;
revoke all on function public.enforce_user_role_matches_profile() from public;
revoke all on function public.enforce_user_role_matches_profile() from anon;
revoke all on function public.enforce_user_role_matches_profile() from authenticated;
revoke all on function public.prevent_dual_linked_identity() from public;
revoke all on function public.prevent_dual_linked_identity() from anon;
revoke all on function public.prevent_dual_linked_identity() from authenticated;

commit;
