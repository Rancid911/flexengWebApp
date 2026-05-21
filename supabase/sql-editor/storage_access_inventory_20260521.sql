-- PR12E production-safe Supabase Storage access inventory.
--
-- This script is safe to run against the live production database because it:
-- - runs in a READ ONLY transaction;
-- - reads only storage metadata, pg_class and pg_policies;
-- - creates no fixtures;
-- - uploads/downloads/removes no objects;
-- - writes no production rows.
--
-- Expected result: the final result set says "storage metadata smoke checks passed".
-- Any raised exception is a failing smoke result and means migration drift or
-- an active storage policy regression that should be fixed in a focused DB PR.

begin read only;

select
  b.id as bucket_id,
  b.name as bucket_name,
  b.public as is_public
from storage.buckets b
where b.id in ('avatars', 'crm-assets')
order by b.id;

select
  policy.schemaname,
  policy.tablename,
  policy.policyname,
  policy.cmd,
  policy.roles as policy_roles,
  policy.qual,
  policy.with_check
from pg_policies policy
where policy.schemaname = 'storage'
  and policy.tablename = 'objects'
  and (
    policy.policyname like 'avatars_%'
    or policy.policyname like 'crm_assets_%'
  )
order by policy.policyname;

do $$
declare
  v_missing_buckets text;
begin
  select string_agg(required.bucket_id, ', ' order by required.bucket_id)
  into v_missing_buckets
  from (values ('avatars'), ('crm-assets')) as required(bucket_id)
  where not exists (
    select 1
    from storage.buckets b
    where b.id = required.bucket_id
  );

  if v_missing_buckets is not null then
    raise exception 'Storage metadata smoke failed: missing required buckets: %', v_missing_buckets;
  end if;

  raise notice 'Storage metadata smoke: required buckets exist';
end;
$$;

do $$
declare
  v_private_buckets text;
begin
  select string_agg(b.id, ', ' order by b.id)
  into v_private_buckets
  from storage.buckets b
  where b.id in ('avatars', 'crm-assets')
    and b.public is distinct from true;

  if v_private_buckets is not null then
    raise exception 'Storage metadata smoke failed: expected public bucket(s), found private: %', v_private_buckets;
  end if;

  raise notice 'Storage metadata smoke: avatars and crm-assets buckets are public as currently documented';
end;
$$;

do $$
declare
  v_storage_rls_enabled boolean;
begin
  select c.relrowsecurity
  into v_storage_rls_enabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'storage'
    and c.relname = 'objects';

  if v_storage_rls_enabled is distinct from true then
    raise exception 'Storage metadata smoke failed: RLS is disabled on storage.objects';
  end if;

  raise notice 'Storage metadata smoke: storage.objects RLS is enabled';
end;
$$;

do $$
declare
  v_missing_avatar_policies text;
begin
  with required_policies(policyname, cmd) as (
    values
      ('avatars_select_own', 'SELECT'),
      ('avatars_insert_own', 'INSERT'),
      ('avatars_update_own', 'UPDATE'),
      ('avatars_delete_own', 'DELETE')
  )
  select string_agg(format('%s/%s', required_policies.policyname, required_policies.cmd), ', ' order by required_policies.policyname)
  into v_missing_avatar_policies
  from required_policies
  where not exists (
    select 1
    from pg_policies policy
    where policy.schemaname = 'storage'
      and policy.tablename = 'objects'
      and policy.policyname = required_policies.policyname
      and policy.cmd = required_policies.cmd
      and (coalesce(policy.qual, '') || ' ' || coalesce(policy.with_check, '')) like '%bucket_id = ''avatars''%'
      and (coalesce(policy.qual, '') || ' ' || coalesce(policy.with_check, '')) like '%auth.uid()%'
      and (coalesce(policy.qual, '') || ' ' || coalesce(policy.with_check, '')) like '%storage.foldername(name)%'
  );

  if v_missing_avatar_policies is not null then
    raise exception 'Storage metadata smoke failed: missing or unexpected avatars own-user policies: %', v_missing_avatar_policies;
  end if;

  raise notice 'Storage metadata smoke: avatars own-user select/insert/update/delete policies are active';
end;
$$;

do $$
declare
  v_missing_crm_public_select text;
