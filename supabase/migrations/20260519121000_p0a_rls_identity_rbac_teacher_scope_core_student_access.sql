begin;

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.teacher_student_notes enable row level security;
alter table public.student_mistakes enable row level security;
alter table public.student_words enable row level security;
alter table public.student_word_reviews enable row level security;

drop policy if exists roles_authenticated_select on public.roles;
create policy roles_authenticated_select
on public.roles
for select
to authenticated
using (true);

drop policy if exists permissions_authenticated_select on public.permissions;
create policy permissions_authenticated_select
on public.permissions
for select
to authenticated
using (true);

drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists role_permissions_select_own_grants on public.role_permissions;
create policy role_permissions_select_own_grants
on public.role_permissions
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role_id = role_permissions.role_id
  )
);

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_select_own_or_users_view on public.profiles;
drop policy if exists profiles_update_own_or_users_manage on public.profiles;

create policy profiles_select_own_or_users_view
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or app_private.has_permission('users.view', 'all')
);

create policy profiles_update_own_or_users_manage
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or app_private.has_permission('users.manage', 'all')
)
with check (
  id = auth.uid()
  or app_private.has_permission('users.manage', 'all')
);

drop policy if exists students_select_own on public.students;
drop policy if exists students_insert_own on public.students;
drop policy if exists students_update_own on public.students;
drop policy if exists students_select_access on public.students;
drop policy if exists students_insert_own_or_manage on public.students;
drop policy if exists students_update_own_or_manage on public.students;

create policy students_select_access
on public.students
for select
to authenticated
using (app_private.can_access_student(id));

create policy students_insert_own_or_manage
on public.students
for insert
to authenticated
with check (
  profile_id = auth.uid()
  or app_private.has_permission('students.manage', 'all')
);

create policy students_update_own_or_manage
on public.students
for update
to authenticated
using (
  app_private.is_own_student(id)
  or app_private.has_permission('students.manage', 'all')
)
with check (
  profile_id = auth.uid()
  or app_private.has_permission('students.manage', 'all')
);

drop policy if exists teachers_select_own_or_view on public.teachers;
drop policy if exists teachers_insert_manage on public.teachers;
drop policy if exists teachers_update_manage on public.teachers;
drop policy if exists teachers_delete_manage on public.teachers;

create policy teachers_select_own_or_view
on public.teachers
for select
to authenticated
using (
  profile_id = auth.uid()
  or app_private.has_permission('teachers.view', 'all')
);

create policy teachers_insert_manage
on public.teachers
for insert
to authenticated
with check (app_private.has_permission('teachers.manage', 'all'));

create policy teachers_update_manage
on public.teachers
for update
to authenticated
using (app_private.has_permission('teachers.manage', 'all'))
with check (app_private.has_permission('teachers.manage', 'all'));

create policy teachers_delete_manage
on public.teachers
for delete
to authenticated
using (app_private.has_permission('teachers.manage', 'all'));

drop policy if exists teacher_student_notes_teacher_scope_rw on public.teacher_student_notes;
drop policy if exists teacher_student_notes_manager_admin_rw on public.teacher_student_notes;
drop policy if exists teacher_student_notes_select_access on public.teacher_student_notes;
drop policy if exists teacher_student_notes_insert_access on public.teacher_student_notes;
drop policy if exists teacher_student_notes_update_access on public.teacher_student_notes;
drop policy if exists teacher_student_notes_delete_access on public.teacher_student_notes;

create policy teacher_student_notes_select_access
on public.teacher_student_notes
for select
to authenticated
using (
  (
    teacher_id = app_private.current_teacher_id()
    and app_private.is_assigned_teacher(student_id)
  )
  or app_private.has_permission('students.view', 'all')
);

create policy teacher_student_notes_insert_access
on public.teacher_student_notes
for insert
to authenticated
with check (
  (
    teacher_id = app_private.current_teacher_id()
    and app_private.is_assigned_teacher(student_id)
  )
  or app_private.has_permission('students.manage', 'all')
);

