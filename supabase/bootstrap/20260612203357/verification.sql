-- DRAFT BASELINE CANDIDATE.
-- DO NOT APPLY TO EXISTING SUPABASE CLOUD PROJECT.
-- Intended only for clean local/self-hosted bootstrap rehearsal.
-- This file is non-active and must not be placed into supabase/migrations.

-- Read-only verification report. Run only after initializing the pinned
-- Supabase platform, applying the reviewed application baseline and reference
-- data, and applying post-cutoff migrations. This script does not expect the
-- raw platform schema from schema.candidate.sql to be replayed.

select
  expected.schema_name,
  (ns.oid is not null) as exists
from (values
  ('public'),
  ('app_private'),
  ('auth'),
  ('storage'),
  ('extensions')
) as expected(schema_name)
left join pg_namespace ns on ns.nspname = expected.schema_name
order by expected.schema_name;

select
  expected.object_name,
  (to_regclass(expected.object_name) is not null) as platform_object_exists
from (values
  ('auth.users'),
  ('storage.buckets'),
  ('storage.objects')
) as expected(object_name)
order by expected.object_name;

select
  expected.extension_name,
  (ext.oid is not null) as installed,
  ns.nspname as installed_schema
from (values
  ('pgcrypto'),
  ('pg_trgm')
) as expected(extension_name)
left join pg_extension ext on ext.extname = expected.extension_name
left join pg_namespace ns on ns.oid = ext.extnamespace
order by expected.extension_name;

select
  expected.table_name,
  (cls.oid is not null) as exists,
  coalesce(cls.relrowsecurity, false) as rls_enabled
from (values
  ('profiles'),
  ('students'),
  ('teachers'),
  ('courses'),
  ('course_modules'),
  ('lessons'),
  ('tests'),
  ('test_questions'),
  ('test_question_options'),
  ('student_course_enrollments'),
  ('student_lesson_progress'),
  ('student_test_attempts'),
  ('student_test_answers')
) as expected(table_name)
left join pg_class cls
  on cls.relname = expected.table_name
 and cls.relkind in ('r', 'p')
 and cls.relnamespace = to_regnamespace('public')
order by expected.table_name;

select
  'public.student_dashboard_view' as object_name,
  (to_regclass('public.student_dashboard_view') is not null) as exists;

select
  expected.schema_name,
  expected.function_name,
  count(proc.oid) > 0 as exists,
  count(proc.oid) as matching_overloads
from (values
  ('public', 'current_student_id'),
  ('public', 'current_teacher_id'),
  ('public', 'get_my_role'),
  ('public', 'is_admin_or_manager'),
  ('public', 'is_teacher'),
  ('public', 'get_linked_actor_scope'),
  ('public', 'submit_practice_test_attempt'),
  ('public', 'admin_dashboard_metrics'),
  ('public', 'admin_list_payment_control'),
  ('public', 'admin_payment_control_stats'),
  ('public', 'create_current_student_payment_transaction'),
  ('public', 'create_public_crm_lead'),
  ('public', 'get_accessible_profile_labels'),
  ('public', 'get_accessible_student_billing_summary'),
  ('public', 'get_my_student_dashboard_summary'),
  ('public', 'get_schedule_student_options'),
  ('public', 'get_schedule_teacher_options'),
  ('public', 'get_student_billing_summary_aggregates'),
  ('public', 'get_student_dashboard_payment_reminder_inputs'),
  ('public', 'get_teacher_roster_active_homework_counts'),
  ('public', 'get_teacher_student_profile_summaries'),
  ('public', 'load_current_student_payment_transaction_status'),
  ('public', 'search_documents_query_for_actor'),
  ('app_private', 'can_access_student'),
  ('app_private', 'has_permission')
) as expected(schema_name, function_name)
left join pg_namespace ns on ns.nspname = expected.schema_name
left join pg_proc proc
  on proc.pronamespace = ns.oid
 and proc.proname = expected.function_name
group by expected.schema_name, expected.function_name
order by expected.schema_name, expected.function_name;

select
  expected.schema_name,
  expected.table_name,
  expected.trigger_name,
  count(ns.oid) > 0 as exists
from (values
  ('auth', 'users', 'on_auth_user_created'),
  ('auth', 'users', 'on_auth_user_confirmed'),
  ('auth', 'users', 'on_auth_user_email_updated'),
  ('auth', 'users', 'on_auth_user_provision_metadata_updated'),
  ('public', 'profiles', 'trg_enforce_profile_auth_identity'),
  ('public', 'user_roles', 'trg_enforce_user_role_matches_profile')
) as expected(schema_name, table_name, trigger_name)
left join pg_trigger trg
  on trg.tgname = expected.trigger_name
 and not trg.tgisinternal
left join pg_class cls
  on cls.oid = trg.tgrelid
 and cls.relname = expected.table_name
left join pg_namespace ns
  on ns.oid = cls.relnamespace
 and ns.nspname = expected.schema_name
