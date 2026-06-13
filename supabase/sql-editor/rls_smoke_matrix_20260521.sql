-- PR12A live RLS smoke matrix.
--
-- Run this after all migrations are applied. The script is verification-only:
-- it creates deterministic smoke fixtures inside one transaction, simulates
-- authenticated JWT contexts with SET LOCAL ROLE, then rolls the transaction
-- back so no smoke accounts or rows persist.
--
-- Expected result: the final result set says "rls smoke checks passed".
-- Any raised exception is a failing smoke result.

begin;

create temp table rls_smoke_report (
  check_name text primary key,
  ok boolean not null,
  details text
) on commit drop;

create or replace function pg_temp.rls_smoke_assert(
  p_ok boolean,
  p_check_name text,
  p_details text default null
)
returns void
language plpgsql
as $$
begin
  insert into pg_temp.rls_smoke_report (check_name, ok, details)
  values (p_check_name, coalesce(p_ok, false), p_details)
  on conflict (check_name) do update
  set
    ok = excluded.ok,
    details = excluded.details;

  if not coalesce(p_ok, false) then
    raise exception 'RLS smoke failed: % %', p_check_name, coalesce(p_details, '');
  end if;
end;
$$;

create temp table rls_smoke_ids (
  key text primary key,
  id uuid not null
) on commit drop;

insert into rls_smoke_ids (key, id)
values
  ('student_profile', '00000000-0000-4000-8000-000000012001'),
  ('other_student_profile', '00000000-0000-4000-8000-000000012002'),
  ('teacher_profile', '00000000-0000-4000-8000-000000012003'),
  ('manager_profile', '00000000-0000-4000-8000-000000012004'),
  ('admin_profile', '00000000-0000-4000-8000-000000012005'),
  ('student', '00000000-0000-4000-8000-000000022001'),
  ('other_student', '00000000-0000-4000-8000-000000022002'),
  ('teacher', '00000000-0000-4000-8000-000000023001'),
  ('homework', '00000000-0000-4000-8000-000000032001'),
  ('other_homework', '00000000-0000-4000-8000-000000032002'),
  ('homework_item', '00000000-0000-4000-8000-000000033001'),
  ('other_homework_item', '00000000-0000-4000-8000-000000033002'),
  ('homework_progress', '00000000-0000-4000-8000-000000034001'),
  ('lesson', '00000000-0000-4000-8000-000000042001'),
  ('other_lesson', '00000000-0000-4000-8000-000000042002'),
  ('attendance', '00000000-0000-4000-8000-000000043001'),
  ('outcome', '00000000-0000-4000-8000-000000044001'),
  ('note', '00000000-0000-4000-8000-000000045001'),
  ('billing_account', '00000000-0000-4000-8000-000000052001'),
  ('billing_ledger', '00000000-0000-4000-8000-000000053001'),
  ('payment_plan', '00000000-0000-4000-8000-000000054001'),
  ('payment_transaction', '00000000-0000-4000-8000-000000055001'),
  ('payment_webhook_event', '00000000-0000-4000-8000-000000056001'),
  ('crm_lead', '00000000-0000-4000-8000-000000062001'),
  ('crm_comment', '00000000-0000-4000-8000-000000063001'),
  ('crm_history', '00000000-0000-4000-8000-000000064001'),
  ('notification', '00000000-0000-4000-8000-000000072001'),
  ('search_document', '00000000-0000-4000-8000-000000082001');

create temp table rls_smoke_required_tables (table_name text primary key) on commit drop;

insert into rls_smoke_required_tables (table_name)
values
  ('profiles'),
  ('roles'),
  ('permissions'),
  ('user_roles'),
  ('role_permissions'),
  ('students'),
  ('teachers'),
  ('teacher_student_notes'),
  ('teacher_dossiers'),
  ('student_test_attempts'),
  ('student_test_answers'),
  ('student_mistakes'),
  ('student_words'),
  ('student_word_reviews'),
  ('student_homework_progress'),
  ('homework_assignments'),
  ('homework_items'),
  ('student_schedule_lessons'),
  ('lesson_attendance'),
  ('lesson_outcomes'),
  ('student_billing_accounts'),
  ('student_billing_ledger'),
  ('payment_plans'),
  ('payment_transactions'),
  ('payment_webhook_events'),
  ('student_payment_reminder_state'),
  ('admin_payment_reminder_settings'),
  ('crm_leads'),
  ('crm_lead_comments'),
  ('crm_lead_status_history'),
  ('crm_settings'),
  ('notifications'),
  ('notification_user_state'),
  ('search_documents');

