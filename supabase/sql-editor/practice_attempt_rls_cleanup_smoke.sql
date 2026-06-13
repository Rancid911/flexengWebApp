-- Rollback-only row access smoke for the practice attempts legacy RLS cleanup.
-- Run after 20260612203357_cleanup_practice_attempt_legacy_rls.sql.

begin;

create temp table practice_attempt_rls_ids (
  key text primary key,
  id uuid not null
) on commit drop;

insert into practice_attempt_rls_ids (key, id)
values
  ('student_profile', '74000000-0000-4000-8000-000000000001'),
  ('other_student_profile', '74000000-0000-4000-8000-000000000002'),
  ('teacher_profile', '74000000-0000-4000-8000-000000000003'),
  ('manager_profile', '74000000-0000-4000-8000-000000000004'),
  ('admin_profile', '74000000-0000-4000-8000-000000000005'),
  ('course', '74100000-0000-4000-8000-000000000001'),
  ('module', '74200000-0000-4000-8000-000000000001'),
  ('test', '74300000-0000-4000-8000-000000000001'),
  ('question', '74400000-0000-4000-8000-000000000001'),
  ('mutation_question', '74400000-0000-4000-8000-000000000002'),
  ('correct_option', '74500000-0000-4000-8000-000000000001'),
  ('wrong_option', '74500000-0000-4000-8000-000000000002'),
  ('mutation_option', '74500000-0000-4000-8000-000000000003'),
  ('student_attempt', '74600000-0000-4000-8000-000000000001'),
  ('other_attempt', '74600000-0000-4000-8000-000000000002'),
  ('student_answer', '74700000-0000-4000-8000-000000000001'),
  ('other_answer', '74700000-0000-4000-8000-000000000002');

grant select on table practice_attempt_rls_ids to anon, authenticated;

do $$
declare
  v_record record;
begin
  for v_record in
    select *
    from (
      values
        ('student_profile', 'student'),
        ('other_student_profile', 'student'),
        ('teacher_profile', 'teacher'),
        ('manager_profile', 'manager'),
        ('admin_profile', 'admin')
    ) as actor(key, role_key)
  loop
    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    values (
      (select id from practice_attempt_rls_ids where key = v_record.key),
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'practice-rls-' || v_record.key || '@example.invalid',
      '',
      now(),
      jsonb_build_object(
        'provider', 'email',
        'providers', jsonb_build_array('email'),
        'provision_source', 'admin_create',
        'provision_role', v_record.role_key
      ),
      jsonb_build_object('display_name', 'Practice RLS ' || v_record.key),
      now(),
      now()
    );
  end loop;
end;
$$;

insert into public.courses (id, title, slug, is_published)
values (
  (select id from practice_attempt_rls_ids where key = 'course'),
  'Practice attempt RLS smoke course',
  'practice-attempt-rls-smoke',
  true
);

insert into public.course_modules (id, course_id, title, is_published)
values (
  (select id from practice_attempt_rls_ids where key = 'module'),
  (select id from practice_attempt_rls_ids where key = 'course'),
  'Practice attempt RLS smoke module',
  true
);

insert into public.tests (
  id,
  module_id,
  title,
  passing_score,
  is_published,
  assessment_kind
)
values (
  (select id from practice_attempt_rls_ids where key = 'test'),
  (select id from practice_attempt_rls_ids where key = 'module'),
  'Practice attempt RLS smoke test',
  70,
  true,
  'regular'
);

insert into public.test_questions (
  id,
  test_id,
  prompt,
  question_type,
  placement_band,
  sort_order
)
values
  (
    (select id from practice_attempt_rls_ids where key = 'question'),
    (select id from practice_attempt_rls_ids where key = 'test'),
    'Practice attempt RLS smoke question',
    'single_choice',
    'beginner',
    1
  ),
  (
    (select id from practice_attempt_rls_ids where key = 'mutation_question'),
    (select id from practice_attempt_rls_ids where key = 'test'),
    'Practice attempt RLS mutation question',
    'single_choice',
    'elementary',
    2
  );

insert into public.test_question_options (
  id,
  question_id,
  option_text,
  is_correct,
  sort_order
)
values
  (
    (select id from practice_attempt_rls_ids where key = 'correct_option'),
    (select id from practice_attempt_rls_ids where key = 'question'),
    'Correct',
    true,
    1
  ),
  (
    (select id from practice_attempt_rls_ids where key = 'wrong_option'),
    (select id from practice_attempt_rls_ids where key = 'question'),
    'Wrong',
    false,
    2
  ),
  (
    (select id from practice_attempt_rls_ids where key = 'mutation_option'),
    (select id from practice_attempt_rls_ids where key = 'mutation_question'),
    'Mutation option',
    true,
    1
  );

