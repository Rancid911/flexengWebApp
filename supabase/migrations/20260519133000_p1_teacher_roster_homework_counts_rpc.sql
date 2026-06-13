begin;

create or replace function public.get_teacher_roster_active_homework_counts(
  p_student_ids uuid[]
)
returns table (
  student_id uuid,
  active_homework_count integer
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
    h.student_id,
    count(*)::integer as active_homework_count
  from requested_students rs
  join public.homework_assignments h
    on h.student_id = rs.student_id
  where h.status in ('not_started', 'in_progress', 'overdue')
    and app_private.can_access_student(h.student_id)
  group by h.student_id;
end;
$$;

revoke all on function public.get_teacher_roster_active_homework_counts(uuid[]) from public;
revoke all on function public.get_teacher_roster_active_homework_counts(uuid[]) from anon;
grant execute on function public.get_teacher_roster_active_homework_counts(uuid[]) to authenticated;

comment on function public.get_teacher_roster_active_homework_counts(uuid[])
  is 'Returns active homework counts for student rows visible to the current roster actor.';

commit;
