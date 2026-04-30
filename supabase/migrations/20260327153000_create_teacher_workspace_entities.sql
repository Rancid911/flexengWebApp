begin;

alter table if exists public.homework_assignments
  add column if not exists schedule_lesson_id uuid references public.student_schedule_lessons(id) on delete set null;

create index if not exists homework_assignments_schedule_lesson_idx
  on public.homework_assignments (schedule_lesson_id);

create table if not exists public.lesson_attendance (
  id uuid primary key default gen_random_uuid(),
  schedule_lesson_id uuid not null unique references public.student_schedule_lessons(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  status text not null check (status in ('scheduled', 'completed', 'missed_by_student', 'missed_by_teacher', 'canceled')),
  marked_by_profile_id uuid references public.profiles(id) on delete set null,
  marked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_outcomes (
  id uuid primary key default gen_random_uuid(),
  schedule_lesson_id uuid not null unique references public.student_schedule_lessons(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  summary text not null,
  covered_topics text,
  mistakes_summary text,
  next_steps text,
  visible_to_student boolean not null default true,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  updated_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_student_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  body text not null,
  visibility text not null default 'private' check (visibility in ('private', 'manager_visible')),
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  updated_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lesson_attendance_schedule_idx
  on public.lesson_attendance (schedule_lesson_id);

create index if not exists lesson_attendance_student_marked_idx
  on public.lesson_attendance (student_id, marked_at desc);

create index if not exists lesson_outcomes_schedule_idx
  on public.lesson_outcomes (schedule_lesson_id);

create index if not exists teacher_student_notes_student_teacher_created_idx
  on public.teacher_student_notes (student_id, teacher_id, created_at desc);

create or replace function public.touch_teacher_workspace_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_lesson_attendance_updated_at on public.lesson_attendance;
create trigger trg_lesson_attendance_updated_at
before update on public.lesson_attendance
for each row execute function public.touch_teacher_workspace_updated_at();

drop trigger if exists trg_lesson_outcomes_updated_at on public.lesson_outcomes;
create trigger trg_lesson_outcomes_updated_at
before update on public.lesson_outcomes
for each row execute function public.touch_teacher_workspace_updated_at();

drop trigger if exists trg_teacher_student_notes_updated_at on public.teacher_student_notes;
create trigger trg_teacher_student_notes_updated_at
before update on public.teacher_student_notes
for each row execute function public.touch_teacher_workspace_updated_at();

alter table public.lesson_attendance enable row level security;
alter table public.lesson_outcomes enable row level security;
alter table public.teacher_student_notes enable row level security;

drop policy if exists lesson_attendance_select_own_student on public.lesson_attendance;
create policy lesson_attendance_select_own_student
on public.lesson_attendance
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = lesson_attendance.student_id
      and s.profile_id = auth.uid()
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
    join public.student_course_enrollments sce
      on sce.assigned_teacher_id = t.id
     and sce.student_id = lesson_attendance.student_id
     and sce.status = 'active'
    where t.id = lesson_attendance.teacher_id
      and t.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.teachers t
    join public.student_course_enrollments sce
      on sce.assigned_teacher_id = t.id
     and sce.student_id = lesson_attendance.student_id
     and sce.status = 'active'
    where t.id = lesson_attendance.teacher_id
      and t.profile_id = auth.uid()
  )
);

drop policy if exists lesson_attendance_manager_admin_rw on public.lesson_attendance;
create policy lesson_attendance_manager_admin_rw
on public.lesson_attendance
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
);

drop policy if exists lesson_outcomes_select_own_visible on public.lesson_outcomes;
create policy lesson_outcomes_select_own_visible
on public.lesson_outcomes
for select
to authenticated
using (
  visible_to_student = true
  and exists (
    select 1
    from public.students s
    where s.id = lesson_outcomes.student_id
      and s.profile_id = auth.uid()
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
    join public.student_course_enrollments sce
      on sce.assigned_teacher_id = t.id
     and sce.student_id = lesson_outcomes.student_id
     and sce.status = 'active'
    where t.id = lesson_outcomes.teacher_id
      and t.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.teachers t
    join public.student_course_enrollments sce
      on sce.assigned_teacher_id = t.id
     and sce.student_id = lesson_outcomes.student_id
     and sce.status = 'active'
    where t.id = lesson_outcomes.teacher_id
      and t.profile_id = auth.uid()
  )
);

drop policy if exists lesson_outcomes_manager_admin_rw on public.lesson_outcomes;
create policy lesson_outcomes_manager_admin_rw
on public.lesson_outcomes
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
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
    join public.student_course_enrollments sce
      on sce.assigned_teacher_id = t.id
     and sce.student_id = teacher_student_notes.student_id
     and sce.status = 'active'
    where t.id = teacher_student_notes.teacher_id
      and t.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.teachers t
    join public.student_course_enrollments sce
      on sce.assigned_teacher_id = t.id
     and sce.student_id = teacher_student_notes.student_id
     and sce.status = 'active'
    where t.id = teacher_student_notes.teacher_id
      and t.profile_id = auth.uid()
  )
);

drop policy if exists teacher_student_notes_manager_admin_rw on public.teacher_student_notes;
create policy teacher_student_notes_manager_admin_rw
on public.teacher_student_notes
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
);

commit;
