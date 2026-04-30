create or replace function public.get_student_course_progress(p_student_id uuid)
returns table (
  course_id uuid,
  avg_progress_percent integer
)
language sql
stable
as $$
  select
    cm.course_id,
    round(avg(coalesce(slp.progress_percent, 0)))::integer as avg_progress_percent
  from public.student_lesson_progress slp
  join public.lessons l
    on l.id = slp.lesson_id
  join public.course_modules cm
    on cm.id = l.module_id
  where slp.student_id = p_student_id
  group by cm.course_id
$$;
