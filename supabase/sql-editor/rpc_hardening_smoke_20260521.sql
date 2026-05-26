-- PR15A production-safe RPC hardening smoke.
--
-- Run after the PR15A migration and follow-up anon search grant are applied. The script creates deterministic
-- smoke fixtures inside one transaction, simulates authenticated JWT contexts,
-- and rolls back so no smoke accounts or rows persist.
--
-- Expected result: the final result set says "rpc hardening smoke checks passed".
-- Any raised exception is a failing smoke result.

begin;

create temp table rpc_hardening_smoke_report (
  check_name text primary key,
  ok boolean not null,
  details text
) on commit drop;

create or replace function pg_temp.rpc_hardening_smoke_assert(
  p_ok boolean,
  p_check_name text,
  p_details text default null
)
returns void
language plpgsql
as $$
begin
  insert into pg_temp.rpc_hardening_smoke_report (check_name, ok, details)
  values (p_check_name, coalesce(p_ok, false), p_details)
  on conflict (check_name) do update
  set
    ok = excluded.ok,
    details = excluded.details;

  if not coalesce(p_ok, false) then
    raise exception 'RPC hardening smoke failed: % %', p_check_name, coalesce(p_details, '');
  end if;
end;
$$;

create temp table rpc_hardening_smoke_ids (
  key text primary key,
  id uuid not null
) on commit drop;

grant select, insert, update on table rpc_hardening_smoke_report to authenticated, anon;
grant select on table rpc_hardening_smoke_ids to authenticated, anon;
grant execute on function pg_temp.rpc_hardening_smoke_assert(boolean, text, text) to authenticated, anon;

insert into rpc_hardening_smoke_ids (key, id)
values
  ('plain_profile', '00000000-0000-4000-8000-000000152001'),
  ('admin_profile', '00000000-0000-4000-8000-000000152002'),
  ('other_student_profile', '00000000-0000-4000-8000-000000152003'),
  ('other_student', '00000000-0000-4000-8000-000000152101'),
  ('staff_doc', '00000000-0000-4000-8000-000000152201'),
  ('student_doc', '00000000-0000-4000-8000-000000152202'),
  ('public_doc', '00000000-0000-4000-8000-000000152203');

select pg_temp.rpc_hardening_smoke_assert(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'search_documents_query_for_actor'
  ),
  'search_documents_query_for_actor exists',
  null
);

select pg_temp.rpc_hardening_smoke_assert(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'admin_dashboard_metrics'
  ),
  'admin_dashboard_metrics exists',
  null
);

