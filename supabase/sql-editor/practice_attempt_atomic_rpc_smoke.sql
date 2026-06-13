-- Transactional smoke for submit_practice_test_attempt.
-- Run after the migration on a staging project or database branch.
-- The script creates isolated fixtures and always rolls them back.

begin;

do $$
declare
  v_student_profile_id uuid := '70000000-0000-4000-8000-000000000001';
  v_other_profile_id uuid := '70000000-0000-4000-8000-000000000002';
  v_teacher_profile_id uuid := '70000000-0000-4000-8000-000000000003';
begin
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
  values
    (
      v_student_profile_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'practice-rpc-student@example.invalid',
      '',
      now(),
      '{"provider":"email","providers":["email"],"provision_source":"admin_create","provision_role":"student"}',
      '{"display_name":"Practice RPC Student"}',
      now(),
      now()
    ),
    (
      v_other_profile_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'practice-rpc-other@example.invalid',
      '',
      now(),
      '{"provider":"email","providers":["email"],"provision_source":"admin_create","provision_role":"student"}',
      '{"display_name":"Practice RPC Other"}',
      now(),
      now()
    ),
    (
      v_teacher_profile_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'practice-rpc-teacher@example.invalid',
      '',
      now(),
      '{"provider":"email","providers":["email"],"provision_source":"admin_create","provision_role":"teacher"}',
      '{"display_name":"Practice RPC Teacher"}',
      now(),
      now()
    )
  on conflict (id) do nothing;
end;
$$;

insert into public.courses (
  id,
  title,
  slug,
  is_published
)
values (
  '70500000-0000-4000-8000-000000000001',
  'Atomic practice smoke course',
  'atomic-practice-rpc-smoke',
  true
);

insert into public.course_modules (
  id,
  course_id,
  title,
  is_published
)
values (
  '70600000-0000-4000-8000-000000000001',
  '70500000-0000-4000-8000-000000000001',
  'Atomic practice smoke module',
  true
);

insert into public.tests (
  id,
  module_id,
  title,
  passing_score,
  is_published,
  assessment_kind,
  scoring_profile
)
values
  (
    '71000000-0000-4000-8000-000000000001',
    '70600000-0000-4000-8000-000000000001',
    'Atomic regular smoke',
    70,
    true,
    'regular',
    null
  ),
  (
    '71000000-0000-4000-8000-000000000002',
    '70600000-0000-4000-8000-000000000001',
    'Atomic placement smoke',
    0,
    true,
    'placement',
    null
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
    '72000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001',
    'Regular one',
    'single_choice',
    'beginner',
    1
  ),
  (
    '72000000-0000-4000-8000-000000000002',
    '71000000-0000-4000-8000-000000000001',
    'Regular two',
    'single_choice',
    'elementary',
    2
  ),
  (
    '72000000-0000-4000-8000-000000000003',
    '71000000-0000-4000-8000-000000000002',
    'Placement one',
    'single_choice',
    'beginner',
    1
  ),
  (
    '72000000-0000-4000-8000-000000000004',
    '71000000-0000-4000-8000-000000000002',
    'Placement two',
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
  ('73000000-0000-4000-8000-000000000001', '72000000-0000-4000-8000-000000000001', 'Correct', true, 1),
  ('73000000-0000-4000-8000-000000000002', '72000000-0000-4000-8000-000000000001', 'Wrong', false, 2),
  ('73000000-0000-4000-8000-000000000003', '72000000-0000-4000-8000-000000000002', 'Correct', true, 1),
  ('73000000-0000-4000-8000-000000000004', '72000000-0000-4000-8000-000000000002', 'Wrong', false, 2),
  ('73000000-0000-4000-8000-000000000005', '72000000-0000-4000-8000-000000000003', 'Correct', true, 1),
  ('73000000-0000-4000-8000-000000000006', '72000000-0000-4000-8000-000000000003', 'Wrong', false, 2),
  ('73000000-0000-4000-8000-000000000007', '72000000-0000-4000-8000-000000000004', 'Correct', true, 1),
  ('73000000-0000-4000-8000-000000000008', '72000000-0000-4000-8000-000000000004', 'Wrong', false, 2);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

do $$
declare
  v_result jsonb;
  v_attempt_id uuid;
  v_student_id uuid;
  v_before integer;
begin
  select public.submit_practice_test_attempt(
    '71000000-0000-4000-8000-000000000001',
    '[
      {"questionId":"72000000-0000-4000-8000-000000000001","optionId":"73000000-0000-4000-8000-000000000001"},
      {"questionId":"72000000-0000-4000-8000-000000000002","optionId":"73000000-0000-4000-8000-000000000004"}
    ]',
    false,
    '2026-06-12T09:59:00Z',
    '2026-06-12T10:00:00Z',
    60
  ) into v_result;

  v_attempt_id := (v_result ->> 'attemptId')::uuid;
  select id into v_student_id
  from public.students
  where profile_id = '70000000-0000-4000-8000-000000000001';

  if v_result ->> 'score' <> '50'
    or v_result ->> 'correctAnswers' <> '1'
    or v_result ->> 'passed' <> 'false'
    or (select count(*) from public.student_test_answers where attempt_id = v_attempt_id) <> 2
    or not exists (
      select 1
      from public.student_test_attempts
      where id = v_attempt_id
        and student_id = v_student_id
    ) then
    raise exception 'Regular atomic attempt result mismatch: %', v_result;
  end if;

  select count(*) into v_before
  from public.student_test_attempts
  where test_id = '71000000-0000-4000-8000-000000000001';

  begin
    perform public.submit_practice_test_attempt(
      '71000000-0000-4000-8000-000000000001',
      '[{"questionId":"72000000-0000-4000-8000-000000000001","optionId":"73000000-0000-4000-8000-000000000001"}]',
      false,
      now(),
      now(),
      0
    );
    raise exception 'Incomplete regular attempt unexpectedly succeeded';
  exception
    when sqlstate 'P0001' then
      if sqlerrm not like 'INCOMPLETE_ATTEMPT:%' then
        raise;
      end if;
  end;

  begin
    perform public.submit_practice_test_attempt(
      '71000000-0000-4000-8000-000000000001',
      '[
        {"questionId":"72000000-0000-4000-8000-000000000001","optionId":"73000000-0000-4000-8000-000000000003"},
        {"questionId":"72000000-0000-4000-8000-000000000002","optionId":"73000000-0000-4000-8000-000000000004"}
      ]',
      false,
      now(),
      now(),
      0
    );
    raise exception 'Cross-question option unexpectedly succeeded';
  exception
    when sqlstate 'P0001' then
      if sqlerrm not like 'INVALID_OPTION:%' then
        raise;
      end if;
  end;

  if (
    select count(*)
    from public.student_test_attempts
    where test_id = '71000000-0000-4000-8000-000000000001'
  ) <> v_before then
    raise exception 'Invalid submissions created attempt rows';
  end if;
