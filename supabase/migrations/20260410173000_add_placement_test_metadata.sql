alter table if exists public.tests
  add column if not exists assessment_kind text not null default 'regular',
  add column if not exists scoring_profile jsonb;

alter table if exists public.tests
  drop constraint if exists tests_assessment_kind_check;

alter table if exists public.tests
  add constraint tests_assessment_kind_check
  check (assessment_kind in ('regular', 'placement'));

alter table if exists public.test_questions
  add column if not exists placement_band text;

alter table if exists public.test_questions
  drop constraint if exists test_questions_placement_band_check;

alter table if exists public.test_questions
  add constraint test_questions_placement_band_check
  check (
    placement_band is null
    or placement_band in ('beginner', 'elementary', 'pre_intermediate', 'intermediate', 'upper_intermediate', 'advanced')
  );

alter table if exists public.student_test_attempts
  add column if not exists recommended_level text,
  add column if not exists recommended_band_label text,
  add column if not exists placement_summary jsonb;

create index if not exists tests_assessment_kind_published_idx
  on public.tests (assessment_kind, is_published, created_at desc);

create index if not exists test_questions_placement_band_idx
  on public.test_questions (placement_band)
  where placement_band is not null;
