-- Replace the UUID with a real profiles.id before running.
explain (analyze, buffers, verbose)
select *
from public.get_linked_actor_scope('00000000-0000-0000-0000-000000000000'::uuid);

-- Internal teacher lookup path.
explain (analyze, buffers, verbose)
select t.id
from public.teachers t
where t.profile_id = '00000000-0000-0000-0000-000000000000'::uuid
limit 1;

-- Internal student lookup path.
explain (analyze, buffers, verbose)
select s.id
from public.students s
where s.profile_id = '00000000-0000-0000-0000-000000000000'::uuid
limit 1;

-- Internal teacher scope join path.
-- Replace the UUID with a real teachers.id before running.
explain (analyze, buffers, verbose)
select array_agg(distinct sce.student_id order by sce.student_id)
from public.student_course_enrollments sce
where sce.assigned_teacher_id = '00000000-0000-0000-0000-000000000000'::uuid
  and sce.status = 'active';
