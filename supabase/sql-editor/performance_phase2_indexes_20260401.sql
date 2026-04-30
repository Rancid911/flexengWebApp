begin;

create index if not exists students_profile_id_idx
  on public.students (profile_id);

create index if not exists teachers_profile_id_idx
  on public.teachers (profile_id);

create index if not exists student_course_enrollments_teacher_status_student_idx
  on public.student_course_enrollments (assigned_teacher_id, status, student_id);

create index if not exists student_schedule_lessons_student_status_starts_idx
  on public.student_schedule_lessons (student_id, status, starts_at asc);

commit;

select
  schemaname,
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'students_profile_id_idx',
    'teachers_profile_id_idx',
    'student_course_enrollments_teacher_status_student_idx',
    'student_schedule_lessons_student_status_starts_idx'
  )
order by tablename, indexname;
