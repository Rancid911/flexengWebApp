begin;

alter table if exists public.tests
  add column if not exists activity_type text not null default 'test'
    check (activity_type in ('trainer', 'test'));

alter table if exists public.tests
  add column if not exists estimated_duration_minutes integer;

alter table if exists public.payment_transactions
  add column if not exists description text;

create index if not exists tests_activity_type_published_idx
  on public.tests (activity_type, is_published, created_at desc);

create table if not exists public.homework_assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  assigned_by_profile_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed', 'overdue')),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.homework_items (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.homework_assignments(id) on delete cascade,
  source_type text not null check (source_type in ('lesson', 'test')),
  source_id uuid not null,
  sort_order integer not null default 0,
  required boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.student_homework_progress (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.homework_assignments(id) on delete cascade,
  homework_item_id uuid not null references public.homework_items(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, homework_item_id)
);

create table if not exists public.student_favorites (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  entity_type text not null check (entity_type in ('course', 'module', 'test')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (student_id, entity_type, entity_id)
);

create table if not exists public.student_mistakes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  attempt_id uuid references public.student_test_attempts(id) on delete set null,
  test_id uuid references public.tests(id) on delete set null,
  question_id uuid not null references public.test_questions(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  module_id uuid references public.course_modules(id) on delete set null,
  mistake_count integer not null default 1 check (mistake_count >= 1),
  last_mistake_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, question_id)
);

create table if not exists public.student_words (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  term text not null,
  translation text not null,
  source_type text not null check (source_type in ('manual', 'mistake', 'homework', 'test')),
  source_entity_id uuid,
  status text not null default 'new' check (status in ('new', 'learning', 'review', 'mastered')),
  next_review_at timestamptz,
  last_reviewed_at timestamptz,
  ease_factor numeric not null default 2.5,
  interval_days integer not null default 0,
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_word_reviews (
  id uuid primary key default gen_random_uuid(),
  student_word_id uuid not null references public.student_words(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  result text not null check (result in ('again', 'hard', 'good', 'easy')),
  reviewed_at timestamptz not null default now()
);

create index if not exists homework_assignments_student_status_due_idx
  on public.homework_assignments (student_id, status, due_at desc);

create index if not exists student_homework_progress_student_assignment_idx
  on public.student_homework_progress (student_id, assignment_id, status);

create index if not exists student_favorites_student_type_idx
  on public.student_favorites (student_id, entity_type, created_at desc);

create index if not exists student_mistakes_student_last_idx
  on public.student_mistakes (student_id, last_mistake_at desc);

create index if not exists student_words_student_status_review_idx
  on public.student_words (student_id, status, next_review_at);

create index if not exists student_word_reviews_student_reviewed_idx
  on public.student_word_reviews (student_id, reviewed_at desc);

create or replace function public.touch_student_cabinet_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_homework_assignments_updated_at on public.homework_assignments;
create trigger trg_homework_assignments_updated_at
before update on public.homework_assignments
for each row execute function public.touch_student_cabinet_updated_at();

drop trigger if exists trg_student_homework_progress_updated_at on public.student_homework_progress;
create trigger trg_student_homework_progress_updated_at
before update on public.student_homework_progress
for each row execute function public.touch_student_cabinet_updated_at();

drop trigger if exists trg_student_mistakes_updated_at on public.student_mistakes;
create trigger trg_student_mistakes_updated_at
before update on public.student_mistakes
for each row execute function public.touch_student_cabinet_updated_at();

drop trigger if exists trg_student_words_updated_at on public.student_words;
create trigger trg_student_words_updated_at
before update on public.student_words
for each row execute function public.touch_student_cabinet_updated_at();

alter table public.homework_assignments enable row level security;
alter table public.homework_items enable row level security;
alter table public.student_homework_progress enable row level security;
alter table public.student_favorites enable row level security;
alter table public.student_mistakes enable row level security;
alter table public.student_words enable row level security;
alter table public.student_word_reviews enable row level security;

drop policy if exists homework_assignments_select_own on public.homework_assignments;
create policy homework_assignments_select_own
on public.homework_assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = homework_assignments.student_id
      and s.profile_id = auth.uid()
  )
);

drop policy if exists homework_items_select_via_own_assignment on public.homework_items;
create policy homework_items_select_via_own_assignment
on public.homework_items
for select
to authenticated
using (
  exists (
    select 1
    from public.homework_assignments ha
    join public.students s on s.id = ha.student_id
    where ha.id = homework_items.assignment_id
      and s.profile_id = auth.uid()
  )
);

drop policy if exists student_homework_progress_select_own on public.student_homework_progress;
create policy student_homework_progress_select_own
on public.student_homework_progress
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = student_homework_progress.student_id
      and s.profile_id = auth.uid()
  )
);

drop policy if exists student_favorites_rw_own on public.student_favorites;
create policy student_favorites_rw_own
on public.student_favorites
for all
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = student_favorites.student_id
      and s.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.students s
    where s.id = student_favorites.student_id
      and s.profile_id = auth.uid()
  )
);

drop policy if exists student_mistakes_select_own on public.student_mistakes;
create policy student_mistakes_select_own
on public.student_mistakes
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = student_mistakes.student_id
      and s.profile_id = auth.uid()
  )
);

drop policy if exists student_words_rw_own on public.student_words;
create policy student_words_rw_own
on public.student_words
for all
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = student_words.student_id
      and s.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.students s
    where s.id = student_words.student_id
      and s.profile_id = auth.uid()
  )
);

drop policy if exists student_word_reviews_rw_own on public.student_word_reviews;
create policy student_word_reviews_rw_own
on public.student_word_reviews
for all
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = student_word_reviews.student_id
      and s.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.students s
    where s.id = student_word_reviews.student_id
      and s.profile_id = auth.uid()
  )
);

commit;
