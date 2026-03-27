-- Seed for student cabinet demo data
-- Target user: rancid911@yandex.ru
-- Run this in Supabase SQL Editor after the student cabinet migration.

begin;

do $$
declare
  v_user_id uuid;
  v_profile_id uuid;
  v_student_id uuid;

  v_teacher_profile_id uuid;
  v_teacher_id uuid;

  v_course_grammar_id uuid;
  v_course_vocab_id uuid;

  v_module_present_simple_id uuid;
  v_module_articles_id uuid;
  v_module_travel_words_id uuid;

  v_lesson_present_drill_id uuid;
  v_lesson_articles_drill_id uuid;
  v_lesson_vocab_cards_id uuid;

  v_test_present_quiz_id uuid;
  v_test_articles_quiz_id uuid;
  v_test_vocab_trainer_id uuid;

  v_q_present_1 uuid;
  v_q_present_2 uuid;
  v_q_articles_1 uuid;
  v_q_vocab_1 uuid;

  v_attempt_present_failed_id uuid;
  v_attempt_articles_passed_id uuid;
  v_attempt_vocab_trainer_id uuid;

  v_assignment_active_id uuid;
  v_assignment_completed_id uuid;
  v_assignment_overdue_id uuid;

  v_hw_item_active_test_id uuid;
  v_hw_item_active_lesson_id uuid;
  v_hw_item_completed_id uuid;
  v_hw_item_overdue_id uuid;

  v_word_1_id uuid;
  v_word_2_id uuid;
  v_word_3_id uuid;

  v_notification_id uuid;
