alter table if exists public.tests
  add column if not exists activity_type text not null default 'test'
    check (activity_type in ('trainer', 'test'));

alter table if exists public.tests
  add column if not exists estimated_duration_minutes integer;

alter table if exists public.payment_transactions
  add column if not exists description text;

create index if not exists tests_activity_type_published_idx
  on public.tests (activity_type, is_published, created_at desc);