insert into public.student_course_enrollments (
  student_id,
  course_id,
  assigned_teacher_id,
  status
)
values
  (
    (select s.id from public.students s where s.profile_id = (select id from practice_attempt_rls_ids where key = 'student_profile')),
    (select id from practice_attempt_rls_ids where key = 'course'),
    (select t.id from public.teachers t where t.profile_id = (select id from practice_attempt_rls_ids where key = 'teacher_profile')),
    'active'
  ),
  (
    (select s.id from public.students s where s.profile_id = (select id from practice_attempt_rls_ids where key = 'other_student_profile')),
    (select id from practice_attempt_rls_ids where key = 'course'),
    (select t.id from public.teachers t where t.profile_id = (select id from practice_attempt_rls_ids where key = 'teacher_profile')),
    'paused'
  );

insert into public.student_test_attempts (
  id,
  student_id,
  test_id,
  score,
  correct_answers,
  total_questions,
  status,
  submitted_at
)
values
  (
    (select id from practice_attempt_rls_ids where key = 'student_attempt'),
    (select s.id from public.students s where s.profile_id = (select id from practice_attempt_rls_ids where key = 'student_profile')),
    (select id from practice_attempt_rls_ids where key = 'test'),
    100,
    1,
    1,
    'passed',
    now()
  ),
  (
    (select id from practice_attempt_rls_ids where key = 'other_attempt'),
    (select s.id from public.students s where s.profile_id = (select id from practice_attempt_rls_ids where key = 'other_student_profile')),
    (select id from practice_attempt_rls_ids where key = 'test'),
    0,
    0,
    1,
    'failed',
    now()
  );

insert into public.student_test_answers (
  id,
  attempt_id,
  question_id,
  selected_option_id,
  is_correct
)
values
  (
    (select id from practice_attempt_rls_ids where key = 'student_answer'),
    (select id from practice_attempt_rls_ids where key = 'student_attempt'),
    (select id from practice_attempt_rls_ids where key = 'question'),
    (select id from practice_attempt_rls_ids where key = 'correct_option'),
    true
  ),
  (
    (select id from practice_attempt_rls_ids where key = 'other_answer'),
    (select id from practice_attempt_rls_ids where key = 'other_attempt'),
    (select id from practice_attempt_rls_ids where key = 'question'),
    (select id from practice_attempt_rls_ids where key = 'wrong_option'),
    false
  );

do $$
declare
  v_expected_policies text[] := array[
    'student_test_answers_delete_own',
    'student_test_answers_insert_own',
    'student_test_answers_select_access',
    'student_test_answers_update_own',
    'student_test_attempts_delete_own',
    'student_test_attempts_insert_own',
    'student_test_attempts_select_access',
    'student_test_attempts_update_own'
  ];
  v_actual_policies text[];
begin
  select array_agg(policyname order by policyname)
    into v_actual_policies
  from pg_policies
  where schemaname = 'public'
    and tablename in ('student_test_attempts', 'student_test_answers');

  if v_actual_policies is distinct from v_expected_policies then
    raise exception 'Unexpected practice attempt policies: %', v_actual_policies;
  end if;

  if has_table_privilege('anon', 'public.student_test_attempts', 'SELECT')
    or has_table_privilege('anon', 'public.student_test_attempts', 'INSERT')
    or has_table_privilege('anon', 'public.student_test_attempts', 'UPDATE')
    or has_table_privilege('anon', 'public.student_test_attempts', 'DELETE')
    or has_table_privilege('anon', 'public.student_test_answers', 'SELECT')
    or has_table_privilege('anon', 'public.student_test_answers', 'INSERT')
    or has_table_privilege('anon', 'public.student_test_answers', 'UPDATE')
    or has_table_privilege('anon', 'public.student_test_answers', 'DELETE') then
    raise exception 'Anon still has direct practice attempt table privileges';
  end if;
end;
$$;

set local role anon;

do $$
begin
  perform count(*) from public.student_test_attempts;
  raise exception 'Anon practice attempt read unexpectedly succeeded';
exception
  when insufficient_privilege then
    null;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',
    (select id from practice_attempt_rls_ids where key = 'student_profile'),
    'role',
    'authenticated'
  )::text,
  true
);

do $$
declare
  v_student_attempt_id uuid := (select id from practice_attempt_rls_ids where key = 'student_attempt');
  v_other_attempt_id uuid := (select id from practice_attempt_rls_ids where key = 'other_attempt');
  v_student_answer_id uuid := (select id from practice_attempt_rls_ids where key = 'student_answer');
  v_other_answer_id uuid := (select id from practice_attempt_rls_ids where key = 'other_answer');
  v_count integer;
begin
  select count(*) into v_count
  from public.student_test_attempts;
  if v_count <> 1 then
    raise exception 'Student attempt visibility mismatch: %', v_count;
  end if;

  if exists (
    select 1 from public.student_test_attempts where id = v_other_attempt_id
  ) then
    raise exception 'student cannot read another student''s attempt';
  end if;

  update public.student_test_attempts
  set score = 90
  where id = v_student_attempt_id;
  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception 'Student cannot update own attempt';
  end if;

  update public.student_test_attempts
  set score = 90
  where id = v_other_attempt_id;
  get diagnostics v_count = row_count;
  if v_count <> 0 then
    raise exception 'Student updated another student''s attempt';
  end if;

  update public.student_test_answers
  set is_correct = false
  where id = v_student_answer_id;
  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception 'Student cannot update own answer';
  end if;

  update public.student_test_answers
  set is_correct = true
  where id = v_other_answer_id;
  get diagnostics v_count = row_count;
  if v_count <> 0 then
    raise exception 'Student updated another student''s answer';
  end if;
