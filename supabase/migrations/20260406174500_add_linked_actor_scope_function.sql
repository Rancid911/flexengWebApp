create or replace function public.get_linked_actor_scope(p_profile_id uuid)
returns table (
  student_id uuid,
  teacher_id uuid,
  accessible_student_ids uuid[]
)
language sql
stable
as $$
  with linked_student as (
    select s.id
    from public.students s
    where s.profile_id = p_profile_id
    limit 1
  ),
  linked_teacher as (
    select t.id
    from public.teachers t
    where t.profile_id = p_profile_id
    limit 1
  ),
  teacher_scope as (
    select
      lt.id as teacher_id,
      coalesce(
        array_agg(distinct sce.student_id) filter (where sce.student_id is not null),
        '{}'::uuid[]
      ) as accessible_student_ids
    from linked_teacher lt
    left join public.student_course_enrollments sce
      on sce.assigned_teacher_id = lt.id
     and sce.status = 'active'
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
  where not exists (select 1 from teacher_scope)
  limit 1;
$$;