create temp table rls_smoke_optional_tables (table_name text primary key) on commit drop;

insert into rls_smoke_optional_tables (table_name)
values
  ('blog_posts'),
  ('blog_categories'),
  ('blog_tags'),
  ('blog_post_tags'),
  ('word_card_sets'),
  ('word_card_items'),
  ('courses'),
  ('course_modules'),
  ('lessons'),
  ('tests'),
  ('test_questions'),
  ('test_question_options');

select pg_temp.rls_smoke_assert(
  not exists (
    select 1
    from rls_smoke_required_tables t
    where to_regclass('public.' || t.table_name) is null
  ),
  'required RLS smoke tables exist',
  (
    select string_agg(t.table_name, ', ' order by t.table_name)
    from rls_smoke_required_tables t
    where to_regclass('public.' || t.table_name) is null
  )
);

select pg_temp.rls_smoke_assert(
  not exists (
    select 1
    from (
      select table_name from rls_smoke_required_tables
      union
      select table_name
      from rls_smoke_optional_tables
      where to_regclass('public.' || table_name) is not null
    ) t
    join pg_class c on c.oid = to_regclass('public.' || t.table_name)
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and c.relrowsecurity = false
  ),
  'critical and present optional public tables have RLS enabled',
  (
    select string_agg(t.table_name, ', ' order by t.table_name)
    from (
      select table_name from rls_smoke_required_tables
      union
      select table_name
      from rls_smoke_optional_tables
      where to_regclass('public.' || table_name) is not null
    ) t
    join pg_class c on c.oid = to_regclass('public.' || t.table_name)
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and c.relrowsecurity = false
  )
);

select pg_temp.rls_smoke_assert(
  not exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename in (
        select table_name from rls_smoke_required_tables
        union
        select table_name
        from rls_smoke_optional_tables
        where to_regclass('public.' || table_name) is not null
      )
      and (
        coalesce(p.qual, '') ~* '(profiles\.role|(^|[^[:alnum:]_])p\.role|role[[:space:]]+in[[:space:]]*\(''manager''[[:space:]]*,[[:space:]]*''admin''\))'
        or coalesce(p.with_check, '') ~* '(profiles\.role|(^|[^[:alnum:]_])p\.role|role[[:space:]]+in[[:space:]]*\(''manager''[[:space:]]*,[[:space:]]*''admin''\))'
      )
  ),
  'no active replaced-domain raw-role policies',
  (
    select string_agg(format('%I.%I:%I', p.schemaname, p.tablename, p.policyname), ', ' order by p.tablename, p.policyname)
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename in (
        select table_name from rls_smoke_required_tables
        union
        select table_name
        from rls_smoke_optional_tables
        where to_regclass('public.' || table_name) is not null
      )
      and (
        coalesce(p.qual, '') ~* '(profiles\.role|(^|[^[:alnum:]_])p\.role|role[[:space:]]+in[[:space:]]*\(''manager''[[:space:]]*,[[:space:]]*''admin''\))'
        or coalesce(p.with_check, '') ~* '(profiles\.role|(^|[^[:alnum:]_])p\.role|role[[:space:]]+in[[:space:]]*\(''manager''[[:space:]]*,[[:space:]]*''admin''\))'
      )
  )
);

select pg_temp.rls_smoke_assert(
  exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename in ('crm_leads', 'crm_lead_comments', 'crm_lead_status_history', 'crm_settings')
      and (coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')) like '%app_private.has_permission%'
  ),
  'CRM policies use RBAC helper',
  null
);

select pg_temp.rls_smoke_assert(
  exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'notifications'
      and (coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')) like '%app_private.has_permission%'
  ),
  'notification management policies use RBAC helper',
  null
);

select pg_temp.rls_smoke_assert(
  exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename in ('admin_payment_reminder_settings', 'student_payment_reminder_state')
      and (coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')) like '%app_private.has_permission%'
  ),
  'payment reminder policies use RBAC helper',
  null
);

