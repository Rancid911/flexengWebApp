create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete set null,
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'RUB',
  status text not null check (status in ('pending', 'succeeded', 'failed', 'refunded', 'canceled')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_transactions_status_paid_at_idx
  on public.payment_transactions (status, paid_at desc);

create index if not exists payment_transactions_student_paid_at_idx
  on public.payment_transactions (student_id, paid_at desc);

alter table public.payment_transactions enable row level security;

create or replace function public.admin_dashboard_metrics(period_anchor timestamptz default now())
returns table (
  revenue_month numeric(14,2),
  new_payments_7d bigint,
  active_students_7d bigint,
  active_teachers_7d bigint,
  avg_check_month numeric(14,2),
  currency text
)
language sql
stable
security definer
set search_path = public
as $$
with bounds as (
  select
    period_anchor as anchor_utc,
    (date_trunc('month', period_anchor at time zone 'Europe/Moscow') at time zone 'Europe/Moscow') as month_start_utc,
    ((date_trunc('month', period_anchor at time zone 'Europe/Moscow') + interval '1 month') at time zone 'Europe/Moscow') as month_end_utc,
    (period_anchor - interval '7 day') as last_7d_utc
),
month_payments as (
  select
    coalesce(sum(pt.amount), 0)::numeric(14,2) as revenue_month,
    count(*)::bigint as month_count,
    coalesce(max(pt.currency), 'RUB')::text as currency
  from public.payment_transactions pt
  cross join bounds b
  where pt.status = 'succeeded'
    and pt.paid_at is not null
    and pt.paid_at >= b.month_start_utc
    and pt.paid_at < b.month_end_utc
),
payments_7d as (
  select count(*)::bigint as new_payments_7d
  from public.payment_transactions pt
  cross join bounds b
  where pt.status = 'succeeded'
    and pt.paid_at is not null
    and pt.paid_at >= b.last_7d_utc
    and pt.paid_at <= b.anchor_utc
),
students_7d as (
  select count(distinct sta.student_id)::bigint as active_students_7d
  from public.student_test_attempts sta
  cross join bounds b
  where sta.started_at >= b.last_7d_utc
    and sta.started_at <= b.anchor_utc
),
teachers_active as (
  select count(distinct sce.assigned_teacher_id)::bigint as active_teachers_7d
  from public.student_course_enrollments sce
  where sce.status = 'active'
    and sce.assigned_teacher_id is not null
)
select
  mp.revenue_month,
  p7.new_payments_7d,
  s7.active_students_7d,
  ta.active_teachers_7d,
  case
    when mp.month_count = 0 then 0::numeric(14,2)
    else round((mp.revenue_month / mp.month_count)::numeric, 2)::numeric(14,2)
  end as avg_check_month,
  mp.currency
from month_payments mp
cross join payments_7d p7
cross join students_7d s7
cross join teachers_active ta;
$$;