create policy teacher_student_notes_update_access
on public.teacher_student_notes
for update
to authenticated
using (
  (
    teacher_id = app_private.current_teacher_id()
    and app_private.is_assigned_teacher(student_id)
  )
  or app_private.has_permission('students.manage', 'all')
)
with check (
  (
    teacher_id = app_private.current_teacher_id()
    and app_private.is_assigned_teacher(student_id)
  )
  or app_private.has_permission('students.manage', 'all')
);

create policy teacher_student_notes_delete_access
on public.teacher_student_notes
for delete
to authenticated
using (
  (
    teacher_id = app_private.current_teacher_id()
    and app_private.is_assigned_teacher(student_id)
  )
  or app_private.has_permission('students.manage', 'all')
);

drop policy if exists student_mistakes_select_own on public.student_mistakes;
drop policy if exists student_mistakes_select_access on public.student_mistakes;

create policy student_mistakes_select_access
on public.student_mistakes
for select
to authenticated
using (app_private.can_access_student(student_id));

drop policy if exists student_words_rw_own on public.student_words;
drop policy if exists student_words_select_access on public.student_words;
drop policy if exists student_words_insert_own on public.student_words;
drop policy if exists student_words_update_own on public.student_words;
drop policy if exists student_words_delete_own on public.student_words;

create policy student_words_select_access
on public.student_words
for select
to authenticated
using (app_private.can_access_student(student_id));

create policy student_words_insert_own
on public.student_words
for insert
to authenticated
with check (app_private.is_own_student(student_id));

create policy student_words_update_own
on public.student_words
for update
to authenticated
using (app_private.is_own_student(student_id))
with check (app_private.is_own_student(student_id));

create policy student_words_delete_own
on public.student_words
for delete
to authenticated
using (app_private.is_own_student(student_id));

drop policy if exists student_word_reviews_rw_own on public.student_word_reviews;
drop policy if exists student_word_reviews_select_access on public.student_word_reviews;
drop policy if exists student_word_reviews_insert_own on public.student_word_reviews;
drop policy if exists student_word_reviews_update_own on public.student_word_reviews;
drop policy if exists student_word_reviews_delete_own on public.student_word_reviews;

create policy student_word_reviews_select_access
on public.student_word_reviews
for select
to authenticated
using (app_private.can_access_student(student_id));

create policy student_word_reviews_insert_own
on public.student_word_reviews
for insert
to authenticated
with check (
  app_private.is_own_student(student_id)
  and exists (
    select 1
    from public.student_words sw
    where sw.id = student_word_reviews.student_word_id
      and sw.student_id = student_word_reviews.student_id
  )
);

create policy student_word_reviews_update_own
on public.student_word_reviews
for update
to authenticated
using (app_private.is_own_student(student_id))
with check (
  app_private.is_own_student(student_id)
  and exists (
    select 1
    from public.student_words sw
    where sw.id = student_word_reviews.student_word_id
      and sw.student_id = student_word_reviews.student_id
  )
);

create policy student_word_reviews_delete_own
on public.student_word_reviews
for delete
to authenticated
using (app_private.is_own_student(student_id));