begin
  select id
  into v_user_id
  from auth.users
  where lower(email) = 'rancid911@yandex.ru'
  limit 1;

  if v_user_id is null then
    raise exception 'User with email % not found in auth.users', 'rancid911@yandex.ru';
  end if;

  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    display_name,
    role,
    status,
    phone,
    timezone,
    birth_date
  )
  values (
    v_user_id,
    'rancid911@yandex.ru',
    'Anton',
    'Rancid',
    'Anton Rancid',
    'student',
    'active',
    '+79991234567',
    'Europe/Moscow',
    date '1995-08-17'
  )
  on conflict (id) do update
  set email = excluded.email,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      display_name = excluded.display_name,
      role = excluded.role,
      status = excluded.status,
      phone = excluded.phone,
      timezone = excluded.timezone,
      birth_date = excluded.birth_date;

  v_profile_id := v_user_id;

  insert into public.students (
    profile_id,
    birth_date,
    english_level,
    target_level,
    learning_goal,
    preferred_language,
    onboarding_completed,
    notes
  )
  values (
    v_profile_id,
    date '1995-08-17',
    'B1',
    'B2',
    'Уверенно говорить на работе и проходить интервью на английском',
    'ru',
    true,
    'Seeded student for cabinet demo'
  )
  on conflict (profile_id) do update
  set birth_date = excluded.birth_date,
      english_level = excluded.english_level,
      target_level = excluded.target_level,
      learning_goal = excluded.learning_goal,
      preferred_language = excluded.preferred_language,
      onboarding_completed = excluded.onboarding_completed,
      notes = excluded.notes
  returning id into v_student_id;

  if v_student_id is null then
    select id into v_student_id
    from public.students
    where profile_id = v_profile_id;
  end if;

  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    display_name,
    role,
    status,
    phone,
    timezone
  )
  values (
    '11111111-1111-1111-1111-111111111111',
    'teacher.demo@flexeng.ru',
    'Maria',
    'Teacher',
    'Maria Teacher',
    'teacher',
    'active',
    '+79990001122',
    'Europe/Moscow'
  )
  on conflict (id) do update
  set email = excluded.email,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      display_name = excluded.display_name,
      role = excluded.role,
      status = excluded.status,
      phone = excluded.phone,
      timezone = excluded.timezone;

  v_teacher_profile_id := '11111111-1111-1111-1111-111111111111';

  insert into public.teachers (
    profile_id,
    bio,
    specialization,
    hourly_rate,
    is_active
  )
  values (
    v_teacher_profile_id,
    'Преподаватель General English и Speaking practice.',
    array['grammar', 'speaking', 'business']::text[],
    2500,
    true
  )
  on conflict (profile_id) do update
  set bio = excluded.bio,
      specialization = excluded.specialization,
      hourly_rate = excluded.hourly_rate,
      is_active = excluded.is_active
  returning id into v_teacher_id;

  if v_teacher_id is null then
    select id into v_teacher_id
    from public.teachers
    where profile_id = v_teacher_profile_id;
  end if;

  insert into public.courses (
    title,
    slug,
    description,
    audience,
    level_from,
    level_to,
    is_published
  )
  values (
    'Grammar Foundations',
    'grammar-foundations',
    'Базовый курс грамматики для практики между уроками.',
    'adults',
    'A2',
    'B2',
    true
  )
  on conflict (slug) do update
  set title = excluded.title,
      description = excluded.description,
      audience = excluded.audience,
      level_from = excluded.level_from,
      level_to = excluded.level_to,
      is_published = excluded.is_published
  returning id into v_course_grammar_id;

  if v_course_grammar_id is null then
    select id into v_course_grammar_id
    from public.courses
    where slug = 'grammar-foundations';
  end if;

  insert into public.courses (
    title,
    slug,
    description,
    audience,
    level_from,
    level_to,
    is_published
  )
  values (
    'Vocabulary Booster',
    'vocabulary-booster',
    'Лексика для повторения, карточек и коротких тренировок.',
    'adults',
    'A2',
    'B2',
    true
  )
  on conflict (slug) do update
  set title = excluded.title,
      description = excluded.description,
      audience = excluded.audience,
      level_from = excluded.level_from,
      level_to = excluded.level_to,
      is_published = excluded.is_published
  returning id into v_course_vocab_id;

  if v_course_vocab_id is null then
    select id into v_course_vocab_id
    from public.courses
    where slug = 'vocabulary-booster';
  end if;

  insert into public.course_modules (course_id, title, description, sort_order, is_published)
  values (v_course_grammar_id, 'Present Simple', 'Утверждения, вопросы, отрицания и do/does.', 1, true)
  returning id into v_module_present_simple_id;
  exception when unique_violation then null;

  if v_module_present_simple_id is null then
    select id into v_module_present_simple_id
    from public.course_modules
    where course_id = v_course_grammar_id and title = 'Present Simple'
    limit 1;
  end if;

  insert into public.course_modules (course_id, title, description, sort_order, is_published)
  values (v_course_grammar_id, 'Articles', 'Практика a / an / the в реальных примерах.', 2, true)
  returning id into v_module_articles_id;
  exception when unique_violation then null;

  if v_module_articles_id is null then
    select id into v_module_articles_id
    from public.course_modules
    where course_id = v_course_grammar_id and title = 'Articles'
    limit 1;
  end if;

  insert into public.course_modules (course_id, title, description, sort_order, is_published)
  values (v_course_vocab_id, 'Travel Words', 'Полезная лексика для поездок и общения в аэропорту.', 1, true)
  returning id into v_module_travel_words_id;
  exception when unique_violation then null;

  if v_module_travel_words_id is null then
    select id into v_module_travel_words_id
    from public.course_modules
    where course_id = v_course_vocab_id and title = 'Travel Words'
    limit 1;
  end if;

  insert into public.lessons (
    module_id,
    title,
    description,
    lesson_type,
    content,
    duration_minutes,
    sort_order,
    is_published
  )
  values (
    v_module_present_simple_id,
    'Present Simple Drill',
    'Короткая практика по do / does, утверждениям и вопросам.',
    'practice',
    jsonb_build_object(
      'summary', 'Present Simple practice',
      'focus', jsonb_build_array('do / does', 'word order', 'question forms')
    ),
    8,
    1,
    true
  )
  returning id into v_lesson_present_drill_id;

  if v_lesson_present_drill_id is null then
    select id into v_lesson_present_drill_id
    from public.lessons
    where module_id = v_module_present_simple_id and title = 'Present Simple Drill'
    limit 1;
  end if;

  insert into public.lessons (
    module_id,
    title,
    description,
    lesson_type,
    content,
    duration_minutes,
    sort_order,
    is_published
  )
  values (
    v_module_articles_id,
    'Articles Drill',
    'Практика выбора артиклей в контексте.',
    'practice',
    jsonb_build_object(
      'summary', 'Articles practice',
      'focus', jsonb_build_array('a/an/the', 'zero article')
    ),
    7,
    1,
    true
  )
  returning id into v_lesson_articles_drill_id;

  if v_lesson_articles_drill_id is null then
    select id into v_lesson_articles_drill_id
    from public.lessons
    where module_id = v_module_articles_id and title = 'Articles Drill'
    limit 1;
  end if;

  insert into public.lessons (
    module_id,
    title,
    description,
    lesson_type,
    content,
    duration_minutes,
    sort_order,
    is_published
  )
  values (
    v_module_travel_words_id,
    'Travel Flashcards',
    'Карточки по теме путешествий и аэропорта.',
    'flashcards',
    jsonb_build_object(
      'words', jsonb_build_array(
        jsonb_build_object('term', 'boarding pass', 'translation', 'посадочный талон'),
        jsonb_build_object('term', 'customs', 'translation', 'таможня'),
        jsonb_build_object('term', 'departure gate', 'translation', 'выход на посадку')
      )
    ),
    6,
    1,
    true
  )
  returning id into v_lesson_vocab_cards_id;

  if v_lesson_vocab_cards_id is null then
    select id into v_lesson_vocab_cards_id
    from public.lessons
    where module_id = v_module_travel_words_id and title = 'Travel Flashcards'
    limit 1;
  end if;

  insert into public.tests (
    lesson_id,
    module_id,
    title,
    description,
    passing_score,
    time_limit_minutes,
    is_published,
    activity_type,
    estimated_duration_minutes
  )
  values (
    v_lesson_present_drill_id,
    v_module_present_simple_id,
    'Present Simple Quiz',
    'Тест на утверждения и вопросительные формы.',
    70,
    10,
    true,
    'test',
    10
  )
  returning id into v_test_present_quiz_id;

  if v_test_present_quiz_id is null then
    select id into v_test_present_quiz_id
    from public.tests
    where module_id = v_module_present_simple_id and title = 'Present Simple Quiz'
    limit 1;
  end if;

  insert into public.tests (
    lesson_id,
    module_id,
    title,
    description,
    passing_score,
    time_limit_minutes,
    is_published,
    activity_type,
    estimated_duration_minutes
  )
  values (
    v_lesson_articles_drill_id,
    v_module_articles_id,
    'Articles Quiz',
    'Тест на выбор артиклей в коротких фразах.',
    70,
    8,
    true,
    'test',
    8
  )
  returning id into v_test_articles_quiz_id;

  if v_test_articles_quiz_id is null then
    select id into v_test_articles_quiz_id
    from public.tests
    where module_id = v_module_articles_id and title = 'Articles Quiz'
    limit 1;
  end if;

  insert into public.tests (
    lesson_id,
    module_id,
    title,
    description,
    passing_score,
    time_limit_minutes,
    is_published,
    activity_type,
    estimated_duration_minutes
  )
  values (
    v_lesson_vocab_cards_id,
    v_module_travel_words_id,
    'Travel Words Trainer',
    'Короткий тренажёр по лексике путешествий.',
    60,
    6,
    true,
    'trainer',
    6
  )
  returning id into v_test_vocab_trainer_id;

  if v_test_vocab_trainer_id is null then
    select id into v_test_vocab_trainer_id
    from public.tests
    where module_id = v_module_travel_words_id and title = 'Travel Words Trainer'
    limit 1;
  end if;

  insert into public.test_questions (test_id, question_type, prompt, explanation, sort_order)
  values
    (v_test_present_quiz_id, 'single_choice', '___ she work in the office every day?', 'Use the auxiliary verb for Present Simple questions.', 1),
    (v_test_present_quiz_id, 'single_choice', 'He ___ coffee every morning.', 'Choose the correct verb form for he/she/it.', 2),
    (v_test_articles_quiz_id, 'single_choice', 'I need ___ umbrella because it is raining.', 'Choose the correct article before a vowel sound.', 1),
    (v_test_vocab_trainer_id, 'single_choice', 'What do you show before boarding the plane?', 'Travel vocabulary in context.', 1)
  on conflict do nothing;

  select id into v_q_present_1
  from public.test_questions
  where test_id = v_test_present_quiz_id and sort_order = 1
  limit 1;

  select id into v_q_present_2
  from public.test_questions
  where test_id = v_test_present_quiz_id and sort_order = 2
  limit 1;

  select id into v_q_articles_1
  from public.test_questions
  where test_id = v_test_articles_quiz_id and sort_order = 1
  limit 1;

  select id into v_q_vocab_1
  from public.test_questions
  where test_id = v_test_vocab_trainer_id and sort_order = 1
  limit 1;

  insert into public.test_question_options (question_id, option_text, is_correct, sort_order)
  values
    (v_q_present_1, 'Do', true, 1),
    (v_q_present_1, 'Does', false, 2),
    (v_q_present_1, 'Is', false, 3),
    (v_q_present_2, 'drink', false, 1),
    (v_q_present_2, 'drinks', true, 2),
    (v_q_present_2, 'drinking', false, 3),
    (v_q_articles_1, 'a', false, 1),
    (v_q_articles_1, 'an', true, 2),
    (v_q_articles_1, 'the', false, 3),
    (v_q_vocab_1, 'boarding pass', true, 1),
    (v_q_vocab_1, 'suitcase', false, 2),
    (v_q_vocab_1, 'departure board', false, 3)
  on conflict do nothing;

  insert into public.student_course_enrollments (
    student_id,
    course_id,
    assigned_teacher_id,
    status,
    started_at
  )
  values
    (v_student_id, v_course_grammar_id, v_teacher_id, 'active', now() - interval '40 days'),
    (v_student_id, v_course_vocab_id, v_teacher_id, 'active', now() - interval '20 days')
  on conflict do nothing;

  insert into public.student_lesson_progress (
    student_id,
    lesson_id,
    status,
    progress_percent,
    time_spent_seconds,
    started_at,
    completed_at,
    last_position
  )
  values
    (
      v_student_id,
      v_lesson_present_drill_id,
      'in_progress',
      70,
      820,
      now() - interval '2 days',
      null,
      jsonb_build_object('step', 5, 'section', 'questions')
    ),
    (
      v_student_id,
      v_lesson_articles_drill_id,
      'completed',
      100,
      660,
      now() - interval '7 days',
      now() - interval '6 days',
      jsonb_build_object('step', 8, 'section', 'done')
    ),
    (
      v_student_id,
      v_lesson_vocab_cards_id,
      'in_progress',
      35,
      320,
      now() - interval '1 day',
      null,
      jsonb_build_object('card_index', 12)
    )
  on conflict do nothing;

  insert into public.student_test_attempts (
    student_id,
    test_id,
    score,
    correct_answers,
    total_questions,
    status,
    started_at,
    submitted_at,
    time_spent_seconds
  )
  values
    (
      v_student_id,
      v_test_present_quiz_id,
      50,
      1,
      2,
      'failed',
      now() - interval '3 days',
      now() - interval '3 days' + interval '9 minutes',
      540
    ),
    (
      v_student_id,
      v_test_articles_quiz_id,
      100,
      1,
      1,
      'passed',
      now() - interval '6 days',
      now() - interval '6 days' + interval '6 minutes',
      360
    ),
    (
      v_student_id,
      v_test_vocab_trainer_id,
      67,
      2,
      3,
      'submitted',
      now() - interval '1 day',
      now() - interval '1 day' + interval '4 minutes',
      240
    )
  returning id
  into v_attempt_present_failed_id;

  if v_attempt_present_failed_id is null then
    select id into v_attempt_present_failed_id
    from public.student_test_attempts
    where student_id = v_student_id and test_id = v_test_present_quiz_id
    order by created_at desc
    limit 1;
  end if;

  select id into v_attempt_articles_passed_id
  from public.student_test_attempts
  where student_id = v_student_id and test_id = v_test_articles_quiz_id
  order by created_at desc
  limit 1;

  select id into v_attempt_vocab_trainer_id
  from public.student_test_attempts
  where student_id = v_student_id and test_id = v_test_vocab_trainer_id
  order by created_at desc
  limit 1;

  insert into public.student_test_answers (
    attempt_id,
    question_id,
    selected_option_id,
    answer_text,
    is_correct
  )
  select
    v_attempt_present_failed_id,
    v_q_present_1,
    qo.id,
    null,
    false
  from public.test_question_options qo
  where qo.question_id = v_q_present_1
    and qo.option_text = 'Does'
  on conflict do nothing;

  insert into public.student_test_answers (
    attempt_id,
    question_id,
    selected_option_id,
    answer_text,
    is_correct
  )
  select
    v_attempt_present_failed_id,
    v_q_present_2,
    qo.id,
    null,
    true
  from public.test_question_options qo
  where qo.question_id = v_q_present_2
    and qo.option_text = 'drinks'
  on conflict do nothing;

  insert into public.student_test_answers (
    attempt_id,
    question_id,
    selected_option_id,
    answer_text,
    is_correct
  )
  select
    v_attempt_articles_passed_id,
    v_q_articles_1,
    qo.id,
    null,
    true
  from public.test_question_options qo
  where qo.question_id = v_q_articles_1
    and qo.option_text = 'an'
  on conflict do nothing;

  insert into public.student_test_answers (
    attempt_id,
    question_id,
    selected_option_id,
    answer_text,
    is_correct
  )
  select
    v_attempt_vocab_trainer_id,
    v_q_vocab_1,
    qo.id,
    null,
    true
  from public.test_question_options qo
  where qo.question_id = v_q_vocab_1
    and qo.option_text = 'boarding pass'
  on conflict do nothing;

  insert into public.homework_assignments (
    student_id,
    assigned_by_profile_id,
    title,
    description,
    status,
    due_at,
    completed_at
  )
  values
    (
      v_student_id,
      v_teacher_profile_id,
      'Домашняя работа: Present Simple',
      'Повторить тему Present Simple и пройти тест.',
      'in_progress',
      now() + interval '2 days',
      null
    ),
    (
      v_student_id,
      v_teacher_profile_id,
      'Домашняя работа: Articles',
      'Закрытая домашняя работа по артиклям.',
      'completed',
      now() - interval '5 days',
      now() - interval '4 days'
    ),
    (
      v_student_id,
      v_teacher_profile_id,
      'Домашняя работа: Travel Vocabulary',
      'Лексика по теме путешествий, дедлайн пропущен.',
      'overdue',
      now() - interval '1 day',
      null
    )
  returning id
  into v_assignment_active_id;

  if v_assignment_active_id is null then
    select id into v_assignment_active_id
    from public.homework_assignments
    where student_id = v_student_id and title = 'Домашняя работа: Present Simple'
    limit 1;
  end if;

  select id into v_assignment_completed_id
  from public.homework_assignments
  where student_id = v_student_id and title = 'Домашняя работа: Articles'
  limit 1;

  select id into v_assignment_overdue_id
  from public.homework_assignments
  where student_id = v_student_id and title = 'Домашняя работа: Travel Vocabulary'
  limit 1;

  insert into public.homework_items (assignment_id, source_type, source_id, sort_order, required)
  values
    (v_assignment_active_id, 'lesson', v_lesson_present_drill_id, 1, true),
    (v_assignment_active_id, 'test', v_test_present_quiz_id, 2, true),
    (v_assignment_completed_id, 'test', v_test_articles_quiz_id, 1, true),
    (v_assignment_overdue_id, 'test', v_test_vocab_trainer_id, 1, true)
  returning id
  into v_hw_item_active_lesson_id;

  if v_hw_item_active_lesson_id is null then
    select id into v_hw_item_active_lesson_id
    from public.homework_items
    where assignment_id = v_assignment_active_id and source_type = 'lesson' and source_id = v_lesson_present_drill_id
    limit 1;
  end if;

  select id into v_hw_item_active_test_id
  from public.homework_items
  where assignment_id = v_assignment_active_id and source_type = 'test' and source_id = v_test_present_quiz_id
  limit 1;

  select id into v_hw_item_completed_id
  from public.homework_items
  where assignment_id = v_assignment_completed_id and source_type = 'test' and source_id = v_test_articles_quiz_id
  limit 1;

  select id into v_hw_item_overdue_id
  from public.homework_items
  where assignment_id = v_assignment_overdue_id and source_type = 'test' and source_id = v_test_vocab_trainer_id
  limit 1;

  insert into public.student_homework_progress (
    assignment_id,
    homework_item_id,
    student_id,
    status,
    started_at,
    completed_at
  )
  values
    (v_assignment_active_id, v_hw_item_active_lesson_id, v_student_id, 'in_progress', now() - interval '2 days', null),
    (v_assignment_active_id, v_hw_item_active_test_id, v_student_id, 'not_started', null, null),
    (v_assignment_completed_id, v_hw_item_completed_id, v_student_id, 'completed', now() - interval '5 days', now() - interval '4 days'),
    (v_assignment_overdue_id, v_hw_item_overdue_id, v_student_id, 'not_started', null, null)
  on conflict (student_id, homework_item_id) do update
  set status = excluded.status,
      started_at = excluded.started_at,
      completed_at = excluded.completed_at;

  insert into public.student_favorites (student_id, entity_type, entity_id)
  values
    (v_student_id, 'course', v_course_grammar_id),
    (v_student_id, 'module', v_module_present_simple_id),
    (v_student_id, 'test', v_test_vocab_trainer_id)
  on conflict (student_id, entity_type, entity_id) do nothing;

  insert into public.student_mistakes (
    student_id,
    attempt_id,
    test_id,
    question_id,
    course_id,
    module_id,
    mistake_count,
    last_mistake_at,
    resolved_at
  )
  values
    (
      v_student_id,
      v_attempt_present_failed_id,
      v_test_present_quiz_id,
      v_q_present_1,
      v_course_grammar_id,
      v_module_present_simple_id,
      3,
      now() - interval '1 day',
      null
    ),
    (
      v_student_id,
      v_attempt_present_failed_id,
      v_test_present_quiz_id,
      v_q_present_2,
      v_course_grammar_id,
      v_module_present_simple_id,
      1,
      now() - interval '3 days',
      now() - interval '2 days'
    )
  on conflict (student_id, question_id) do update
  set attempt_id = excluded.attempt_id,
      test_id = excluded.test_id,
      course_id = excluded.course_id,
      module_id = excluded.module_id,
      mistake_count = excluded.mistake_count,
      last_mistake_at = excluded.last_mistake_at,
      resolved_at = excluded.resolved_at,
      updated_at = now();

  insert into public.student_words (
    student_id,
    term,
    translation,
    source_type,
    source_entity_id,
    status,
    next_review_at,
    last_reviewed_at,
    ease_factor,
    interval_days,
    review_count
  )
  values
    (
      v_student_id,
      'boarding pass',
      'посадочный талон',
      'test',
      v_test_vocab_trainer_id,
      'review',
      now() - interval '1 hour',
      now() - interval '2 days',
      2.6,
      3,
      2
    ),
    (
      v_student_id,
      'customs',
      'таможня',
      'manual',
      null,
      'new',
      now(),
      null,
      2.5,
      0,
      0
    ),
    (
      v_student_id,
      'departure gate',
      'выход на посадку',
      'homework',
      v_assignment_overdue_id,
      'learning',
      now() + interval '1 day',
      now() - interval '1 day',
      2.4,
      1,
      1
    )
  returning id
  into v_word_1_id;

  if v_word_1_id is null then
    select id into v_word_1_id
    from public.student_words
    where student_id = v_student_id and term = 'boarding pass'
    limit 1;
  end if;

  select id into v_word_2_id
  from public.student_words
  where student_id = v_student_id and term = 'customs'
  limit 1;

  select id into v_word_3_id
  from public.student_words
  where student_id = v_student_id and term = 'departure gate'
  limit 1;

  insert into public.student_word_reviews (
    student_word_id,
    student_id,
    result,
    reviewed_at
  )
  values
    (v_word_1_id, v_student_id, 'good', now() - interval '4 days'),
    (v_word_1_id, v_student_id, 'easy', now() - interval '2 days'),
    (v_word_3_id, v_student_id, 'hard', now() - interval '1 day')
  on conflict do nothing;

  insert into public.payment_transactions (
    student_id,
    amount,
    currency,
    status,
    paid_at,
    description
  )
  values
    (v_student_id, 12990, 'RUB', 'succeeded', now() - interval '32 days', 'Оплата абонемента за март'),
    (v_student_id, 12990, 'RUB', 'succeeded', now() - interval '2 days', 'Оплата абонемента за апрель'),
    (v_student_id, 4990, 'RUB', 'pending', null, 'Дополнительный разговорный пакет')
  on conflict do nothing;

  insert into public.student_activity_log (
    student_id,
    activity_type,
    entity_type,
    entity_id,
    meta
  )
  values
    (v_student_id, 'lesson_started', 'lesson', v_lesson_present_drill_id, jsonb_build_object('progress', 70)),
    (v_student_id, 'test_failed', 'test', v_test_present_quiz_id, jsonb_build_object('score', 50)),
    (v_student_id, 'homework_opened', 'homework', v_assignment_active_id, jsonb_build_object('status', 'in_progress'))
  on conflict do nothing;

  insert into public.notifications (
    title,
    body,
    type,
    is_active,
    target_roles,
    published_at,
    expires_at,
    created_by
  )
  values (
    'Новое домашнее задание',
    'Преподаватель добавил новую домашнюю работу по Present Simple.',
    'assignments',
    true,
    array['student']::text[],
    now() - interval '2 hours',
    now() + interval '14 days',
    v_teacher_profile_id
  )
  returning id into v_notification_id;

  insert into public.notification_user_state (
    notification_id,
    user_id,
    read_at,
    dismissed_at
  )
  values (
    v_notification_id,
    v_profile_id,
    null,
    null
  )
  on conflict (notification_id, user_id) do update
  set read_at = excluded.read_at,
      dismissed_at = excluded.dismissed_at;
end $$;

commit;
