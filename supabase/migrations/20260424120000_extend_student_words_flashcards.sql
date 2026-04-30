alter table public.student_words
  add column if not exists topic_slug text,
  add column if not exists topic_title text,
  add column if not exists example_sentence text,
  add column if not exists example_translation text,
  add column if not exists catalog_slug text,
  add column if not exists known_streak integer not null default 0,
  add column if not exists hard_count integer not null default 0,
  add column if not exists unknown_count integer not null default 0,
  add column if not exists difficult_marked_at timestamptz;

alter table public.student_words
  drop constraint if exists student_words_status_check;

alter table public.student_words
  add constraint student_words_status_check
  check (status in ('new', 'learning', 'review', 'difficult', 'mastered'));

create unique index if not exists student_words_student_catalog_slug_idx
  on public.student_words (student_id, catalog_slug)
  where catalog_slug is not null;

create index if not exists student_words_student_topic_status_idx
  on public.student_words (student_id, topic_slug, status, next_review_at);
