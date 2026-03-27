begin;

create table if not exists public.payment_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'RUB',
  badge text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  yookassa_product_label text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_plans_active_sort_idx
  on public.payment_plans (is_active, sort_order asc, created_at desc);

alter table if exists public.payment_transactions
  add column if not exists provider text not null default 'manual',
  add column if not exists provider_payment_id text,
  add column if not exists plan_id uuid references public.payment_plans(id) on delete set null,
  add column if not exists confirmation_url text,
  add column if not exists return_url text,
  add column if not exists payment_method_id text,
  add column if not exists is_reusable_payment_method boolean,
  add column if not exists raw_status text,
  add column if not exists provider_payload jsonb not null default '{}'::jsonb,
  add column if not exists idempotence_key text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists payment_transactions_provider_payment_id_uidx
  on public.payment_transactions (provider, provider_payment_id)
  where provider_payment_id is not null;

create unique index if not exists payment_transactions_idempotence_key_uidx
  on public.payment_transactions (idempotence_key)
  where idempotence_key is not null;

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create or replace function public.touch_payment_entities_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_payment_plans_updated_at on public.payment_plans;
create trigger trg_payment_plans_updated_at
before update on public.payment_plans
for each row execute function public.touch_payment_entities_updated_at();

drop trigger if exists trg_payment_transactions_updated_at on public.payment_transactions;
create trigger trg_payment_transactions_updated_at
before update on public.payment_transactions
for each row execute function public.touch_payment_entities_updated_at();

alter table public.payment_plans enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_webhook_events enable row level security;

drop policy if exists payment_plans_select_active on public.payment_plans;
create policy payment_plans_select_active
on public.payment_plans
for select
to authenticated
using (is_active = true);

drop policy if exists payment_transactions_select_own on public.payment_transactions;
create policy payment_transactions_select_own
on public.payment_transactions
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = payment_transactions.student_id
      and s.profile_id = auth.uid()
  )
);

commit;
