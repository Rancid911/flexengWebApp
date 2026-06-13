begin;

create or replace function public.apply_user_provisioning(
  p_user_id uuid,
  p_email text,
  p_user_meta_data jsonb,
  p_app_meta_data jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := coalesce(nullif(p_app_meta_data ->> 'provision_role', ''), 'student');
  v_role_id uuid;
begin
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
    delete from public.teachers where profile_id = p_user_id;
    insert into public.students (profile_id)
    values (p_user_id)
    on conflict (profile_id) do nothing;
  elsif v_role = 'teacher' then
    delete from public.students where profile_id = p_user_id;
    insert into public.teachers (profile_id)
    values (p_user_id)
    on conflict (profile_id) do nothing;
  else
    delete from public.students where profile_id = p_user_id;
    delete from public.teachers where profile_id = p_user_id;
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
    new.raw_app_meta_data
  );
  return new;
exception
  when others then
    raise exception 'User provisioning failed: %', sqlerrm
      using errcode = sqlstate;
end;
$$;

create or replace function public.handle_user_provision_role_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (old.raw_app_meta_data ->> 'provision_role')
      is distinct from
     (new.raw_app_meta_data ->> 'provision_role') then
    perform public.apply_user_provisioning(
      new.id,
      new.email,
      new.raw_user_meta_data,
      new.raw_app_meta_data
    );
  end if;

  return new;
exception
  when others then
    raise exception 'User provision_role reconciliation failed: %', sqlerrm
      using errcode = sqlstate;
end;
$$;

drop trigger if exists on_auth_user_provision_role_updated on auth.users;
create trigger on_auth_user_provision_role_updated
after update of raw_app_meta_data on auth.users
for each row execute function public.handle_user_provision_role_update();

revoke all on function public.apply_user_provisioning(uuid, text, jsonb, jsonb) from public;
revoke all on function public.apply_user_provisioning(uuid, text, jsonb, jsonb) from anon;
revoke all on function public.apply_user_provisioning(uuid, text, jsonb, jsonb) from authenticated;
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;
revoke all on function public.handle_user_provision_role_update() from public;
revoke all on function public.handle_user_provision_role_update() from anon;
revoke all on function public.handle_user_provision_role_update() from authenticated;

commit;
