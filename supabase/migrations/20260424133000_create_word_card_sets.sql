create table if not exists public.word_card_sets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  topic_slug text not null,
  topic_title text not null,
  cefr_level text not null check (cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1')),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.word_card_items (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.word_card_sets(id) on delete cascade,
  term text not null,
  translation text not null,
  example_sentence text not null,
  example_translation text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists word_card_sets_published_topic_level_idx
  on public.word_card_sets (is_published, topic_slug, cefr_level, sort_order, created_at desc);

create index if not exists word_card_items_set_order_idx
  on public.word_card_items (set_id, sort_order);

drop trigger if exists trg_word_card_sets_updated_at on public.word_card_sets;
create trigger trg_word_card_sets_updated_at
before update on public.word_card_sets
for each row execute function public.touch_student_cabinet_updated_at();

drop trigger if exists trg_word_card_items_updated_at on public.word_card_items;
create trigger trg_word_card_items_updated_at
before update on public.word_card_items
for each row execute function public.touch_student_cabinet_updated_at();

alter table public.word_card_sets enable row level security;
alter table public.word_card_items enable row level security;

drop policy if exists word_card_sets_select_published on public.word_card_sets;
create policy word_card_sets_select_published
on public.word_card_sets
for select
to authenticated
using (is_published = true);

drop policy if exists word_card_items_select_published_set on public.word_card_items;
create policy word_card_items_select_published_set
on public.word_card_items
for select
to authenticated
using (
  exists (
    select 1
    from public.word_card_sets s
    where s.id = word_card_items.set_id
      and s.is_published = true
  )
);
