begin;

create or replace function public.apply_user_provisioning(
  p_user_id uuid,
  p_email text,
  p_user_meta_data jsonb,
  p_app_meta_data jsonb,
  p_email_confirmed_at timestamptz,
  p_confirmed_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_source text := coalesce(nullif(p_app_meta_data ->> 'provision_source', ''), 'public_signup');
  v_role text;
  v_role_id uuid;
  v_is_confirmed boolean := p_email_confirmed_at is not null or p_confirmed_at is not null;
begin
  if v_source not in ('public_signup', 'admin_create', 'invite') then
    raise exception 'Invalid provision_source: %', v_source
      using errcode = '22023';
  end if;

  if v_source = 'invite' then
    -- Invite acceptance will get an explicit provisioning path later.
    return;
  end if;

  if v_source = 'public_signup' and not v_is_confirmed then
    return;
  end if;

  if v_source = 'admin_create' then
    v_role := nullif(p_app_meta_data ->> 'provision_role', '');
    if v_role is null then
      raise exception 'admin_create provisioning requires provision_role'
        using errcode = '22023';
    end if;
  else
    v_role := coalesce(nullif(p_app_meta_data ->> 'provision_role', ''), 'student');
  end if;

  if v_role not in ('student', 'teacher', 'manager', 'admin') then
    raise exception 'Invalid provision_role: %', v_role
      using errcode = '22023';
  end if;

  select r.id
    into v_role_id
  from public.roles r
  where r.key = v_role;

  if v_role_id is null then
    raise exception 'Provisioning role is not configured: %', v_role
      using errcode = '23503';
  end if;

  if v_role = 'student' then
    if exists (
      select 1
      from public.teachers
      where profile_id = p_user_id
    ) then
      raise exception 'Cannot provision user % as student because teacher identity already exists', p_user_id
        using errcode = '23514';
    end if;
  elsif v_role = 'teacher' then
    if exists (
      select 1
      from public.students
      where profile_id = p_user_id
    ) then
      raise exception 'Cannot provision user % as teacher because student identity already exists', p_user_id
        using errcode = '23514';
    end if;
  elsif exists (
    select 1
    from public.students
    where profile_id = p_user_id
  ) or exists (
    select 1
    from public.teachers
    where profile_id = p_user_id
  ) then
    raise exception 'Cannot provision user % as % because linked student/teacher identity already exists', p_user_id, v_role
      using errcode = '23514';
  end if;

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
    p_user_id,
    p_email,
    coalesce(p_user_meta_data ->> 'first_name', ''),
    coalesce(p_user_meta_data ->> 'last_name', ''),
    coalesce(
      nullif(p_user_meta_data ->> 'display_name', ''),
      split_part(coalesce(p_email, ''), '@', 1)
    ),
    v_role,
    'active'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status;

  delete from public.user_roles
  where user_id = p_user_id
    and role_id <> v_role_id;

  insert into public.user_roles (user_id, role_id)
  values (p_user_id, v_role_id)
  on conflict (user_id, role_id) do nothing;

  if v_role = 'student' then
    insert into public.students (profile_id)
    values (p_user_id)
    on conflict (profile_id) do nothing;
  elsif v_role = 'teacher' then
    insert into public.teachers (profile_id)
    values (p_user_id)
    on conflict (profile_id) do nothing;
  end if;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.apply_user_provisioning(
    new.id,
    new.email,
    new.raw_user_meta_data,
    new.raw_app_meta_data,
    new.email_confirmed_at,
    new.confirmed_at
  );
  return new;
exception
  when others then
    raise exception 'User provisioning failed: %', sqlerrm
      using errcode = sqlstate;
end;
$$;

create or replace function public.handle_user_provision_metadata_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (old.raw_app_meta_data ->> 'provision_role')
      is distinct from
     (new.raw_app_meta_data ->> 'provision_role')
     or
     (old.raw_app_meta_data ->> 'provision_source')
      is distinct from
     (new.raw_app_meta_data ->> 'provision_source') then
    perform public.apply_user_provisioning(
      new.id,
      new.email,
      new.raw_user_meta_data,
      new.raw_app_meta_data,
      new.email_confirmed_at,
      new.confirmed_at
    );
  end if;

  return new;
exception
  when others then
    raise exception 'User provisioning metadata reconciliation failed: %', sqlerrm
      using errcode = sqlstate;
end;
$$;

create or replace function public.handle_user_confirmation_provisioning()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    old.email_confirmed_at is null
    and new.email_confirmed_at is not null
  ) or (
    old.confirmed_at is null
    and new.confirmed_at is not null
  ) then
    perform public.apply_user_provisioning(
      new.id,
      new.email,
      new.raw_user_meta_data,
      new.raw_app_meta_data,
      new.email_confirmed_at,
      new.confirmed_at
    );
  end if;

  return new;
exception
  when others then
    raise exception 'User confirmation provisioning failed: %', sqlerrm
      using errcode = sqlstate;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_provision_role_updated on auth.users;
drop trigger if exists on_auth_user_provision_metadata_updated on auth.users;
create trigger on_auth_user_provision_metadata_updated
after update of raw_app_meta_data on auth.users
for each row execute function public.handle_user_provision_metadata_update();

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
after update of email_confirmed_at, confirmed_at on auth.users
for each row execute function public.handle_user_confirmation_provisioning();

drop function if exists public.handle_user_provision_role_update();
drop function if exists public.apply_user_provisioning(uuid, text, jsonb, jsonb);

revoke all on function public.apply_user_provisioning(uuid, text, jsonb, jsonb, timestamptz, timestamptz) from public;
revoke all on function public.apply_user_provisioning(uuid, text, jsonb, jsonb, timestamptz, timestamptz) from anon;
revoke all on function public.apply_user_provisioning(uuid, text, jsonb, jsonb, timestamptz, timestamptz) from authenticated;
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;
revoke all on function public.handle_user_provision_metadata_update() from public;
revoke all on function public.handle_user_provision_metadata_update() from anon;
revoke all on function public.handle_user_provision_metadata_update() from authenticated;
revoke all on function public.handle_user_confirmation_provisioning() from public;
revoke all on function public.handle_user_confirmation_provisioning() from anon;
revoke all on function public.handle_user_confirmation_provisioning() from authenticated;

commit;
