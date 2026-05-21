-- PR12A production-safe RLS metadata smoke.
--
-- This script is safe to run against the live production database because it:
-- - runs in a READ ONLY transaction;
-- - reads only system catalogs and policy metadata;
-- - creates no fixtures;
-- - switches no roles;
-- - writes no production rows.
--
-- Expected result: the final result set says "rls metadata smoke checks passed".
-- Any raised exception is a failing smoke result and means migration drift or
-- an active policy regression that should be fixed in a focused DB PR.

begin read only;

do $$
declare
  v_missing text;
begin
  with required_tables(table_name) as (
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
      ('search_documents')
  )
  select string_agg(table_name, ', ' order by table_name)
  into v_missing
  from required_tables
  where to_regclass('public.' || table_name) is null;

  if v_missing is not null then
    raise exception 'RLS metadata smoke failed: missing required tables: %', v_missing;
  end if;

  raise notice 'RLS metadata smoke: required tables exist';
end;
$$;

do $$
declare
  v_missing_rls text;
begin
  with required_tables(table_name) as (
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
      ('search_documents')
  ),
  optional_tables(table_name) as (
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
      ('test_question_options')
  ),
  tables_to_check as (
    select table_name from required_tables
    union
    select table_name
    from optional_tables
    where to_regclass('public.' || table_name) is not null
  )
  select string_agg(t.table_name, ', ' order by t.table_name)
  into v_missing_rls
  from tables_to_check t
  join pg_class c on c.oid = to_regclass('public.' || t.table_name)
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
    and c.relrowsecurity = false;

  if v_missing_rls is not null then
    raise exception 'RLS metadata smoke failed: RLS is disabled on: %', v_missing_rls;
  end if;

  raise notice 'RLS metadata smoke: RLS enabled on required and present optional tables';
end;
$$;

do $$
declare
  v_offenders text;
begin
  with required_tables(table_name) as (
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
      ('search_documents')
  ),
  optional_tables(table_name) as (
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
      ('test_question_options')
  ),
  tables_to_check as (
    select table_name from required_tables
    union
    select table_name
    from optional_tables
    where to_regclass('public.' || table_name) is not null
  )
  select string_agg(format('%I.%I:%I', p.schemaname, p.tablename, p.policyname), ', ' order by p.tablename, p.policyname)
  into v_offenders
  from pg_policies p
  where p.schemaname = 'public'
    and p.tablename in (select table_name from tables_to_check)
    and (
      coalesce(p.qual, '') ~* '(profiles\.role|(^|[^[:alnum:]_])p\.role|role[[:space:]]+in[[:space:]]*\(''manager''[[:space:]]*,[[:space:]]*''admin''\))'
      or coalesce(p.with_check, '') ~* '(profiles\.role|(^|[^[:alnum:]_])p\.role|role[[:space:]]+in[[:space:]]*\(''manager''[[:space:]]*,[[:space:]]*''admin''\))'
    );

  if v_offenders is not null then
    raise exception 'RLS metadata smoke failed: active raw-role policies remain: %', v_offenders;
  end if;

  raise notice 'RLS metadata smoke: no active replaced-domain raw-role policies found';
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename in ('crm_leads', 'crm_lead_comments', 'crm_lead_status_history', 'crm_settings')
      and (coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')) like '%app_private.has_permission%'
  ) then
    raise exception 'RLS metadata smoke failed: CRM policies do not show app_private.has_permission usage';
  end if;

  if not exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'notifications'
      and (coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')) like '%app_private.has_permission%'
  ) then
    raise exception 'RLS metadata smoke failed: notification management policies do not show app_private.has_permission usage';
  end if;

  if not exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename in ('admin_payment_reminder_settings', 'student_payment_reminder_state')
      and (coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')) like '%app_private.has_permission%'
  ) then
    raise exception 'RLS metadata smoke failed: payment reminder policies do not show app_private.has_permission usage';
  end if;

  raise notice 'RLS metadata smoke: CRM, notification and payment reminder policies use RBAC helpers';
end;
$$;

do $$
declare
  v_search_policies text;
  v_webhook_policies text;
begin
  select string_agg(p.policyname, ', ' order by p.policyname)
  into v_search_policies
  from pg_policies p
  where p.schemaname = 'public'
    and p.tablename = 'search_documents'
    and p.roles && array['public'::name, 'anon'::name, 'authenticated'::name];

  if v_search_policies is not null then
    raise exception 'RLS metadata smoke failed: search_documents has direct public/anon/authenticated policies: %', v_search_policies;
  end if;

  select string_agg(p.policyname, ', ' order by p.policyname)
  into v_webhook_policies
  from pg_policies p
  where p.schemaname = 'public'
    and p.tablename = 'payment_webhook_events'
    and p.roles && array['public'::name, 'anon'::name, 'authenticated'::name];

  if v_webhook_policies is not null then
    raise exception 'RLS metadata smoke failed: payment_webhook_events has public/anon/authenticated policies: %', v_webhook_policies;
  end if;

  raise notice 'RLS metadata smoke: search_documents and payment_webhook_events are closed to direct public/anon/authenticated table policies';
end;
$$;

do $$
declare
  v_storage_missing text;
begin
  if to_regclass('storage.objects') is not null then
    select case when c.relrowsecurity then null else 'storage.objects' end
    into v_storage_missing
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage'
      and c.relname = 'objects';

    if v_storage_missing is not null then
      raise exception 'RLS metadata smoke failed: RLS is disabled on %', v_storage_missing;
    end if;

    raise notice 'RLS metadata smoke: storage.objects RLS is enabled';
  else
    raise notice 'RLS metadata smoke: storage.objects not present in this database';
  end if;
end;
$$;

select 'rls metadata smoke checks passed' as status;

rollback;
