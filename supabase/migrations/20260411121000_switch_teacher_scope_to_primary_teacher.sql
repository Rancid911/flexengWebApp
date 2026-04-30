begin;

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
  where not exists (select 1 from teacher_scope)
  limit 1;
$$;

drop policy if exists student_schedule_lessons_select_teacher_scope on public.student_schedule_lessons;
create policy student_schedule_lessons_select_teacher_scope
on public.student_schedule_lessons
for select
to authenticated
using (
  exists (
    select 1
    from public.teachers t
    join public.students s
      on s.id = student_schedule_lessons.student_id
     and s.primary_teacher_id = t.id
    where t.id = student_schedule_lessons.teacher_id
      and t.profile_id = auth.uid()
  )
);

drop policy if exists student_schedule_lessons_insert_teacher_scope on public.student_schedule_lessons;
create policy student_schedule_lessons_insert_teacher_scope
on public.student_schedule_lessons
for insert
to authenticated
with check (
  exists (
    select 1
    from public.teachers t
    join public.students s
      on s.id = student_schedule_lessons.student_id
     and s.primary_teacher_id = t.id
    where t.id = student_schedule_lessons.teacher_id
      and t.profile_id = auth.uid()
  )
);

drop policy if exists student_schedule_lessons_update_teacher_scope on public.student_schedule_lessons;
create policy student_schedule_lessons_update_teacher_scope
on public.student_schedule_lessons
for update
to authenticated
using (
  exists (
    select 1
    from public.teachers t
    join public.students s
      on s.id = student_schedule_lessons.student_id
     and s.primary_teacher_id = t.id
    where t.id = student_schedule_lessons.teacher_id
      and t.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.teachers t
    join public.students s
      on s.id = student_schedule_lessons.student_id
     and s.primary_teacher_id = t.id
    where t.id = student_schedule_lessons.teacher_id
      and t.profile_id = auth.uid()
  )
);

drop policy if exists lesson_attendance_teacher_scope_rw on public.lesson_attendance;
create policy lesson_attendance_teacher_scope_rw
on public.lesson_attendance
for all
to authenticated
using (
  exists (
    select 1
    from public.teachers t
    join public.students s
      on s.id = lesson_attendance.student_id
     and s.primary_teacher_id = t.id
    where t.id = lesson_attendance.teacher_id
      and t.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.teachers t
    join public.students s
      on s.id = lesson_attendance.student_id
     and s.primary_teacher_id = t.id
    where t.id = lesson_attendance.teacher_id
      and t.profile_id = auth.uid()
  )
);

drop policy if exists lesson_outcomes_teacher_scope_rw on public.lesson_outcomes;
create policy lesson_outcomes_teacher_scope_rw
on public.lesson_outcomes
for all
to authenticated
using (
  exists (
    select 1
    from public.teachers t
    join public.students s
      on s.id = lesson_outcomes.student_id
     and s.primary_teacher_id = t.id
    where t.id = lesson_outcomes.teacher_id
      and t.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.teachers t
    join public.students s
      on s.id = lesson_outcomes.student_id
     and s.primary_teacher_id = t.id
    where t.id = lesson_outcomes.teacher_id
      and t.profile_id = auth.uid()
  )
);

drop policy if exists teacher_student_notes_teacher_scope_rw on public.teacher_student_notes;
create policy teacher_student_notes_teacher_scope_rw
on public.teacher_student_notes
for all
to authenticated
using (
  exists (
    select 1
    from public.teachers t
    join public.students s
      on s.id = teacher_student_notes.student_id
     and s.primary_teacher_id = t.id
    where t.id = teacher_student_notes.teacher_id
      and t.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.teachers t
    join public.students s
      on s.id = teacher_student_notes.student_id
     and s.primary_teacher_id = t.id
    where t.id = teacher_student_notes.teacher_id
      and t.profile_id = auth.uid()
  )
);

commit;