end;
$$;

select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

do $$
declare
  v_result jsonb;
  v_other_student_id uuid;
begin
  select public.submit_practice_test_attempt(
    '71000000-0000-4000-8000-000000000001',
    '[
      {"questionId":"72000000-0000-4000-8000-000000000001","optionId":"73000000-0000-4000-8000-000000000001"},
      {"questionId":"72000000-0000-4000-8000-000000000002","optionId":"73000000-0000-4000-8000-000000000003"}
    ]',
    false,
    now(),
    now(),
    0
  ) into v_result;

  select id into v_other_student_id
  from public.students
  where profile_id = '70000000-0000-4000-8000-000000000002';

  if not exists (
    select 1
    from public.student_test_attempts
    where id = (v_result ->> 'attemptId')::uuid
      and student_id = v_other_student_id
  ) then
    raise exception 'RPC did not derive ownership from the authenticated actor';
  end if;
end;
$$;

select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-4000-8000-000000000003","role":"authenticated"}',
  true
);

do $$
begin
  perform public.submit_practice_test_attempt(
    '71000000-0000-4000-8000-000000000001',
    '[
      {"questionId":"72000000-0000-4000-8000-000000000001","optionId":"73000000-0000-4000-8000-000000000001"},
      {"questionId":"72000000-0000-4000-8000-000000000002","optionId":"73000000-0000-4000-8000-000000000003"}
    ]',
    false,
    now(),
    now(),
    0
  );
  raise exception 'Teacher attempt unexpectedly succeeded';
exception
  when sqlstate 'P0001' then
    if sqlerrm not like 'FORBIDDEN:%' then
      raise;
    end if;
end;
$$;

set local role anon;

do $$
begin
  perform public.submit_practice_test_attempt(
    '71000000-0000-4000-8000-000000000001',
    '[]',
    false,
    now(),
    now(),
    0
  );
  raise exception 'Anon execute unexpectedly succeeded';
exception
  when insufficient_privilege then
    null;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

reset role;

create or replace function pg_temp.force_practice_answer_failure()
returns trigger
language plpgsql
as $$
begin
  raise exception 'forced answer failure';
end;
$$;

create trigger force_practice_answer_failure
before insert on public.student_test_answers
for each row execute function pg_temp.force_practice_answer_failure();

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

do $$
declare
  v_before integer;
begin
  select count(*) into v_before
  from public.student_test_attempts
  where test_id = '71000000-0000-4000-8000-000000000001';

  begin
    perform public.submit_practice_test_attempt(
      '71000000-0000-4000-8000-000000000001',
      '[
        {"questionId":"72000000-0000-4000-8000-000000000001","optionId":"73000000-0000-4000-8000-000000000001"},
        {"questionId":"72000000-0000-4000-8000-000000000002","optionId":"73000000-0000-4000-8000-000000000003"}
      ]',
      false,
      now(),
      now(),
      0
    );
    raise exception 'Forced answer failure unexpectedly succeeded';
  exception
    when sqlstate 'P0001' then
      if sqlerrm not like 'ATTEMPT_ANSWERS_SAVE_FAILED:%' then
        raise;
      end if;
  end;

  if (
    select count(*)
    from public.student_test_attempts
    where test_id = '71000000-0000-4000-8000-000000000001'
  ) <> v_before then
    raise exception 'Answer failure did not roll back the attempt';
  end if;
end;
$$;

reset role;
drop trigger force_practice_answer_failure on public.student_test_answers;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

do $$
declare
  v_result jsonb;
begin
  select public.submit_practice_test_attempt(
    '71000000-0000-4000-8000-000000000002',
    '[{"questionId":"72000000-0000-4000-8000-000000000003","optionId":"73000000-0000-4000-8000-000000000005"}]',
    true,
    now() - interval '30 minutes',
    now(),
    1800
  ) into v_result;

  if v_result ->> 'score' <> '50'
    or v_result ->> 'correctAnswers' <> '1'
    or v_result ->> 'assessmentKind' <> 'placement'
    or v_result ->> 'recommendedLevel' <> 'Beginner'
    or v_result ->> 'recommendedBandLabel' <> 'Lower part of Beginner'
    or jsonb_array_length(v_result -> 'answers') <> 2 then
    raise exception 'Placement result mismatch: %', v_result;
  end if;
end;
$$;

rollback;

select 'status: atomic practice attempt RPC smoke checks passed' as status;