do $$
begin
  if to_regclass('public.student_test_attempts') is not null then
    execute 'alter table public.student_test_attempts enable row level security';

    execute 'drop policy if exists student_test_attempts_select_access on public.student_test_attempts';
    execute 'drop policy if exists student_test_attempts_insert_own on public.student_test_attempts';
    execute 'drop policy if exists student_test_attempts_update_own on public.student_test_attempts';
    execute 'drop policy if exists student_test_attempts_delete_own on public.student_test_attempts';

    execute $policy$
      create policy student_test_attempts_select_access
      on public.student_test_attempts
      for select
      to authenticated
      using (app_private.can_access_student(student_id))
    $policy$;

    execute $policy$
      create policy student_test_attempts_insert_own
      on public.student_test_attempts
      for insert
      to authenticated
      with check (app_private.is_own_student(student_id))
    $policy$;

    execute $policy$
      create policy student_test_attempts_update_own
      on public.student_test_attempts
      for update
      to authenticated
      using (app_private.is_own_student(student_id))
      with check (app_private.is_own_student(student_id))
    $policy$;

    execute $policy$
      create policy student_test_attempts_delete_own
      on public.student_test_attempts
      for delete
      to authenticated
      using (app_private.is_own_student(student_id))
    $policy$;
  end if;

  if to_regclass('public.student_test_answers') is not null then
    execute 'alter table public.student_test_answers enable row level security';

    execute 'drop policy if exists student_test_answers_select_access on public.student_test_answers';
    execute 'drop policy if exists student_test_answers_insert_own on public.student_test_answers';
    execute 'drop policy if exists student_test_answers_update_own on public.student_test_answers';
    execute 'drop policy if exists student_test_answers_delete_own on public.student_test_answers';

    execute $policy$
      create policy student_test_answers_select_access
      on public.student_test_answers
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.student_test_attempts sta
          where sta.id = student_test_answers.attempt_id
            and app_private.can_access_student(sta.student_id)
        )
      )
    $policy$;

    execute $policy$
      create policy student_test_answers_insert_own
      on public.student_test_answers
      for insert
      to authenticated
      with check (
        exists (
          select 1
          from public.student_test_attempts sta
          where sta.id = student_test_answers.attempt_id
            and app_private.is_own_student(sta.student_id)
        )
      )
    $policy$;

    execute $policy$
      create policy student_test_answers_update_own
      on public.student_test_answers
      for update
      to authenticated
      using (
        exists (
          select 1
          from public.student_test_attempts sta
          where sta.id = student_test_answers.attempt_id
            and app_private.is_own_student(sta.student_id)
        )
      )
      with check (
        exists (
          select 1
          from public.student_test_attempts sta
          where sta.id = student_test_answers.attempt_id
            and app_private.is_own_student(sta.student_id)
        )
      )
    $policy$;

    execute $policy$
      create policy student_test_answers_delete_own
      on public.student_test_answers
      for delete
      to authenticated
      using (
        exists (
          select 1
          from public.student_test_attempts sta
          where sta.id = student_test_answers.attempt_id
            and app_private.is_own_student(sta.student_id)
        )
      )
    $policy$;
  end if;

  if to_regclass('public.student_lesson_progress') is not null then
    execute 'alter table public.student_lesson_progress enable row level security';

    execute 'drop policy if exists student_lesson_progress_select_access on public.student_lesson_progress';
    execute 'drop policy if exists student_lesson_progress_insert_own on public.student_lesson_progress';
    execute 'drop policy if exists student_lesson_progress_update_own on public.student_lesson_progress';
    execute 'drop policy if exists student_lesson_progress_delete_own on public.student_lesson_progress';

    execute $policy$
      create policy student_lesson_progress_select_access
      on public.student_lesson_progress
      for select
      to authenticated
      using (app_private.can_access_student(student_id))
    $policy$;

    execute $policy$
      create policy student_lesson_progress_insert_own
      on public.student_lesson_progress
      for insert
      to authenticated
      with check (app_private.is_own_student(student_id))
    $policy$;

    execute $policy$
      create policy student_lesson_progress_update_own
      on public.student_lesson_progress
      for update
      to authenticated
      using (app_private.is_own_student(student_id))
      with check (app_private.is_own_student(student_id))
    $policy$;

    execute $policy$
      create policy student_lesson_progress_delete_own
      on public.student_lesson_progress
      for delete
      to authenticated
      using (app_private.is_own_student(student_id))
    $policy$;
  end if;
end $$;

commit;
