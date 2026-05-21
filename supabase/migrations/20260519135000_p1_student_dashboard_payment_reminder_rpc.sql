begin;

create or replace function public.get_student_dashboard_payment_reminder_inputs(
  p_student_id uuid
)
returns table (
  settings_enabled boolean,
  threshold_lessons integer,
  billing_account jsonb,
  billing_ledger jsonb,
  next_scheduled_lesson_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if p_student_id is null then
    return;
  end if;

  if not (
    app_private.is_own_student(p_student_id)
    or app_private.can_view_payment(p_student_id)
  ) then
    return;
  end if;

  return query
  with reminder_settings as (
    select
      s.enabled,
      s.threshold_lessons
    from public.admin_payment_reminder_settings s
    where s.id = true
    limit 1
  ),
  account_data as (
    select jsonb_build_object(
      'id', a.id,
      'student_id', a.student_id,
      'billing_mode', a.billing_mode,
      'lesson_price_amount', a.lesson_price_amount,
      'currency', a.currency,
      'created_at', a.created_at,
      'updated_at', a.updated_at
    ) as data
    from public.student_billing_accounts a
    where a.student_id = p_student_id
    limit 1
  ),
  ledger_data as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'student_id', l.student_id,
          'entry_direction', l.entry_direction,
          'unit_type', l.unit_type,
          'lesson_units', l.lesson_units,
          'money_amount', l.money_amount,
          'reason', l.reason,
          'payment_transaction_id', l.payment_transaction_id,
          'schedule_lesson_id', l.schedule_lesson_id,
          'payment_plan_id', l.payment_plan_id,
          'effective_lesson_price_amount', l.effective_lesson_price_amount,
          'effective_lesson_price_currency', l.effective_lesson_price_currency,
          'description', l.description,
          'created_at', l.created_at
        )
        order by l.created_at desc
      ),
      '[]'::jsonb
    ) as data
    from public.student_billing_ledger l
    where l.student_id = p_student_id
  ),
  next_lesson as (
    select sl.starts_at
    from public.student_schedule_lessons sl
    where sl.student_id = p_student_id
      and sl.status = 'scheduled'
      and sl.starts_at >= now()
      and sl.starts_at <= now() + interval '7 days'
    order by sl.starts_at asc
    limit 1
  )
  select
    coalesce((select rs.enabled from reminder_settings rs), true) as settings_enabled,
    coalesce((select rs.threshold_lessons from reminder_settings rs), 1) as threshold_lessons,
    (select ad.data from account_data ad) as billing_account,
    (select ld.data from ledger_data ld) as billing_ledger,
    (select nl.starts_at from next_lesson nl) as next_scheduled_lesson_at;
end;
$$;

revoke all on function public.get_student_dashboard_payment_reminder_inputs(uuid) from public;
revoke all on function public.get_student_dashboard_payment_reminder_inputs(uuid) from anon;
grant execute on function public.get_student_dashboard_payment_reminder_inputs(uuid) to authenticated;

comment on function public.get_student_dashboard_payment_reminder_inputs(uuid)
  is 'Returns minimal, actor-scoped inputs for the student dashboard payment reminder popup.';

commit;
