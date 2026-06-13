begin;

create schema if not exists app_private;

revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

create or replace function app_private.current_profile_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create or replace function app_private.has_permission(
  p_permission_key text,
  p_required_scope text default null
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp
      on rp.role_id = ur.role_id
    join public.permissions p
      on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and p.key = p_permission_key
      and (
        p_required_scope is null
        or rp.scope = p_required_scope
        or rp.scope = 'all'
      )
  );
$$;

create or replace function app_private.current_teacher_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select t.id
  from public.teachers t
  where t.profile_id = auth.uid()
  limit 1;
$$;

create or replace function app_private.is_own_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.students s
    where s.id = p_student_id
      and s.profile_id = auth.uid()
  );
$$;

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
  );
$$;

create or replace function app_private.can_access_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    app_private.is_own_student(p_student_id)
    or app_private.is_assigned_teacher(p_student_id)
    or app_private.has_permission('students.view', 'all');
$$;

create or replace function app_private.can_view_payment(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    app_private.is_own_student(p_student_id)
    or (
      app_private.is_assigned_teacher(p_student_id)
      and app_private.has_permission('billing.view', 'assigned')
    )
    or app_private.has_permission('billing.view', 'all');
$$;

grant execute on function app_private.current_profile_id() to authenticated;
grant execute on function app_private.has_permission(text, text) to authenticated;
grant execute on function app_private.current_teacher_id() to authenticated;
grant execute on function app_private.is_own_student(uuid) to authenticated;
grant execute on function app_private.is_assigned_teacher(uuid) to authenticated;
grant execute on function app_private.can_access_student(uuid) to authenticated;
grant execute on function app_private.can_view_payment(uuid) to authenticated;

create index if not exists students_primary_teacher_idx
  on public.students (primary_teacher_id);

do $$
begin
  if to_regclass('public.student_test_attempts') is not null then
    execute 'create index if not exists student_test_attempts_student_started_idx on public.student_test_attempts (student_id, started_at desc)';
  end if;

  if to_regclass('public.student_lesson_progress') is not null then
    execute 'create index if not exists student_lesson_progress_student_updated_idx on public.student_lesson_progress (student_id, updated_at desc)';
  end if;
end $$;

comment on function app_private.has_permission(text, text) is
  'RLS helper smoke checks: profile.view/own for seeded student role; students.view/all for admin and manager roles.';
comment on function app_private.is_own_student(uuid) is
  'RLS helper smoke check: true only when students.profile_id = auth.uid().';
comment on function app_private.is_assigned_teacher(uuid) is
  'RLS helper smoke check: true only when students.primary_teacher_id belongs to auth.uid() teacher profile.';
comment on function app_private.can_access_student(uuid) is
  'RLS helper smoke check: denies unrelated teachers; allows own student, assigned teacher, or students.view/all.';

commit;