select pg_temp.rls_smoke_assert(
  not exists (
    select 1
    from pg_policies pol
    where pol.schemaname = 'public'
      and pol.tablename = 'search_documents'
      and pol.roles && array['public'::name, 'anon'::name, 'authenticated'::name]
  ),
  'search_documents has no direct public/anon/authenticated table policy',
  (
    select string_agg(pol.policyname, ', ' order by pol.policyname)
    from pg_policies pol
    where pol.schemaname = 'public'
      and pol.tablename = 'search_documents'
      and pol.roles && array['public'::name, 'anon'::name, 'authenticated'::name]
  )
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
  'rls-smoke-' || i.key || '@example.invalid',
  'rls-smoke-placeholder',
  now(),
  now(),
  now()
from rls_smoke_ids i
where i.key in ('student_profile', 'other_student_profile', 'teacher_profile', 'manager_profile', 'admin_profile')
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
  ((select id from rls_smoke_ids where key = 'student_profile'), 'rls-smoke-student@example.invalid', 'RLS', 'Student', 'RLS Student', 'student', now() - interval '1 day', now()),
  ((select id from rls_smoke_ids where key = 'other_student_profile'), 'rls-smoke-other-student@example.invalid', 'RLS', 'Other Student', 'RLS Other Student', 'student', now() - interval '1 day', now()),
  ((select id from rls_smoke_ids where key = 'teacher_profile'), 'rls-smoke-teacher@example.invalid', 'RLS', 'Teacher', 'RLS Teacher', 'teacher', now() - interval '1 day', now()),
  -- Manager/admin intentionally keep profile.role = student. Access below must come
  -- from user_roles/role_permissions, not raw profile role checks.
  ((select id from rls_smoke_ids where key = 'manager_profile'), 'rls-smoke-manager@example.invalid', 'RLS', 'Manager', 'RLS Manager', 'student', now() - interval '1 day', now()),
  ((select id from rls_smoke_ids where key = 'admin_profile'), 'rls-smoke-admin@example.invalid', 'RLS', 'Admin', 'RLS Admin', 'student', now() - interval '1 day', now())
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
from (
  values
    ('student_profile', 'student'),
    ('other_student_profile', 'student'),
    ('teacher_profile', 'teacher'),
    ('manager_profile', 'manager'),
    ('admin_profile', 'admin')
) as wanted(user_key, role_key)
join rls_smoke_ids ids on ids.key = wanted.user_key
join public.roles roles on roles.key = wanted.role_key
on conflict do nothing;

insert into public.teachers (id, profile_id, created_at, updated_at)
values (
  (select id from rls_smoke_ids where key = 'teacher'),
  (select id from rls_smoke_ids where key = 'teacher_profile'),
  now(),
  now()
)
on conflict (id) do update
set
  profile_id = excluded.profile_id,
  updated_at = now();

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
values
  (
    (select id from rls_smoke_ids where key = 'student'),
    (select id from rls_smoke_ids where key = 'student_profile'),
    date '2012-01-01',
    'A1',
    'B1',
    'RLS smoke assigned student',
    (select id from rls_smoke_ids where key = 'teacher'),
    now(),
    now()
  ),
  (
    (select id from rls_smoke_ids where key = 'other_student'),
    (select id from rls_smoke_ids where key = 'other_student_profile'),
    date '2012-02-02',
    'A1',
    'B1',
    'RLS smoke unassigned student',
    null,
    now(),
    now()
  )
on conflict (id) do update
set
  profile_id = excluded.profile_id,
  primary_teacher_id = excluded.primary_teacher_id,
  updated_at = now();

insert into public.homework_assignments (
  id,
  student_id,
  assigned_by_profile_id,
  title,
  status,
  created_at,
  updated_at
)
values
  (
    (select id from rls_smoke_ids where key = 'homework'),
    (select id from rls_smoke_ids where key = 'student'),
    (select id from rls_smoke_ids where key = 'teacher_profile'),
    'RLS smoke homework',
    'not_started',
    now(),
    now()
  ),
  (
    (select id from rls_smoke_ids where key = 'other_homework'),
    (select id from rls_smoke_ids where key = 'other_student'),
    (select id from rls_smoke_ids where key = 'teacher_profile'),
    'RLS smoke other homework',
    'not_started',
    now(),
    now()
  )
on conflict (id) do update
set
  student_id = excluded.student_id,
  assigned_by_profile_id = excluded.assigned_by_profile_id,
  title = excluded.title,
  status = excluded.status,
  updated_at = now();

insert into public.homework_items (
  id,
  assignment_id,
  source_type,
  source_id,
  sort_order,
  required,
  created_at
)
values
  (
    (select id from rls_smoke_ids where key = 'homework_item'),
    (select id from rls_smoke_ids where key = 'homework'),
    'lesson',
    (select id from rls_smoke_ids where key = 'lesson'),
    1,
    true,
    now()
  ),
  (
    (select id from rls_smoke_ids where key = 'other_homework_item'),
    (select id from rls_smoke_ids where key = 'other_homework'),
    'lesson',
    (select id from rls_smoke_ids where key = 'other_lesson'),
    1,
    true,
    now()
  )
on conflict (id) do update
set
  assignment_id = excluded.assignment_id,
  source_type = excluded.source_type,
  source_id = excluded.source_id,
  sort_order = excluded.sort_order,
  required = excluded.required;

insert into public.student_homework_progress (
  id,
  assignment_id,
  homework_item_id,
  student_id,
  status,
  started_at,
  completed_at,
  created_at,
  updated_at
)
values (
  (select id from rls_smoke_ids where key = 'homework_progress'),
  (select id from rls_smoke_ids where key = 'homework'),
  (select id from rls_smoke_ids where key = 'homework_item'),
  (select id from rls_smoke_ids where key = 'student'),
  'in_progress',
  now(),
  null,
  now(),
  now()
)
on conflict (id) do update
set
  assignment_id = excluded.assignment_id,
  homework_item_id = excluded.homework_item_id,
  student_id = excluded.student_id,
  status = excluded.status,
  updated_at = now();

insert into public.student_schedule_lessons (
  id,
  student_id,
  teacher_id,
  title,
  starts_at,
  ends_at,
  status,
  created_by_profile_id,
  updated_by_profile_id,
  created_at,
  updated_at
)
values
  (
    (select id from rls_smoke_ids where key = 'lesson'),
    (select id from rls_smoke_ids where key = 'student'),
    (select id from rls_smoke_ids where key = 'teacher'),
    'RLS smoke assigned lesson',
    now() + interval '1 day',
    now() + interval '1 day 1 hour',
    'scheduled',
    (select id from rls_smoke_ids where key = 'teacher_profile'),
    (select id from rls_smoke_ids where key = 'teacher_profile'),
    now(),
    now()
  ),
  (
    (select id from rls_smoke_ids where key = 'other_lesson'),
    (select id from rls_smoke_ids where key = 'other_student'),
    (select id from rls_smoke_ids where key = 'teacher'),
    'RLS smoke unassigned lesson',
    now() + interval '2 days',
    now() + interval '2 days 1 hour',
    'scheduled',
    (select id from rls_smoke_ids where key = 'manager_profile'),
    (select id from rls_smoke_ids where key = 'manager_profile'),
    now(),
    now()
  )
on conflict (id) do update
set
  student_id = excluded.student_id,
  teacher_id = excluded.teacher_id,
  title = excluded.title,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  status = excluded.status,
  updated_at = now();

insert into public.lesson_attendance (
  id,
  schedule_lesson_id,
  student_id,
  teacher_id,
  status,
  marked_by_profile_id,
  marked_at,
  created_at,
  updated_at
)
values (
  (select id from rls_smoke_ids where key = 'attendance'),
  (select id from rls_smoke_ids where key = 'lesson'),
  (select id from rls_smoke_ids where key = 'student'),
  (select id from rls_smoke_ids where key = 'teacher'),
  'scheduled',
  (select id from rls_smoke_ids where key = 'teacher_profile'),
  now(),
  now(),
  now()
)
on conflict (id) do update
set
  schedule_lesson_id = excluded.schedule_lesson_id,
  student_id = excluded.student_id,
  teacher_id = excluded.teacher_id,
  status = excluded.status,
  updated_at = now();

insert into public.lesson_outcomes (
  id,
  schedule_lesson_id,
  student_id,
  teacher_id,
  summary,
  visible_to_student,
  created_by_profile_id,
  updated_by_profile_id,
  created_at,
  updated_at
)
values (
  (select id from rls_smoke_ids where key = 'outcome'),
  (select id from rls_smoke_ids where key = 'lesson'),
  (select id from rls_smoke_ids where key = 'student'),
  (select id from rls_smoke_ids where key = 'teacher'),
  'RLS smoke outcome',
  true,
  (select id from rls_smoke_ids where key = 'teacher_profile'),
  (select id from rls_smoke_ids where key = 'teacher_profile'),
  now(),
  now()
)
on conflict (id) do update
set
  schedule_lesson_id = excluded.schedule_lesson_id,
  student_id = excluded.student_id,
  teacher_id = excluded.teacher_id,
  summary = excluded.summary,
  visible_to_student = excluded.visible_to_student,
  updated_at = now();

insert into public.teacher_student_notes (
  id,
  student_id,
  teacher_id,
  body,
  visibility,
  created_by_profile_id,
  updated_by_profile_id,
  created_at,
  updated_at
)
values (
  (select id from rls_smoke_ids where key = 'note'),
  (select id from rls_smoke_ids where key = 'student'),
  (select id from rls_smoke_ids where key = 'teacher'),
  'RLS smoke teacher note',
  'private',
  (select id from rls_smoke_ids where key = 'teacher_profile'),
  (select id from rls_smoke_ids where key = 'teacher_profile'),
  now(),
  now()
)
on conflict (id) do update
set
  student_id = excluded.student_id,
  teacher_id = excluded.teacher_id,
  body = excluded.body,
  visibility = excluded.visibility,
  updated_at = now();

insert into public.student_billing_accounts (
  id,
  student_id,
  billing_mode,
  lesson_price_amount,
  currency,
  updated_by_profile_id,
  created_at,
  updated_at
)
values (
  (select id from rls_smoke_ids where key = 'billing_account'),
  (select id from rls_smoke_ids where key = 'student'),
  'per_lesson_price',
  2500,
  'RUB',
  (select id from rls_smoke_ids where key = 'manager_profile'),
  now(),
  now()
)
on conflict (id) do update
set
  student_id = excluded.student_id,
  billing_mode = excluded.billing_mode,
  lesson_price_amount = excluded.lesson_price_amount,
  currency = excluded.currency,
  updated_by_profile_id = excluded.updated_by_profile_id,
  updated_at = now();

insert into public.student_billing_ledger (
  id,
  student_id,
  entry_direction,
  unit_type,
  lesson_units,
  money_amount,
  reason,
  created_by_profile_id,
  description,
  created_at
)
values (
  (select id from rls_smoke_ids where key = 'billing_ledger'),
  (select id from rls_smoke_ids where key = 'student'),
  'credit',
  'money',
  null,
  2500,
  'manual_adjustment',
  (select id from rls_smoke_ids where key = 'manager_profile'),
  'RLS smoke ledger entry',
  now()
)
on conflict (id) do update
set
  student_id = excluded.student_id,
  entry_direction = excluded.entry_direction,
  unit_type = excluded.unit_type,
  money_amount = excluded.money_amount,
  reason = excluded.reason,
  created_by_profile_id = excluded.created_by_profile_id,
  description = excluded.description;

insert into public.payment_plans (
  id,
  title,
  description,
  amount,
  currency,
  yookassa_product_label,
  is_active,
  sort_order,
  metadata,
  created_at,
  updated_at
)
values (
  (select id from rls_smoke_ids where key = 'payment_plan'),
  'RLS smoke payment plan',
  'RLS smoke plan',
  2500,
  'RUB',
  'RLS smoke payment plan',
  true,
  9999,
  '{"rls_smoke": true}'::jsonb,
  now(),
  now()
)
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  amount = excluded.amount,
  currency = excluded.currency,
  yookassa_product_label = excluded.yookassa_product_label,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.payment_transactions (
  id,
  student_id,
  plan_id,
  amount,
  currency,
  status,
  created_at,
  updated_at
)
values (
  (select id from rls_smoke_ids where key = 'payment_transaction'),
  (select id from rls_smoke_ids where key = 'student'),
  (select id from rls_smoke_ids where key = 'payment_plan'),
  2500,
  'RUB',
  'pending',
  now(),
  now()
)
on conflict (id) do update
set
  student_id = excluded.student_id,
  plan_id = excluded.plan_id,
  amount = excluded.amount,
  currency = excluded.currency,
  status = excluded.status,
  updated_at = now();

insert into public.payment_webhook_events (
  id,
  provider,
  provider_event_id,
  event_type,
  payload,
  created_at
)
values (
  (select id from rls_smoke_ids where key = 'payment_webhook_event'),
  'rls_smoke',
  'rls-smoke-payment-webhook-event',
  'payment.succeeded',
  '{"rls_smoke": true}'::jsonb,
  now()
)
on conflict (id) do update
set
  provider = excluded.provider,
  provider_event_id = excluded.provider_event_id,
  event_type = excluded.event_type,
  payload = excluded.payload;

insert into public.student_payment_reminder_state (
  student_id,
  current_status,
  last_status_changed_at,
  last_threshold_lessons,
  updated_at
)
values (
  (select id from rls_smoke_ids where key = 'student'),
  'low_balance',
  now(),
  2,
  now()
)
on conflict (student_id) do update
set
  current_status = excluded.current_status,
  last_status_changed_at = excluded.last_status_changed_at,
  last_threshold_lessons = excluded.last_threshold_lessons,
  updated_at = now();

insert into public.crm_leads (
  id,
  name,
  phone,
  email,
  source,
  form_type,
  page_url,
  comment,
  metadata,
  status,
  created_at,
  updated_at
)
values (
  (select id from rls_smoke_ids where key = 'crm_lead'),
  'RLS Smoke Lead',
  '+79990000000',
  'rls-smoke-lead@example.invalid',
  'rls_smoke',
  'smoke',
  'https://example.invalid/rls-smoke',
  'RLS smoke lead',
  '{"rls_smoke": true}'::jsonb,
  'new_request',
  now(),
  now()
)
on conflict (id) do update
set
  name = excluded.name,
  phone = excluded.phone,
  email = excluded.email,
  source = excluded.source,
  form_type = excluded.form_type,
  page_url = excluded.page_url,
  comment = excluded.comment,
  metadata = excluded.metadata,
  status = excluded.status,
  updated_at = now();

insert into public.crm_lead_comments (id, lead_id, body, author_id, created_at)
values (
  (select id from rls_smoke_ids where key = 'crm_comment'),
  (select id from rls_smoke_ids where key = 'crm_lead'),
  'RLS smoke CRM comment',
  (select id from rls_smoke_ids where key = 'manager_profile'),
  now()
)
on conflict (id) do update
set
  lead_id = excluded.lead_id,
  body = excluded.body,
  author_id = excluded.author_id;

insert into public.crm_lead_status_history (
  id,
  lead_id,
  from_status,
  to_status,
  changed_by,
  created_at
)
values (
  (select id from rls_smoke_ids where key = 'crm_history'),
  (select id from rls_smoke_ids where key = 'crm_lead'),
  null,
  'new_request',
  (select id from rls_smoke_ids where key = 'manager_profile'),
  now()
)
on conflict (id) do update
set
  lead_id = excluded.lead_id,
  from_status = excluded.from_status,
  to_status = excluded.to_status,
  changed_by = excluded.changed_by;

insert into public.notifications (
  id,
  title,
  body,
  type,
  is_active,
  target_roles,
  target_user_ids,
  published_at,
  created_by,
  created_at,
  updated_at
)
values (
  (select id from rls_smoke_ids where key = 'notification'),
  'RLS smoke notification',
  'RLS smoke notification body',
  'news',
  true,
  array['manager']::text[],
  array[]::uuid[],
  now() - interval '1 hour',
  (select id from rls_smoke_ids where key = 'manager_profile'),
  now(),
  now()
)
on conflict (id) do update
set
  title = excluded.title,
  body = excluded.body,
  type = excluded.type,
  is_active = excluded.is_active,
  target_roles = excluded.target_roles,
  target_user_ids = excluded.target_user_ids,
  published_at = excluded.published_at,
  created_by = excluded.created_by,
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
values (
  (select id from rls_smoke_ids where key = 'search_document'),
  'rls_smoke',
  (select id from rls_smoke_ids where key = 'search_document'),
  'RLS smoke private search document',
  'RLS smoke',
  'private smoke search document',
  '/rls-smoke/private-search-document',
  'student',
  array['student']::text[],
  'student_owned',
  (select id from rls_smoke_ids where key = 'other_student'),
  true,
  '{"rls_smoke": true}'::jsonb,
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

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', (select id::text from rls_smoke_ids where key = 'student_profile'), true);

select pg_temp.rls_smoke_assert(
  (select count(*) from public.students where id in (
    (select id from rls_smoke_ids where key = 'student'),
    (select id from rls_smoke_ids where key = 'other_student')
  )) = 1,
  'student reads own student row only',
  null
);

select pg_temp.rls_smoke_assert(
  (select count(*) from public.homework_assignments where id in (
    (select id from rls_smoke_ids where key = 'homework'),
    (select id from rls_smoke_ids where key = 'other_homework')
  )) = 1,
  'student reads own homework assignment only',
  null
);

select pg_temp.rls_smoke_assert(
  (select count(*) from public.student_schedule_lessons where id in (
    (select id from rls_smoke_ids where key = 'lesson'),
    (select id from rls_smoke_ids where key = 'other_lesson')
  )) = 1,
  'student reads own schedule lesson only',
  null
);

select pg_temp.rls_smoke_assert(
  (select count(*) from public.payment_webhook_events where id = (select id from rls_smoke_ids where key = 'payment_webhook_event')) = 0,
  'student cannot read service-only payment_webhook_events',
  null
);

select pg_temp.rls_smoke_assert(
  (select count(*) from public.search_documents where id = (select id from rls_smoke_ids where key = 'search_document')) = 0,
  'student cannot directly read private search_documents rows',
  null
);

reset role;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', (select id::text from rls_smoke_ids where key = 'teacher_profile'), true);

select pg_temp.rls_smoke_assert(
  (select count(*) from public.students where id in (
    (select id from rls_smoke_ids where key = 'student'),
    (select id from rls_smoke_ids where key = 'other_student')
  )) = 1,
  'teacher reads assigned student row only',
  null
);

select pg_temp.rls_smoke_assert(
  (select count(*) from public.student_schedule_lessons where id in (
    (select id from rls_smoke_ids where key = 'lesson'),
    (select id from rls_smoke_ids where key = 'other_lesson')
  )) = 1,
  'teacher reads assigned schedule lesson only',
  null
);

select pg_temp.rls_smoke_assert(
  (select count(*) from public.teacher_student_notes where id = (select id from rls_smoke_ids where key = 'note')) = 1,
  'teacher reads assigned student note',
  null
);

select pg_temp.rls_smoke_assert(
  (select count(*) from public.payment_webhook_events where id = (select id from rls_smoke_ids where key = 'payment_webhook_event')) = 0,
  'teacher cannot read service-only payment_webhook_events',
  null
);

reset role;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', (select id::text from rls_smoke_ids where key = 'manager_profile'), true);

select pg_temp.rls_smoke_assert(
  (select count(*) from public.crm_leads where id = (select id from rls_smoke_ids where key = 'crm_lead')) = 1,
  'manager CRM read comes from RBAC role_permissions despite profile.role=student',
  null
);

select pg_temp.rls_smoke_assert(
  (select count(*) from public.notifications where id = (select id from rls_smoke_ids where key = 'notification')) = 1,
  'manager notification management/read comes from RBAC role_permissions despite profile.role=student',
  null
);

select pg_temp.rls_smoke_assert(
  (select count(*) from public.student_payment_reminder_state where student_id = (select id from rls_smoke_ids where key = 'student')) = 1,
  'manager payment reminder state read comes from RBAC role_permissions despite profile.role=student',
  null
);

select pg_temp.rls_smoke_assert(
  (select count(*) from public.payment_webhook_events where id = (select id from rls_smoke_ids where key = 'payment_webhook_event')) = 0,
  'manager cannot read service-only payment_webhook_events',
  null
);

reset role;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', (select id::text from rls_smoke_ids where key = 'admin_profile'), true);

select pg_temp.rls_smoke_assert(
  (select count(*) from public.crm_leads where id = (select id from rls_smoke_ids where key = 'crm_lead')) = 1,
  'admin CRM read comes from RBAC role_permissions despite profile.role=student',
  null
);

select pg_temp.rls_smoke_assert(
  (select count(*) from public.student_billing_accounts where id = (select id from rls_smoke_ids where key = 'billing_account')) = 1,
  'admin billing read comes from RBAC role_permissions despite profile.role=student',
  null
);

select pg_temp.rls_smoke_assert(
  (select count(*) from public.payment_webhook_events where id = (select id from rls_smoke_ids where key = 'payment_webhook_event')) = 0,
  'admin cannot read service-only payment_webhook_events',
  null
);

reset role;

select
  'rls smoke checks passed' as status,
  count(*) as checks_recorded
from pg_temp.rls_smoke_report
where ok = true;

rollback;