end;
$$;

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',
    (select id from practice_attempt_rls_ids where key = 'other_student_profile'),
    'role',
    'authenticated'
  )::text,
  true
);

do $$
begin
  if exists (
    select 1
    from public.student_test_attempts
    where id = (select id from practice_attempt_rls_ids where key = 'student_attempt')
  ) then
    raise exception 'Other student can read student attempt';
  end if;
end;
$$;

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',
    (select id from practice_attempt_rls_ids where key = 'teacher_profile'),
    'role',
    'authenticated'
  )::text,
  true
);

do $$
declare
  v_count integer;
begin
  if not exists (
    select 1
    from public.student_test_attempts
    where id = (select id from practice_attempt_rls_ids where key = 'student_attempt')
  ) then
    raise exception 'active assigned teacher can read attempt';
  end if;

  if exists (
    select 1
    from public.student_test_attempts
    where id = (select id from practice_attempt_rls_ids where key = 'other_attempt')
  ) then
    raise exception 'paused assignment does not grant teacher read';
  end if;

  update public.student_test_attempts
  set score = 80
  where id = (select id from practice_attempt_rls_ids where key = 'student_attempt');
  get diagnostics v_count = row_count;
  if v_count <> 0 then
    raise exception 'Teacher directly updated student attempt';
  end if;
end;
$$;

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',
    (select id from practice_attempt_rls_ids where key = 'manager_profile'),
    'role',
    'authenticated'
  )::text,
  true
);

do $$
begin
  if not exists (
    select 1
    from public.student_test_attempts
    where id = (select id from practice_attempt_rls_ids where key = 'student_attempt')
  ) or not exists (
    select 1
    from public.student_test_attempts
    where id = (select id from practice_attempt_rls_ids where key = 'other_attempt')
  ) then
    raise exception 'manager can read all-scoped attempt';
  end if;

  begin
    insert into public.student_test_answers (
      attempt_id,
      question_id,
      selected_option_id,
      is_correct
    )
    values (
      (select id from practice_attempt_rls_ids where key = 'student_attempt'),
      (select id from practice_attempt_rls_ids where key = 'mutation_question'),
      (select id from practice_attempt_rls_ids where key = 'mutation_option'),
      true
    );
    raise exception 'manager direct answer insert is denied';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;
end;
$$;

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',
    (select id from practice_attempt_rls_ids where key = 'admin_profile'),
    'role',
    'authenticated'
  )::text,
  true
);

do $$
declare
  v_count integer;
begin
  if not exists (
    select 1
    from public.student_test_answers
    where id = (select id from practice_attempt_rls_ids where key = 'student_answer')
  ) or not exists (
    select 1
    from public.student_test_answers
    where id = (select id from practice_attempt_rls_ids where key = 'other_answer')
  ) then
    raise exception 'Admin all-scope answer visibility mismatch';
  end if;

  begin
    insert into public.student_test_attempts (
      student_id,
      test_id,
      status
    )
    values (
      (select s.id from public.students s where s.profile_id = (select id from practice_attempt_rls_ids where key = 'student_profile')),
      (select id from practice_attempt_rls_ids where key = 'test'),
      'submitted'
    );
    raise exception 'admin direct attempt insert is denied';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  update public.student_test_answers
  set is_correct = false
  where id = (select id from practice_attempt_rls_ids where key = 'student_answer');
  get diagnostics v_count = row_count;
  if v_count <> 0 then
    raise exception 'Admin directly updated student answer';
  end if;
end;
$$;

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',
    (select id from practice_attempt_rls_ids where key = 'student_profile'),
    'role',
    'authenticated'
  )::text,
  true
);

do $$
declare
  v_result jsonb;
begin
  select public.submit_practice_test_attempt(
    (select id from practice_attempt_rls_ids where key = 'test'),
    jsonb_build_array(
      jsonb_build_object(
        'questionId',
        (select id from practice_attempt_rls_ids where key = 'question'),
        'optionId',
        (select id from practice_attempt_rls_ids where key = 'correct_option')
      ),
      jsonb_build_object(
        'questionId',
        (select id from practice_attempt_rls_ids where key = 'mutation_question'),
        'optionId',
        (select id from practice_attempt_rls_ids where key = 'mutation_option')
      )
    ),
    false,
    now() - interval '30 seconds',
    now(),
    30
  ) into v_result;

  if v_result ->> 'score' <> '100'
    or v_result ->> 'correctAnswers' <> '2'
    or v_result ->> 'passed' <> 'true' then
    raise exception 'Atomic RPC result mismatch after RLS cleanup: %', v_result;
  end if;
end;
$$;

rollback;

select 'status: practice attempt RLS cleanup smoke checks passed' as status;
