-- Seed for schedule demo data
-- Requires:
-- 1. student_schedule_migration_20260327.sql
-- 2. seed_student_rancid911_20260326.sql (or equivalent student/teacher/enrollment demo data)

begin;

do $$
declare
  v_student_profile_id uuid;
  v_teacher_profile_id uuid := '11111111-1111-1111-1111-111111111111';
  v_student_id uuid;
  v_teacher_id uuid;
begin
  select id
  into v_student_profile_id
  from auth.users
  where lower(email) = 'rancid911@yandex.ru'
  limit 1;

  if v_student_profile_id is null then
    raise exception 'User with email % not found in auth.users', 'rancid911@yandex.ru';
  end if;

  select id
  into v_student_id
  from public.students
  where profile_id = v_student_profile_id
  limit 1;

  if v_student_id is null then
    raise exception 'Student row for profile % not found in public.students', v_student_profile_id;
  end if;

  select id
  into v_teacher_id
  from public.teachers
  where profile_id = v_teacher_profile_id
  limit 1;

  if v_teacher_id is null then
    raise exception 'Teacher row for profile % not found in public.teachers', v_teacher_profile_id;
  end if;

  insert into public.student_schedule_lessons (
    student_id,
    teacher_id,
    title,
    starts_at,
    ends_at,
    meeting_url,
    comment,
    status,
    created_by_profile_id,
    updated_by_profile_id
  )
  values
    (
      v_student_id,
      v_teacher_id,
      'Speaking warm-up',
      now() + interval '1 day' + interval '10 hours',
      now() + interval '1 day' + interval '10 hours 45 minutes',
      'https://meet.google.com/demo-speaking-warmup',
      'Разогрев перед основной практикой: small talk, fluency drills, 5 минут на обратную связь.',
      'scheduled',
      v_teacher_profile_id,
      v_teacher_profile_id
    ),
    (
      v_student_id,
      v_teacher_id,
      'Grammar review session',
      now() + interval '3 days' + interval '13 hours',
      now() + interval '3 days' + interval '13 hours 50 minutes',
      'https://meet.google.com/demo-grammar-review',
      'Повторить present perfect vs past simple. Подготовить 6 собственных примеров.',
      'scheduled',
      v_teacher_profile_id,
      v_teacher_profile_id
    ),
    (
      v_student_id,
      v_teacher_id,
      'Interview simulation',
      now() + interval '6 days' + interval '18 hours',
      now() + interval '6 days' + interval '19 hours',
      'https://meet.google.com/demo-interview-sim',
      'Имитация HR-screening на английском. В конце дать письменный summary по ошибкам.',
      'scheduled',
      v_teacher_profile_id,
      v_teacher_profile_id
    ),
    (
      v_student_id,
      v_teacher_id,
      'Past lesson example',
      now() - interval '5 days' + interval '12 hours',
      now() - interval '5 days' + interval '12 hours 45 minutes',
      'https://meet.google.com/demo-past-lesson',
      'Историческая запись для проверки, что ученик видит только будущие scheduled-уроки.',
      'completed',
      v_teacher_profile_id,
      v_teacher_profile_id
    ),
    (
      v_student_id,
      v_teacher_id,
      'Canceled lesson example',
      now() + interval '2 days' + interval '16 hours',
      now() + interval '2 days' + interval '16 hours 45 minutes',
      'https://meet.google.com/demo-canceled-lesson',
      'Проверка UI-состояния отменённого урока в staff agenda.',
      'canceled',
      v_teacher_profile_id,
      v_teacher_profile_id
    )
  on conflict do nothing;
end $$;

commit;