begin
  select case
    when exists (
      select 1
      from pg_policies policy
      where policy.schemaname = 'storage'
        and policy.tablename = 'objects'
        and policy.policyname = 'crm_assets_public_select'
        and policy.cmd = 'SELECT'
        and policy.roles && array['public'::name]
        and coalesce(policy.qual, '') like '%bucket_id = ''crm-assets''%'
    )
    then null
    else 'crm_assets_public_select'
  end
  into v_missing_crm_public_select;

  if v_missing_crm_public_select is not null then
    raise exception 'Storage metadata smoke failed: missing expected crm-assets public select policy: %', v_missing_crm_public_select;
  end if;

  raise notice 'Storage metadata smoke: crm-assets public select policy is active as currently documented';
end;
$$;

do $$
declare
  v_missing_crm_manage_policies text;
begin
  with required_policies(policyname, cmd) as (
    values
      ('crm_assets_insert_manage', 'INSERT'),
      ('crm_assets_update_manage', 'UPDATE'),
      ('crm_assets_delete_manage', 'DELETE')
  )
  select string_agg(format('%s/%s', required_policies.policyname, required_policies.cmd), ', ' order by required_policies.policyname)
  into v_missing_crm_manage_policies
  from required_policies
  where not exists (
    select 1
    from pg_policies policy
    where policy.schemaname = 'storage'
      and policy.tablename = 'objects'
      and policy.policyname = required_policies.policyname
      and policy.cmd = required_policies.cmd
      and (coalesce(policy.qual, '') || ' ' || coalesce(policy.with_check, '')) like '%bucket_id = ''crm-assets''%'
      and (coalesce(policy.qual, '') || ' ' || coalesce(policy.with_check, '')) like '%app_private.has_permission%'
      and (coalesce(policy.qual, '') || ' ' || coalesce(policy.with_check, '')) like '%crm.leads.manage%'
      and (coalesce(policy.qual, '') || ' ' || coalesce(policy.with_check, '')) like '%all%'
  );

  if v_missing_crm_manage_policies is not null then
    raise exception 'Storage metadata smoke failed: missing or unexpected crm-assets RBAC manage policies: %', v_missing_crm_manage_policies;
  end if;

  raise notice 'Storage metadata smoke: crm-assets writes use app_private.has_permission(''crm.leads.manage'', ''all'')';
end;
$$;

do $$
declare
  v_legacy_policies text;
begin
  select string_agg(policy.policyname, ', ' order by policy.policyname)
  into v_legacy_policies
  from pg_policies policy
  where policy.schemaname = 'storage'
    and policy.tablename = 'objects'
    and policy.policyname like 'crm_assets_manager_admin_%';

  if v_legacy_policies is not null then
    raise exception 'Storage metadata smoke failed: legacy CRM asset raw-role policies remain active: %', v_legacy_policies;
  end if;

  raise notice 'Storage metadata smoke: no legacy CRM asset raw-role policies are active';
end;
$$;

do $$
declare
  v_raw_role_policies text;
begin
  select string_agg(policy.policyname, ', ' order by policy.policyname)
  into v_raw_role_policies
  from pg_policies policy
  where policy.schemaname = 'storage'
    and policy.tablename = 'objects'
    and policy.policyname like 'crm_assets_%'
    and policy.cmd in ('INSERT', 'UPDATE', 'DELETE')
    and (
      coalesce(policy.qual, '') ~* '(profiles\.role|(^|[^[:alnum:]_])p\.role|role[[:space:]]+in[[:space:]]*\(''manager''[[:space:]]*,[[:space:]]*''admin''\))'
      or coalesce(policy.with_check, '') ~* '(profiles\.role|(^|[^[:alnum:]_])p\.role|role[[:space:]]+in[[:space:]]*\(''manager''[[:space:]]*,[[:space:]]*''admin''\))'
    );

  if v_raw_role_policies is not null then
    raise exception 'Storage metadata smoke failed: active crm-assets write policies still use raw roles: %', v_raw_role_policies;
  end if;

  raise notice 'Storage metadata smoke: crm-assets write policies do not use raw role checks';
end;
$$;

select 'storage metadata smoke checks passed' as status;

rollback;
