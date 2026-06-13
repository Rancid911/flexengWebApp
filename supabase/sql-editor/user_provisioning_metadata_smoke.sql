-- Production-safe metadata and drift smoke for reliable user provisioning.

do $$
declare
  v_handle_definition text;
  v_apply_definition text;
begin
  select pg_get_functiondef(p.oid)
    into v_handle_definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'handle_new_user'
    and p.pronargs = 0;

  if v_handle_definition is null then
    raise exception 'handle_new_user() is missing';
  end if;

  select pg_get_functiondef(p.oid)
    into v_apply_definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'apply_user_provisioning'
    and p.pronargs = 6;

  if v_apply_definition is null then
    raise exception 'source-aware apply_user_provisioning() is missing';
  end if;

  if v_apply_definition not like '%provision_source%'
    or v_apply_definition not like '%public_signup%'
    or v_apply_definition not like '%email_confirmed_at%'
    or v_apply_definition not like '%insert into public.user_roles%'
    or v_apply_definition not like '%insert into public.students%'
    or v_apply_definition not like '%insert into public.teachers%'
    or v_apply_definition like '%raw_user_meta_data ->> ''role''%'
    or v_apply_definition like '%raw_user_meta_data ->> ''provision_source''%' then
    raise exception 'apply_user_provisioning() does not match reliable provisioning contract';
  end if;

  if not exists (
    select 1
    from information_schema.triggers
    where event_object_schema = 'auth'
      and event_object_table = 'users'
      and trigger_name = 'on_auth_user_created'
  ) then
    raise exception 'on_auth_user_created trigger is missing';
  end if;

  if not exists (
    select 1
    from information_schema.triggers
    where event_object_schema = 'auth'
      and event_object_table = 'users'
      and trigger_name = 'on_auth_user_confirmed'
  ) then
    raise exception 'on_auth_user_confirmed trigger is missing';
  end if;

  if has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE') then
    raise exception 'handle_new_user() is directly executable by application roles';
  end if;

  if has_function_privilege('anon', 'public.apply_user_provisioning(uuid, text, jsonb, jsonb, timestamptz, timestamptz)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.apply_user_provisioning(uuid, text, jsonb, jsonb, timestamptz, timestamptz)', 'EXECUTE') then
    raise exception 'apply_user_provisioning() is directly executable by application roles';
  end if;

  if to_regclass('public.audit_log') is null then
    raise exception 'audit_log is missing';
  end if;

  if exists (
    select 1
    from public.profiles p
    left join public.students s on s.profile_id = p.id
    left join public.teachers t on t.profile_id = p.id
    where (p.role = 'student' and s.id is null)
      or (p.role = 'teacher' and t.id is null)
      or (s.id is not null and t.id is not null)
  ) then
    raise exception 'linked identity provisioning drift detected';
  end if;

  if exists (
    select 1
    from public.profiles p
    where not exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = p.id
        and r.key = p.role
    )
  ) then
    raise exception 'RBAC provisioning drift detected';
  end if;
end;
$$;

select 'status: user provisioning metadata smoke checks passed' as status;
