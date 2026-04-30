begin;

alter table if exists public.payment_plans
  add column if not exists billing_credit_type text
    check (billing_credit_type in ('lesson', 'money'));

alter table if exists public.payment_plans
  add column if not exists credit_lesson_units integer
    check (credit_lesson_units is null or credit_lesson_units > 0);

alter table if exists public.payment_plans
  add column if not exists credit_money_amount numeric(12,2)
    check (credit_money_amount is null or credit_money_amount > 0);

alter table if exists public.payment_plans
  add constraint payment_plans_credit_payload_check
  check (
    billing_credit_type is null
    or (
      billing_credit_type = 'lesson'
      and credit_lesson_units is not null
      and credit_money_amount is null
    )
    or (
      billing_credit_type = 'money'
      and credit_money_amount is not null
      and credit_lesson_units is null
    )
  );

create table if not exists public.student_billing_accounts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students(id) on delete cascade,
  billing_mode text not null check (billing_mode in ('package_lessons', 'per_lesson_price')),
  lesson_price_amount numeric(12,2) check (lesson_price_amount is null or lesson_price_amount >= 0),
  currency text not null default 'RUB',
  updated_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_billing_accounts_lesson_price_check
    check (
      (billing_mode = 'package_lessons' and lesson_price_amount is null)
      or (billing_mode = 'per_lesson_price' and lesson_price_amount is not null)
    )
);

create table if not exists public.student_billing_ledger (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  entry_direction text not null check (entry_direction in ('credit', 'debit')),
  unit_type text not null check (unit_type in ('lesson', 'money')),
  lesson_units integer check (lesson_units is null or lesson_units > 0),
  money_amount numeric(12,2) check (money_amount is null or money_amount > 0),
  reason text not null check (reason in ('payment', 'lesson_charge', 'manual_adjustment', 'refund')),
  payment_transaction_id uuid references public.payment_transactions(id) on delete set null,
  schedule_lesson_id uuid references public.student_schedule_lessons(id) on delete set null,
  payment_plan_id uuid references public.payment_plans(id) on delete set null,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  description text,
  created_at timestamptz not null default now(),
  constraint student_billing_ledger_payload_check
    check (
      (unit_type = 'lesson' and lesson_units is not null and money_amount is null)
      or (unit_type = 'money' and money_amount is not null and lesson_units is null)
    )
);

create index if not exists student_billing_accounts_mode_idx
  on public.student_billing_accounts (billing_mode, student_id);

create index if not exists student_billing_ledger_student_created_idx
  on public.student_billing_ledger (student_id, created_at desc);

create index if not exists student_billing_ledger_reason_idx
  on public.student_billing_ledger (student_id, reason, created_at desc);

create unique index if not exists student_billing_ledger_payment_credit_uidx
  on public.student_billing_ledger (payment_transaction_id)
  where payment_transaction_id is not null and reason = 'payment';

create unique index if not exists student_billing_ledger_lesson_charge_uidx
  on public.student_billing_ledger (schedule_lesson_id)
  where schedule_lesson_id is not null and reason = 'lesson_charge';

create or replace function public.touch_student_billing_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_student_billing_accounts_updated_at on public.student_billing_accounts;
create trigger trg_student_billing_accounts_updated_at
before update on public.student_billing_accounts
for each row execute function public.touch_student_billing_updated_at();

alter table public.student_billing_accounts enable row level security;
alter table public.student_billing_ledger enable row level security;

drop policy if exists student_billing_accounts_select_own on public.student_billing_accounts;
create policy student_billing_accounts_select_own
on public.student_billing_accounts
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = student_billing_accounts.student_id
      and s.profile_id = auth.uid()
  )
);

drop policy if exists student_billing_ledger_select_own on public.student_billing_ledger;
create policy student_billing_ledger_select_own
on public.student_billing_ledger
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = student_billing_ledger.student_id
      and s.profile_id = auth.uid()
  )
);

drop policy if exists student_billing_accounts_teacher_scope_select on public.student_billing_accounts;
create policy student_billing_accounts_teacher_scope_select
on public.student_billing_accounts
for select
to authenticated
using (
  exists (
    select 1
    from public.teachers t
    join public.student_course_enrollments sce
      on sce.assigned_teacher_id = t.id
     and sce.student_id = student_billing_accounts.student_id
     and sce.status = 'active'
    where t.profile_id = auth.uid()
  )
);

drop policy if exists student_billing_ledger_teacher_scope_select on public.student_billing_ledger;
create policy student_billing_ledger_teacher_scope_select
on public.student_billing_ledger
for select
to authenticated
using (
  exists (
    select 1
    from public.teachers t
    join public.student_course_enrollments sce
      on sce.assigned_teacher_id = t.id
     and sce.student_id = student_billing_ledger.student_id
     and sce.status = 'active'
    where t.profile_id = auth.uid()
  )
);

drop policy if exists student_billing_accounts_manager_admin_rw on public.student_billing_accounts;
create policy student_billing_accounts_manager_admin_rw
on public.student_billing_accounts
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
);

drop policy if exists student_billing_ledger_manager_admin_rw on public.student_billing_ledger;
create policy student_billing_ledger_manager_admin_rw
on public.student_billing_ledger
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
);

commit;