group by expected.schema_name, expected.table_name, expected.trigger_name
order by expected.schema_name, expected.table_name, expected.trigger_name;

select
  expected.table_name,
  expected.policy_name,
  (pol.policyname is not null) as exists,
  pol.roles,
  pol.cmd
from (values
  ('public', 'profiles', 'profiles_select_own_or_users_view'),
  ('public', 'profiles', 'profiles_update_own_or_users_manage'),
  ('public', 'students', 'students_select_access'),
  ('public', 'student_test_attempts', 'student_test_attempts_select_access'),
  ('public', 'student_test_attempts', 'student_test_attempts_insert_own'),
  ('public', 'student_test_answers', 'student_test_answers_select_access'),
  ('public', 'student_test_answers', 'student_test_answers_insert_own'),
  ('storage', 'objects', 'avatars_select_own'),
  ('storage', 'objects', 'avatars_insert_own'),
  ('storage', 'objects', 'avatars_update_own'),
  ('storage', 'objects', 'avatars_delete_own'),
  ('storage', 'objects', 'crm_assets_insert_manage'),
  ('storage', 'objects', 'crm_assets_update_manage'),
  ('storage', 'objects', 'crm_assets_delete_manage')
) as expected(schema_name, table_name, policy_name)
left join pg_policies pol
  on pol.schemaname = expected.schema_name
 and pol.tablename = expected.table_name
 and pol.policyname = expected.policy_name
order by expected.schema_name, expected.table_name, expected.policy_name;

select
  expected.bucket_id,
  (bucket.id is not null) as exists,
  bucket.public,
  (bucket.public = expected.expected_public) as public_flag_matches
from (values
  ('avatars', true),
  ('crm-assets', true)
) as expected(bucket_id, expected_public)
left join storage.buckets bucket on bucket.id = expected.bucket_id
order by expected.bucket_id;

select
  grant_check.role_name,
  grant_check.object_name,
  grant_check.privilege,
  grant_check.expected_granted,
  (case
    when to_regclass(grant_check.object_name) is null then false
    else has_table_privilege(
      grant_check.role_name,
      grant_check.object_name,
      grant_check.privilege
    )
  end = grant_check.expected_granted) as matches
from (values
  ('anon', 'public.student_test_attempts', 'SELECT', false),
  ('anon', 'public.student_test_answers', 'SELECT', false),
  ('authenticated', 'public.profiles', 'SELECT', true),
  ('authenticated', 'public.profiles', 'UPDATE', true),
  ('authenticated', 'public.student_test_attempts', 'SELECT', true),
  ('authenticated', 'public.student_test_attempts', 'INSERT', true),
  ('authenticated', 'public.student_test_answers', 'SELECT', true),
  ('authenticated', 'public.student_test_answers', 'INSERT', true),
  ('service_role', 'public.profiles', 'SELECT', true),
  ('service_role', 'public.student_test_attempts', 'SELECT', true)
) as grant_check(role_name, object_name, privilege, expected_granted)
order by grant_check.role_name, grant_check.object_name, grant_check.privilege;

select
  expected.role_name,
  expected.schema_name,
  expected.expected_usage,
  (
    has_schema_privilege(
      expected.role_name,
      expected.schema_name,
      'USAGE'
    ) = expected.expected_usage
  ) as matches
from (values
  ('anon', 'public', true),
  ('authenticated', 'public', true),
  ('authenticated', 'app_private', true),
  ('service_role', 'public', true)
) as expected(role_name, schema_name, expected_usage)
order by expected.role_name, expected.schema_name;

select
  expected.role_key,
  (role_row.id is not null) as exists
from (values
  ('student'),
  ('teacher'),
  ('manager'),
  ('admin')
) as expected(role_key)
left join public.roles role_row on role_row.key = expected.role_key
order by expected.role_key;

select
  expected.permission_key,
  (permission_row.id is not null) as exists
from (values
  ('users.view'),
  ('students.view'),
  ('homework.submit'),
  ('content.manage'),
  ('crm.leads.manage'),
  ('payments.manage'),
  ('search.ui')
) as expected(permission_key)
left join public.permissions permission_row
  on permission_row.key = expected.permission_key
order by expected.permission_key;

select
  expected.grantee,
  expected.routine_name,
  expected.expected_execute,
  ((count(privilege.routine_name) > 0) = expected.expected_execute) as matches
from (values
  ('anon', 'submit_practice_test_attempt', false),
  ('authenticated', 'submit_practice_test_attempt', true),
  ('authenticated', 'get_linked_actor_scope', true),
  ('service_role', 'submit_practice_test_attempt', true),
  ('service_role', 'get_linked_actor_scope', true)
) as expected(grantee, routine_name, expected_execute)
left join information_schema.routine_privileges privilege
  on privilege.grantee = expected.grantee
 and privilege.routine_schema = 'public'
 and privilege.routine_name = expected.routine_name
 and privilege.privilege_type = 'EXECUTE'
group by expected.grantee, expected.routine_name, expected.expected_execute
order by expected.grantee, expected.routine_name;