select pg_temp.rpc_hardening_smoke_assert(
  has_function_privilege('anon', 'public.search_documents_query_for_actor(text, integer, text, boolean, text, text[], uuid, uuid, uuid[])', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.search_documents_query_for_actor(text, integer, text, boolean, text, text[], uuid, uuid, uuid[])', 'EXECUTE'),
  'search RPC is executable by anon and authenticated',
  null
);

select pg_temp.rpc_hardening_smoke_assert(
  not has_function_privilege('anon', 'public.admin_dashboard_metrics(timestamptz)', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.admin_dashboard_metrics(timestamptz)', 'EXECUTE'),
  'dashboard metrics RPC is not executable by anon and is executable by authenticated',
  null
);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
select
  i.id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'rpc-hardening-smoke-' || i.key || '@example.invalid',
  'rpc-hardening-smoke-placeholder',
  now(),
  now(),
  now()
from rpc_hardening_smoke_ids i
where i.key in ('plain_profile', 'admin_profile', 'other_student_profile')
on conflict (id) do update
set
  email = excluded.email,
  updated_at = now();

insert into public.profiles (
  id,
  email,
  first_name,
  last_name,
  display_name,
  role,
  created_at,
  updated_at
)
values
  ((select id from rpc_hardening_smoke_ids where key = 'plain_profile'), 'rpc-hardening-smoke-plain@example.invalid', 'RPC', 'Plain', 'RPC Plain', 'student', now(), now()),
  ((select id from rpc_hardening_smoke_ids where key = 'admin_profile'), 'rpc-hardening-smoke-admin@example.invalid', 'RPC', 'Admin', 'RPC Admin', 'student', now(), now()),
  ((select id from rpc_hardening_smoke_ids where key = 'other_student_profile'), 'rpc-hardening-smoke-other-student@example.invalid', 'RPC', 'Other Student', 'RPC Other Student', 'student', now(), now())
on conflict (id) do update
set
  email = excluded.email,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  display_name = excluded.display_name,
  role = excluded.role,
  updated_at = now();

insert into public.user_roles (user_id, role_id)
select ids.id, roles.id
from rpc_hardening_smoke_ids ids
join public.roles roles
  on roles.key = 'admin'
where ids.key = 'admin_profile'
on conflict do nothing;

insert into public.students (
  id,
  profile_id,
  birth_date,
  english_level,
  target_level,
  learning_goal,
  primary_teacher_id,
  created_at,
  updated_at
)
values (
  (select id from rpc_hardening_smoke_ids where key = 'other_student'),
  (select id from rpc_hardening_smoke_ids where key = 'other_student_profile'),
  date '2012-01-01',
  'A1',
  'B1',
  'RPC hardening smoke student',
  null,
  now(),
  now()
)
on conflict (id) do update
set
  profile_id = excluded.profile_id,
  primary_teacher_id = excluded.primary_teacher_id,
  updated_at = now();

insert into public.search_documents (
  id,
  entity_type,
  entity_id,
  title,
  subtitle,
  body,
  href,
  section,
  role_scope,
  visibility,
  owner_student_id,
  is_published,
  meta,
  updated_at
)
values
  (
    (select id from rpc_hardening_smoke_ids where key = 'public_doc'),
    'rpc_hardening_public_doc',
    (select id from rpc_hardening_smoke_ids where key = 'public_doc'),
    'PR15A RPC hardening public needle',
    'Public search document',
    'Anonymous callers may see this published public search document.',
    '/articles/rpc-hardening-smoke',
    'blog',
    array['all']::text[],
    'public',
    null,
    true,
    '{"rpc_hardening_smoke": true}'::jsonb,
    now()
  ),
  (
    (select id from rpc_hardening_smoke_ids where key = 'staff_doc'),
    'rpc_hardening_staff_doc',
    (select id from rpc_hardening_smoke_ids where key = 'staff_doc'),
    'PR15A RPC hardening staff needle',
    'Private staff document',
    'Direct callers must not reveal this staff-scoped document by spoofing capabilities.',
    '/admin/rpc-hardening-smoke',
    'admin',
    array['admin']::text[],
    'role',
    null,
    true,
    '{"rpc_hardening_smoke": true}'::jsonb,
    now()
  ),
  (
    (select id from rpc_hardening_smoke_ids where key = 'student_doc'),
    'rpc_hardening_student_doc',
    (select id from rpc_hardening_smoke_ids where key = 'student_doc'),
    'PR15A RPC hardening student needle',
    'Private student document',
    'Direct callers must not reveal this student-owned document by spoofing student identifiers.',
    '/students/rpc-hardening-smoke',
    'admin',
    array['student']::text[],
    'student_owned',
    (select id from rpc_hardening_smoke_ids where key = 'other_student'),
    true,
    '{"rpc_hardening_smoke": true}'::jsonb,
    now()
  )
on conflict (id) do update
set
  entity_type = excluded.entity_type,
  entity_id = excluded.entity_id,
  title = excluded.title,
  subtitle = excluded.subtitle,
  body = excluded.body,
  href = excluded.href,
  section = excluded.section,
  role_scope = excluded.role_scope,
  visibility = excluded.visibility,
  owner_student_id = excluded.owner_student_id,
  is_published = excluded.is_published,
  meta = excluded.meta,
  updated_at = now();

set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);

select pg_temp.rpc_hardening_smoke_assert(
  (
    select count(*)
    from public.search_documents_query_for_actor(
      'PR15A RPC hardening',
      25,
      'all',
      true,
      'admin',
      array['staff_admin', 'student', 'teacher']::text[],
      (select id from rpc_hardening_smoke_ids where key = 'other_student'),
      (select id from rpc_hardening_smoke_ids where key = 'other_student'),
      array[(select id from rpc_hardening_smoke_ids where key = 'other_student')]::uuid[]
    )
    where id = (select id from rpc_hardening_smoke_ids where key = 'public_doc')
  ) = 1
  and (
    select count(*)
    from public.search_documents_query_for_actor(
      'PR15A RPC hardening',
      25,
      'all',
      true,
      'admin',
      array['staff_admin', 'student', 'teacher']::text[],
      (select id from rpc_hardening_smoke_ids where key = 'other_student'),
      (select id from rpc_hardening_smoke_ids where key = 'other_student'),
      array[(select id from rpc_hardening_smoke_ids where key = 'other_student')]::uuid[]
    )
    where id in (
      (select id from rpc_hardening_smoke_ids where key = 'staff_doc'),
      (select id from rpc_hardening_smoke_ids where key = 'student_doc')
    )
  ) = 0,
  'anon caller gets public-only search results even with spoofed privileged parameters',
  null
);

reset role;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', (select id::text from rpc_hardening_smoke_ids where key = 'plain_profile'), true);

select pg_temp.rpc_hardening_smoke_assert(
  (
    select count(*)
    from public.search_documents_query_for_actor(
      'PR15A RPC hardening',
      25,
      'all',
      true,
      'admin',
      array['staff_admin', 'student', 'teacher']::text[],
      (select id from rpc_hardening_smoke_ids where key = 'other_student'),
      (select id from rpc_hardening_smoke_ids where key = 'other_student'),
      array[(select id from rpc_hardening_smoke_ids where key = 'other_student')]::uuid[]
    )
    where id in (
      (select id from rpc_hardening_smoke_ids where key = 'staff_doc'),
      (select id from rpc_hardening_smoke_ids where key = 'student_doc')
    )
  ) = 0,
  'plain authenticated caller cannot spoof search staff/student visibility',
  null
);

do $$
declare
  v_blocked boolean := false;
begin
  begin
    perform 1 from public.admin_dashboard_metrics(now()) limit 1;
  exception
    when insufficient_privilege then
      v_blocked := true;
  end;

  perform pg_temp.rpc_hardening_smoke_assert(
    v_blocked,
    'plain authenticated caller cannot execute dashboard metrics',
    null
  );
end;
$$;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', (select id::text from rpc_hardening_smoke_ids where key = 'admin_profile'), true);

select pg_temp.rpc_hardening_smoke_assert(
  (
    select count(*)
    from public.search_documents_query_for_actor(
      'PR15A RPC hardening',
      25,
      'all',
      false,
      null,
      array[]::text[],
      null,
      null,
      array[]::uuid[]
    )
    where id in (
      (select id from rpc_hardening_smoke_ids where key = 'staff_doc'),
      (select id from rpc_hardening_smoke_ids where key = 'student_doc')
    )
  ) = 2,
  'DB-granted admin can read staff-expanded search results without caller spoofing',
  null
);

select pg_temp.rpc_hardening_smoke_assert(
  (select count(*) from public.admin_dashboard_metrics(now())) = 1,
  'DB-granted admin can execute dashboard metrics',
  null
);

reset role;

select 'rpc hardening smoke checks passed' as status;

rollback;
