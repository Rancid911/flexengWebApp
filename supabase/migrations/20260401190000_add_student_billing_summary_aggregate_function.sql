create or replace function public.get_student_billing_summary_aggregates(p_student_id uuid)
returns table (
  remaining_lesson_units integer,
  remaining_money_amount numeric(12,2),
  effective_lesson_price_amount numeric(12,2),
  effective_lesson_price_currency text
)
language sql
stable
as $$
  with ledger as (
    select
      entry_direction,
      unit_type,
      coalesce(lesson_units, 0) as lesson_units,
      coalesce(money_amount, 0)::numeric(12,2) as money_amount,
      effective_lesson_price_amount,
      effective_lesson_price_currency,
      created_at
    from public.student_billing_ledger
    where student_id = p_student_id
  ),
  balances as (
    select
      coalesce(
        sum(
          case
            when unit_type = 'lesson' and entry_direction = 'credit' then lesson_units
            when unit_type = 'lesson' and entry_direction = 'debit' then -lesson_units
            else 0
          end
        ),
        0
      )::integer as remaining_lesson_units,
      coalesce(
        sum(
          case
            when unit_type = 'money' and entry_direction = 'credit' then money_amount
            when unit_type = 'money' and entry_direction = 'debit' then -money_amount
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
  )
  select
    balances.remaining_lesson_units,
    balances.remaining_money_amount,
    latest_price.effective_lesson_price_amount,
    latest_price.effective_lesson_price_currency
  from balances
  left join latest_price on true;
$$;
