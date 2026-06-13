begin;

create or replace function public.get_linked_actor_scope(p_profile_id uuid)
returns table (
  student_id uuid,
  teacher_id uuid,
  accessible_student_ids uuid[]
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with authorized_profile as (
    select p_profile_id as id
    where p_profile_id = auth.uid()
  ),
  linked_student as (
    select s.id
    from public.students s
    join authorized_profile ap
      on ap.id = s.profile_id
    limit 1
  ),
  linked_teacher as (
    select t.id
    from public.teachers t
    join authorized_profile ap
      on ap.id = t.profile_id
    limit 1
  ),
  teacher_scope as (
    select
      lt.id as teacher_id,
      coalesce(
        array_agg(distinct s.id) filter (where s.id is not null),
        '{}'::uuid[]
      ) as accessible_student_ids
    from linked_teacher lt
    left join public.students s
      on s.primary_teacher_id = lt.id
    group by lt.id
  )
  select
    (select id from linked_student) as student_id,
    teacher_scope.teacher_id,
    case
      when teacher_scope.teacher_id is null then null
      else teacher_scope.accessible_student_ids
    end as accessible_student_ids
  from teacher_scope
  union all
  select
    (select id from linked_student) as student_id,
    null::uuid as teacher_id,
    null::uuid[] as accessible_student_ids
  where exists (select 1 from authorized_profile)
    and not exists (select 1 from teacher_scope)
  limit 1;
$$;

revoke all on function public.get_linked_actor_scope(uuid) from public;
revoke all on function public.get_linked_actor_scope(uuid) from anon;
grant execute on function public.get_linked_actor_scope(uuid) to authenticated;

commit;
