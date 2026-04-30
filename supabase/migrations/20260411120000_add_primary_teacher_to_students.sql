begin;

alter table public.students
  add column if not exists primary_teacher_id uuid references public.teachers(id) on delete set null;

create index if not exists students_primary_teacher_idx
  on public.students (primary_teacher_id);

with active_teacher_counts as (
  select
    sce.student_id,
    min(sce.assigned_teacher_id) as teacher_id,
    count(distinct sce.assigned_teacher_id) filter (where sce.assigned_teacher_id is not null) as teacher_count
  from public.student_course_enrollments sce
  where sce.status = 'active'
  group by sce.student_id
)
update public.students s
set primary_teacher_id = atc.teacher_id
from active_teacher_counts atc
where s.id = atc.student_id
  and atc.teacher_count = 1
  and s.primary_teacher_id is null;

commit;
