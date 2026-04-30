-- Phase 2 DB audit: run each block separately in Supabase SQL Editor.
-- IMPORTANT:
-- 1. Replace placeholder UUIDs/slugs with real values from the target environment.
-- 2. Run one block at a time, do not execute the whole file in one go.
-- 3. Save the full plan output for each block into the report template.

-- -------------------------------------------------------------------
-- 0. Verify required indexes exist
-- -------------------------------------------------------------------
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'students_profile_id_idx',
    'teachers_profile_id_idx',
    'student_course_enrollments_teacher_status_student_idx',
    'student_schedule_lessons_student_status_starts_idx'
  )
order by tablename, indexname;

-- -------------------------------------------------------------------
-- 1. Student dashboard preview path
-- Mirrors getStudentSchedulePreviewByStudentId()
-- Replace student UUID.
-- Expected winner: student_schedule_lessons_student_status_starts_idx
-- -------------------------------------------------------------------
explain (analyze, buffers, verbose)
select
  id,
  student_id,
  teacher_id,
  title,
  starts_at,
  ends_at,
  meeting_url,
  comment,
  status,
  created_at,
  updated_at
from public.student_schedule_lessons
where student_id = '00000000-0000-0000-0000-000000000001'::uuid
  and status = 'scheduled'
  and starts_at > now()
order by starts_at asc
limit 3;

-- -------------------------------------------------------------------
-- 2. Staff schedule base query
-- Mirrors listScheduleLessonRows() for staff/teacher paths.
-- Replace teacher UUID and accessible student UUID list.
-- Expected winners:
-- - student_schedule_lessons_student_status_starts_idx
-- - teacher/student-specific schedule indexes
-- -------------------------------------------------------------------
explain (analyze, buffers, verbose)
select
  id,
  student_id,
  teacher_id,
  title,
  starts_at,
  ends_at,
  meeting_url,
  comment,
  status,
  created_at,
  updated_at
from public.student_schedule_lessons
where student_id in (
    '00000000-0000-0000-0000-000000000101'::uuid,
    '00000000-0000-0000-0000-000000000102'::uuid,
    '00000000-0000-0000-0000-000000000103'::uuid
  )
  and teacher_id = '00000000-0000-0000-0000-000000000201'::uuid
  and status <> 'canceled'
  and starts_at >= now()
order by starts_at asc;

-- -------------------------------------------------------------------
-- 3. Teacher-scope join path
-- Mirrors the teacher-scope lookup used in request-context and RLS-style joins.
-- Replace teacher UUID.
-- Expected winner: student_course_enrollments_teacher_status_student_idx
-- -------------------------------------------------------------------
explain (analyze, buffers, verbose)
select
  sce.student_id
from public.student_course_enrollments sce
join public.teachers t
  on t.id = sce.assigned_teacher_id
where t.id = '00000000-0000-0000-0000-000000000201'::uuid
  and sce.status = 'active';

-- Optional expanded teacher-scope path against schedule lessons.
explain (analyze, buffers, verbose)
select
  l.id,
  l.student_id,
  l.teacher_id,
  l.starts_at,
  l.status
from public.student_schedule_lessons l
join public.student_course_enrollments sce
  on sce.student_id = l.student_id
 and sce.assigned_teacher_id = l.teacher_id
 and sce.status = 'active'
where l.teacher_id = '00000000-0000-0000-0000-000000000201'::uuid
  and l.starts_at >= now()
order by l.starts_at asc;

-- -------------------------------------------------------------------
-- 4. Practice topic/subtopic path
-- Mirrors getPracticeTopicDetail() + getPracticeSubtopicDetail()
-- Replace student UUID, course slug and module UUID.
-- -------------------------------------------------------------------

-- 4a. Resolve active enrollment by student.
explain (analyze, buffers, verbose)
select
  sce.course_id
from public.student_course_enrollments sce
where sce.student_id = '00000000-0000-0000-0000-000000000001'::uuid
  and sce.status = 'active';

-- 4b. Topic detail: course by slug.
explain (analyze, buffers, verbose)
select
  id,
  slug,
  title,
  description
from public.courses
where slug = 'english-a2'
limit 1;

-- 4c. Topic detail: modules for course.
explain (analyze, buffers, verbose)
select
  id,
  title,
  description
from public.course_modules
where course_id = '00000000-0000-0000-0000-000000000301'::uuid
  and is_published = true
order by sort_order asc;

-- 4d. Topic/subtopic progress path.
explain (analyze, buffers, verbose)
select
  slp.progress_percent,
  slp.lesson_id,
  l.module_id
from public.student_lesson_progress slp
join public.lessons l
  on l.id = slp.lesson_id
where slp.student_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- 4e. Subtopic lesson list.
explain (analyze, buffers, verbose)
select
  id,
  title,
  description,
  duration_minutes,
  lesson_type
from public.lessons
where module_id = '00000000-0000-0000-0000-000000000401'::uuid
  and is_published = true
order by sort_order asc;

-- 4f. Subtopic test list.
explain (analyze, buffers, verbose)
select
  id,
  title,
  description,
  time_limit_minutes,
  activity_type
from public.tests
where module_id = '00000000-0000-0000-0000-000000000401'::uuid
  and is_published = true
order by created_at asc;

-- -------------------------------------------------------------------
-- 5. Student payments DB path
-- Mirrors getStudentPaymentsPageData() without YooKassa network calls.
-- Replace student UUID.
-- -------------------------------------------------------------------

-- 5a. Payment transactions list.
explain (analyze, buffers, verbose)
select
  id,
  amount,
  currency,
  status,
  paid_at,
  created_at,
  description,
  raw_status,
  confirmation_url,
  provider_payment_id,
  plan_id
from public.payment_transactions
where student_id = '00000000-0000-0000-0000-000000000001'::uuid
order by created_at desc;

-- 5b. Billing account lookup.
explain (analyze, buffers, verbose)
select
  id,
  student_id,
  billing_mode,
  lesson_price_amount,
  currency,
  created_at,
  updated_at
from public.student_billing_accounts
where student_id = '00000000-0000-0000-0000-000000000001'::uuid
limit 1;

-- 5c. Billing ledger lookup.
explain (analyze, buffers, verbose)
select
  id,
  student_id,
  entry_direction,
  unit_type,
  lesson_units,
  money_amount,
  reason,
  payment_transaction_id,
  schedule_lesson_id,
  payment_plan_id,
  effective_lesson_price_amount,
  effective_lesson_price_currency,
  description,
  created_at
from public.student_billing_ledger
where student_id = '00000000-0000-0000-0000-000000000001'::uuid
order by created_at desc;
