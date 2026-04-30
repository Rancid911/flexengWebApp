-- Расширение teacher_dossiers под досье учителя.
-- Можно запускать в Supabase SQL Editor повторно: колонки добавляются через IF NOT EXISTS,
-- constraints создаются только если их ещё нет.

create table if not exists public.teacher_dossiers (
  teacher_id uuid primary key references public.teachers(id) on delete cascade,
  patronymic text,
  internal_role text not null default 'teacher',
  timezone text not null default 'Europe/Moscow',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_profile_id uuid references public.profiles(id) on delete set null
);

alter table public.teacher_dossiers
  add column if not exists english_proficiency text,
  add column if not exists specializations text[] not null default array[]::text[],
  add column if not exists teaching_experience_years integer,
  add column if not exists education_level text,
  add column if not exists certificates text[] not null default array['none']::text[],
  add column if not exists target_audiences text[] not null default array[]::text[],
  add column if not exists certificate_other text,
  add column if not exists teacher_bio text,
  add column if not exists available_weekdays text[] not null default array[]::text[],
  add column if not exists time_slots text,
  add column if not exists max_lessons_per_day integer,
  add column if not exists max_lessons_per_week integer,
  add column if not exists lesson_types text[] not null default array[]::text[],
  add column if not exists lesson_durations text[] not null default array[]::text[],
  add column if not exists operational_status text not null default 'active',
  add column if not exists start_date date,
  add column if not exists cooperation_type text not null default 'freelance',
  add column if not exists lesson_rate_amount numeric(12, 2),
  add column if not exists currency text not null default 'RUB';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_internal_role_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_internal_role_check
      check (internal_role in ('teacher', 'senior_teacher', 'methodologist'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_timezone_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_timezone_check
      check (
        timezone in (
          'Europe/Moscow',
          'Europe/London',
          'Europe/Berlin',
          'Asia/Dubai',
          'Asia/Yerevan',
          'Asia/Tbilisi',
          'Asia/Almaty'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_english_proficiency_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_english_proficiency_check
      check (
        english_proficiency is null
        or english_proficiency in ('B2', 'C1', 'C2', 'native')
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_specializations_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_specializations_check
      check (
        specializations <@ array[
          'general_english',
          'business_english',
          'it_english',
          'exam_preparation',
          'speaking',
          'grammar'
        ]::text[]
        and cardinality(specializations) <= 6
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_teaching_experience_years_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_teaching_experience_years_check
      check (
        teaching_experience_years is null
        or teaching_experience_years between 0 and 60
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_education_level_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_education_level_check
      check (
        education_level is null
        or education_level in ('higher_linguistic', 'higher', 'secondary')
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_certificates_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_certificates_check
      check (
        cardinality(certificates) between 1 and 5
        and certificates <@ array['none', 'ielts', 'celta', 'tesol', 'other']::text[]
        and (
          not ('none' = any(certificates))
          or cardinality(certificates) = 1
        )
        and (
          ('other' = any(certificates) and nullif(btrim(coalesce(certificate_other, '')), '') is not null)
          or (not ('other' = any(certificates)) and nullif(btrim(coalesce(certificate_other, '')), '') is null)
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_target_audiences_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_target_audiences_check
      check (
        target_audiences <@ array[
          'adults',
          'children',
          'teenagers',
          'beginners',
          'intermediate',
          'advanced',
          'it_specialists',
          'entrepreneurs',
          'interview_preparation',
          'relocation'
        ]::text[]
        and cardinality(target_audiences) <= 15
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_teacher_bio_length_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_teacher_bio_length_check
      check (teacher_bio is null or length(teacher_bio) <= 5000);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_available_weekdays_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_available_weekdays_check
      check (
        available_weekdays <@ array[
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday'
        ]::text[]
        and cardinality(available_weekdays) <= 7
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_time_slots_length_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_time_slots_length_check
      check (time_slots is null or length(time_slots) <= 2000);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_max_lessons_per_day_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_max_lessons_per_day_check
      check (
        max_lessons_per_day is null
        or max_lessons_per_day between 0 and 20
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_max_lessons_per_week_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_max_lessons_per_week_check
      check (
        max_lessons_per_week is null
        or max_lessons_per_week between 0 and 80
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_lesson_types_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_lesson_types_check
      check (
        lesson_types <@ array['individual', 'group']::text[]
        and cardinality(lesson_types) <= 2
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_lesson_durations_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_lesson_durations_check
      check (
        lesson_durations <@ array['30', '60', '90']::text[]
        and cardinality(lesson_durations) <= 3
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_operational_status_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_operational_status_check
      check (operational_status in ('active', 'inactive', 'on_vacation'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_cooperation_type_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_cooperation_type_check
      check (cooperation_type in ('freelance', 'staff'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_lesson_rate_amount_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_lesson_rate_amount_check
      check (
        lesson_rate_amount is null
        or lesson_rate_amount >= 0
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_dossiers_currency_check'
      and conrelid = 'public.teacher_dossiers'::regclass
  ) then
    alter table public.teacher_dossiers
      add constraint teacher_dossiers_currency_check
      check (currency in ('RUB'));
  end if;
end $$;

drop trigger if exists trg_teacher_dossiers_updated_at on public.teacher_dossiers;

create trigger trg_teacher_dossiers_updated_at
before update on public.teacher_dossiers
for each row execute function public.touch_teacher_workspace_updated_at();
