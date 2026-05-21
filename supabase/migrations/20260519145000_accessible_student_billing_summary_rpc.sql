begin;

create or replace function public.get_accessible_student_billing_summary(
  p_student_id uuid,
  p_recent_entries_limit integer default 8
)
returns table (
  account jsonb,
  remaining_lesson_units integer,
  remaining_money_amount numeric(12,2),
  effective_lesson_price_amount numeric(12,2),
  effective_lesson_price_currency text,
  recent_entries jsonb
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with authorized as (
    select p_student_id as student_id
    where app_private.can_view_payment(p_student_id)
  ),
  normalized_limit as (
    select least(greatest(coalesce(p_recent_entries_limit, 8), 0), 50) as value
  ),
  ledger as (
    select
      l.id,
      l.student_id,
      l.entry_direction,
      l.unit_type,
      l.lesson_units,
      l.money_amount,
      l.reason,
      l.payment_transaction_id,
      l.schedule_lesson_id,
      l.payment_plan_id,
      l.effective_lesson_price_amount,
      l.effective_lesson_price_currency,
      l.description,
      l.created_at
    from public.student_billing_ledger l
    join authorized a
      on a.student_id = l.student_id
  ),
  balances as (
    select
      coalesce(
        sum(
          case
            when unit_type = 'lesson' and entry_direction = 'credit' then coalesce(lesson_units, 0)
            when unit_type = 'lesson' and entry_direction = 'debit' then -coalesce(lesson_units, 0)
            else 0
          end
        ),
        0
      )::integer as remaining_lesson_units,
      coalesce(
        sum(
          case
            when unit_type = 'money' and entry_direction = 'credit' then coalesce(money_amount, 0)
            when unit_type = 'money' and entry_direction = 'debit' then -coalesce(money_amount, 0)
            else 0
          end
        ),
        0
      )::numeric(12,2) as remaining_money_amount
    from ledger
  ),
  latest_price as (
    select
      effective_lesson_price_amount,
      effective_lesson_price_currency
    from ledger
    where effective_lesson_price_amount is not null
      and effective_lesson_price_amount > 0
    order by created_at desc
    limit 1
  ),
  billing_account as (
    select to_jsonb(a.*) as account
    from public.student_billing_accounts a
    join authorized au
      on au.student_id = a.student_id
    limit 1
  ),
  recent as (
    select coalesce(jsonb_agg(to_jsonb(r.*) order by r.created_at desc), '[]'::jsonb) as entries
    from (
      select *
      from ledger
      order by created_at desc
      limit (select value from normalized_limit)
    ) r
  )
  select
    billing_account.account,
    balances.remaining_lesson_units,
    balances.remaining_money_amount,
    latest_price.effective_lesson_price_amount,
    latest_price.effective_lesson_price_currency,
    recent.entries as recent_entries
  from authorized
  cross join balances
  cross join recent
  left join billing_account on true
  left join latest_price on true;
$$;

revoke all on function public.get_accessible_student_billing_summary(uuid, integer) from public;
revoke all on function public.get_accessible_student_billing_summary(uuid, integer) from anon;
grant execute on function public.get_accessible_student_billing_summary(uuid, integer) to authenticated;

commit;
