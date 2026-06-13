begin;

create or replace function app_private.is_assigned_teacher(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.students s
    join public.teachers t
      on t.id = s.primary_teacher_id
    where s.id = p_student_id
      and t.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.student_course_enrollments sce
    join public.teachers t
      on t.id = sce.assigned_teacher_id
    where sce.student_id = p_student_id
      and sce.status = 'active'
      and t.profile_id = auth.uid()
  );
$$;

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
  teacher_accessible_students as (
    select lt.id as teacher_id, s.id as student_id
    from linked_teacher lt
    join public.students s
      on s.primary_teacher_id = lt.id
    union
    select lt.id as teacher_id, sce.student_id
    from linked_teacher lt
    join public.student_course_enrollments sce
      on sce.assigned_teacher_id = lt.id
     and sce.status = 'active'
     and sce.student_id is not null
  ),
  teacher_scope as (
    select
      lt.id as teacher_id,
      coalesce(
        array_agg(distinct tas.student_id) filter (where tas.student_id is not null),
        '{}'::uuid[]
      ) as accessible_student_ids
    from linked_teacher lt
    left join teacher_accessible_students tas
      on tas.teacher_id = lt.id
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

create or replace function public.get_schedule_student_options(p_student_ids uuid[] default null)
returns table (
  id uuid,
  label text
)
language sql
stable
security definer
set search_path = public, pg_temp
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
  where (p_student_ids is null or s.id = any(p_student_ids))
    and (
      app_private.can_access_student(s.id)
      or app_private.has_permission('students.view', 'all')
      or app_private.has_permission('schedule.view', 'all')
    )
  order by s.created_at asc;
$$;

revoke all on function public.get_linked_actor_scope(uuid) from public;
revoke all on function public.get_linked_actor_scope(uuid) from anon;
grant execute on function public.get_linked_actor_scope(uuid) to authenticated;

revoke all on function public.get_schedule_student_options(uuid[]) from public;
revoke all on function public.get_schedule_student_options(uuid[]) from anon;
grant execute on function public.get_schedule_student_options(uuid[]) to authenticated;

grant execute on function app_private.is_assigned_teacher(uuid) to authenticated;

comment on function app_private.is_assigned_teacher(uuid) is
  'True when the current teacher is linked to the student either as students.primary_teacher_id or through an active student_course_enrollments.assigned_teacher_id row.';

comment on function public.get_linked_actor_scope(uuid) is
  'Returns student/teacher links and teacher-accessible student ids for the authenticated profile, including primary teacher and active enrollment assignments.';

comment on function public.get_schedule_student_options(uuid[]) is
  'Returns schedule student option labels visible to the current actor, using app_private.can_access_student and all-scoped staff permissions.';

commit;
