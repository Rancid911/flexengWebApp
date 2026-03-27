create table if not exists public.student_schedule_lessons (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  meeting_url text,
  comment text,
  status text not null default 'scheduled' check (status in ('scheduled', 'canceled', 'completed')),
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  updated_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_schedule_lessons_time_check check (ends_at > starts_at)
);

create index if not exists idx_student_schedule_lessons_student_starts_at
  on public.student_schedule_lessons (student_id, starts_at desc);

create index if not exists idx_student_schedule_lessons_teacher_starts_at
  on public.student_schedule_lessons (teacher_id, starts_at desc);

create index if not exists idx_student_schedule_lessons_status_starts_at
  on public.student_schedule_lessons (status, starts_at desc);

create or replace function public.touch_student_schedule_lessons_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_student_schedule_lessons_updated_at on public.student_schedule_lessons;
create trigger trg_student_schedule_lessons_updated_at
before update on public.student_schedule_lessons
for each row execute function public.touch_student_schedule_lessons_updated_at();

alter table public.student_schedule_lessons enable row level security;

drop policy if exists student_schedule_lessons_select_own_student on public.student_schedule_lessons;
create policy student_schedule_lessons_select_own_student
on public.student_schedule_lessons
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = student_schedule_lessons.student_id
      and s.profile_id = auth.uid()
  )
);

drop policy if exists student_schedule_lessons_select_teacher_scope on public.student_schedule_lessons;
create policy student_schedule_lessons_select_teacher_scope
on public.student_schedule_lessons
for select
to authenticated
using (
  exists (
    select 1
    from public.teachers t
    join public.student_course_enrollments sce
      on sce.assigned_teacher_id = t.id
     and sce.student_id = student_schedule_lessons.student_id
     and sce.status = 'active'
    where t.id = student_schedule_lessons.teacher_id
      and t.profile_id = auth.uid()
  )
);

drop policy if exists student_schedule_lessons_select_manager_admin on public.student_schedule_lessons;
create policy student_schedule_lessons_select_manager_admin
on public.student_schedule_lessons
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
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
    join public.student_course_enrollments sce
      on sce.assigned_teacher_id = t.id
     and sce.student_id = student_schedule_lessons.student_id
     and sce.status = 'active'
    where t.id = student_schedule_lessons.teacher_id
      and t.profile_id = auth.uid()
  )
);

drop policy if exists student_schedule_lessons_insert_manager_admin on public.student_schedule_lessons;
create policy student_schedule_lessons_insert_manager_admin
on public.student_schedule_lessons
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
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
    join public.student_course_enrollments sce
      on sce.assigned_teacher_id = t.id
     and sce.student_id = student_schedule_lessons.student_id
     and sce.status = 'active'
    where t.id = student_schedule_lessons.teacher_id
      and t.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.teachers t
    join public.student_course_enrollments sce
      on sce.assigned_teacher_id = t.id
     and sce.student_id = student_schedule_lessons.student_id
     and sce.status = 'active'
    where t.id = student_schedule_lessons.teacher_id
      and t.profile_id = auth.uid()
  )
);

drop policy if exists student_schedule_lessons_update_manager_admin on public.student_schedule_lessons;
create policy student_schedule_lessons_update_manager_admin
on public.student_schedule_lessons
for update
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
