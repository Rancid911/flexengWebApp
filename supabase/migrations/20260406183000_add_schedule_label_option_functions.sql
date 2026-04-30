create or replace function public.get_schedule_student_options(p_student_ids uuid[] default null)
returns table (
  id uuid,
  label text
)
language sql
stable
as $$
  select
    s.id,
    coalesce(
      nullif(p.display_name, ''),
      nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''),
      p.email,
      'Ученик'
    ) as label
  from public.students s
  left join public.profiles p on p.id = s.profile_id
  where p_student_ids is null
     or s.id = any(p_student_ids)
  order by s.created_at asc;
$$;

create or replace function public.get_schedule_teacher_options(p_teacher_ids uuid[] default null)
returns table (
  id uuid,
  label text
)
language sql
stable
as $$
  select
    t.id,
    coalesce(
      nullif(p.display_name, ''),
      nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''),
      p.email,
      'Преподаватель'
    ) as label
  from public.teachers t
  left join public.profiles p on p.id = t.profile_id
  where p_teacher_ids is null
     or t.id = any(p_teacher_ids)
  order by t.created_at asc;
$$;
