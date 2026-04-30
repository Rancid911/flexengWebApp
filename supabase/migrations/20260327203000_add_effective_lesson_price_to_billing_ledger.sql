begin;

alter table if exists public.student_billing_ledger
  add column if not exists effective_lesson_price_amount numeric(12,2)
    check (effective_lesson_price_amount is null or effective_lesson_price_amount > 0);

alter table if exists public.student_billing_ledger
  add column if not exists effective_lesson_price_currency text;

update public.student_billing_ledger
set effective_lesson_price_currency = 'RUB'
where effective_lesson_price_amount is not null
  and effective_lesson_price_currency is null;

commit;
