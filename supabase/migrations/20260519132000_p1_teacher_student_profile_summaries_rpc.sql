begin;

create or replace function public.get_teacher_student_profile_summaries(
  p_student_ids uuid[]
)
returns table (
  student_id uuid,
  profile_id uuid,
  display_name text,
  first_name text,
  last_name text,
  email text,
  phone text
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_student_ids uuid[] := coalesce(p_student_ids, array[]::uuid[]);
begin
  if cardinality(v_student_ids) = 0 then
    return;
  end if;

  if cardinality(v_student_ids) > 200 then
    raise exception 'Too many student ids requested';
  end if;

  return query
  with requested_students as (
    select distinct requested.student_id
    from unnest(v_student_ids) as requested(student_id)
    where requested.student_id is not null
  )
  select
    s.id as student_id,
    p.id as profile_id,
    p.display_name,
    p.first_name,
    p.last_name,
    p.email,
    p.phone
  from requested_students rs
  join public.students s
    on s.id = rs.student_id
  join public.profiles p
    on p.id = s.profile_id
  where
    app_private.is_assigned_teacher(s.id)
    or app_private.has_permission('students.view', 'all');
end;
$$;

revoke all on function public.get_teacher_student_profile_summaries(uuid[]) from public;
revoke all on function public.get_teacher_student_profile_summaries(uuid[]) from anon;
grant execute on function public.get_teacher_student_profile_summaries(uuid[]) to authenticated;

comment on function public.get_teacher_student_profile_summaries(uuid[])
  is 'Returns limited profile labels for teacher-assigned or staff-visible student roster rows.';

commit;
