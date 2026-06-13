begin;

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_user_id uuid not null,
  entity text not null,
  entity_id text not null,
  action text not null check (action in ('create', 'update', 'delete')),
  before jsonb,
  after jsonb
);

create index if not exists audit_log_created_at_idx
  on public.audit_log (created_at desc);
create index if not exists audit_log_actor_user_id_idx
  on public.audit_log (actor_user_id);
create index if not exists audit_log_entity_idx
  on public.audit_log (entity, entity_id);

alter table public.audit_log enable row level security;

drop policy if exists audit_log_admin_read on public.audit_log;
drop policy if exists audit_log_roles_view_all on public.audit_log;
create policy audit_log_roles_view_all
on public.audit_log
for select
to authenticated
using (app_private.has_permission('roles.view', 'all'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := coalesce(nullif(new.raw_app_meta_data ->> 'provision_role', ''), 'student');
  v_role_id uuid;
  v_stage text := 'validate_role';
begin
  if v_role not in ('student', 'teacher', 'manager', 'admin') then
    raise exception 'Invalid provision_role: %', v_role
      using errcode = '22023';
  end if;

  v_stage := 'resolve_role';
  select r.id
    into v_role_id
  from public.roles r
  where r.key = v_role;

  if v_role_id is null then
    raise exception 'Provisioning role is not configured: %', v_role
      using errcode = '23503';
  end if;

  v_stage := 'create_profile';
  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    display_name,
    role,
    status
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    v_role,
    'active'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status;

  v_stage := 'create_rbac_role';
  insert into public.user_roles (user_id, role_id)
  values (new.id, v_role_id)
  on conflict (user_id, role_id) do nothing;

  if v_role = 'student' then
    v_stage := 'create_student_identity';
    insert into public.students (profile_id)
    values (new.id)
    on conflict (profile_id) do nothing;
  elsif v_role = 'teacher' then
    v_stage := 'create_teacher_identity';
    insert into public.teachers (profile_id)
    values (new.id)
    on conflict (profile_id) do nothing;
  end if;

  return new;
exception
  when others then
    raise exception 'User provisioning failed at stage %: %', v_stage, sqlerrm
      using errcode = sqlstate;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

-- Repair only unambiguous compatibility rows. Conflicts remain untouched and
-- are reported by supabase/sql-editor/user_provisioning_repair_report.sql.
insert into public.user_roles (user_id, role_id)
select p.id, r.id
from public.profiles p
join public.roles r on r.key = p.role
left join public.user_roles ur
  on ur.user_id = p.id
 and ur.role_id = r.id
where p.role in ('student', 'teacher', 'manager', 'admin')
  and ur.user_id is null
on conflict (user_id, role_id) do nothing;

insert into public.students (profile_id)
select p.id
from public.profiles p
left join public.students s on s.profile_id = p.id
left join public.teachers t on t.profile_id = p.id
where p.role = 'student'
  and s.id is null
  and t.id is null
on conflict (profile_id) do nothing;

insert into public.teachers (profile_id)
select p.id
from public.profiles p
left join public.teachers t on t.profile_id = p.id
left join public.students s on s.profile_id = p.id
where p.role = 'teacher'
  and t.id is null
  and s.id is null
on conflict (profile_id) do nothing;

commit;
