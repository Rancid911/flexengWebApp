alter table public.tests
  add column if not exists cefr_level text,
  add column if not exists drill_topic_key text,
  add column if not exists drill_kind text,
  add column if not exists lesson_reinforcement boolean not null default false,
  add column if not exists sort_order integer not null default 0;

alter table public.tests
  drop constraint if exists tests_cefr_level_check;

alter table public.tests
  add constraint tests_cefr_level_check
  check (cefr_level is null or cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1'));

alter table public.tests
  drop constraint if exists tests_drill_kind_check;

alter table public.tests
  add constraint tests_drill_kind_check
  check (drill_kind is null or drill_kind in ('grammar', 'vocabulary', 'mixed'));

create index if not exists tests_activity_level_published_idx
  on public.tests (activity_type, cefr_level, is_published, sort_order, created_at desc);

create index if not exists tests_drill_topic_key_idx
  on public.tests (drill_topic_key)
  where drill_topic_key is not null;
