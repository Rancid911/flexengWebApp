begin;

create or replace function public.get_accessible_profile_labels(
  p_profile_ids uuid[]
)
returns table (
  profile_id uuid,
  display_name text,
  first_name text,
  last_name text,
  role text
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_ids uuid[] := coalesce(p_profile_ids, array[]::uuid[]);
begin
  if cardinality(v_profile_ids) = 0 then
    return;
  end if;

  if cardinality(v_profile_ids) > 200 then
    raise exception 'Too many profile ids requested';
  end if;

  return query
  with requested_profiles as (
    select distinct requested.profile_id
    from unnest(v_profile_ids) as requested(profile_id)
    where requested.profile_id is not null
  )
  select
    p.id as profile_id,
    p.display_name,
    p.first_name,
    p.last_name,
    p.role
  from requested_profiles rp
  join public.profiles p
    on p.id = rp.profile_id
  where
    p.id = auth.uid()
    or app_private.has_permission('users.view', 'all')
    or exists (
      select 1
      from public.students s
      where s.profile_id = p.id
        and app_private.can_access_student(s.id)
    )
    or exists (
      select 1
      from public.teacher_student_notes n
      where n.created_by_profile_id = p.id
        and app_private.can_access_student(n.student_id)
        and (
          app_private.is_assigned_teacher(n.student_id)
          or app_private.has_permission('students.view', 'all')
        )
    );
end;
$$;

revoke all on function public.get_accessible_profile_labels(uuid[]) from public;
revoke all on function public.get_accessible_profile_labels(uuid[]) from anon;
grant execute on function public.get_accessible_profile_labels(uuid[]) to authenticated;

comment on function public.get_accessible_profile_labels(uuid[])
  is 'Returns minimal profile labels for current user, staff-visible users, accessible student profiles, and note authors on teacher/staff-accessible students.';

commit;
