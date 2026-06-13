begin;

create or replace function public.create_current_student_payment_transaction(
  p_transaction_id uuid,
  p_plan_id uuid,
  p_return_url text,
  p_idempotence_key text
)
returns table (
  transaction_id uuid,
  amount numeric,
  currency text,
  title text,
  description text,
  receipt_label text,
  student_id uuid,
  user_id uuid,
  customer_email text,
  plan_id uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_student record;
  v_plan record;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select
    s.id as student_id,
    p.id as profile_id,
    p.email
  into v_student
  from public.students s
  join public.profiles p on p.id = s.profile_id
  where s.profile_id = v_user_id
  limit 1;

  if v_student.student_id is null then
    raise exception 'Current student profile not found';
  end if;

  select
    pp.id,
    pp.title,
    pp.description,
    pp.amount,
    pp.currency,
    pp.yookassa_product_label,
    pp.is_active
  into v_plan
  from public.payment_plans pp
  where pp.id = p_plan_id
    and pp.is_active = true
  limit 1;

  if v_plan.id is null then
    raise exception 'Payment plan not found';
  end if;

  insert into public.payment_transactions (
    id,
    student_id,
    amount,
    currency,
    status,
    description,
    provider,
    plan_id,
    return_url,
    idempotence_key,
    raw_status,
    metadata
  )
  values (
    p_transaction_id,
    v_student.student_id,
    coalesce(v_plan.amount, 0),
    coalesce(v_plan.currency, 'RUB'),
    'pending',
    coalesce(v_plan.description, v_plan.title),
    'yookassa',
    v_plan.id,
    p_return_url,
    p_idempotence_key,
    'pending',
    jsonb_build_object(
      'user_id', v_user_id,
      'student_id', v_student.student_id,
      'plan_id', v_plan.id
    )
  );

  return query
  select
    p_transaction_id,
    coalesce(v_plan.amount, 0)::numeric,
    coalesce(v_plan.currency, 'RUB')::text,
    v_plan.title::text,
    v_plan.description::text,
    coalesce(v_plan.yookassa_product_label, v_plan.title)::text,
    v_student.student_id::uuid,
    v_user_id,
    coalesce(v_student.email, '')::text,
    v_plan.id::uuid;
end;
$$;

create or replace function public.load_current_student_payment_transaction_status(
  p_transaction_id uuid
)
returns table (
  id uuid,
  student_id uuid,
  status text,
  provider_payment_id text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    pt.id,
    pt.student_id,
    pt.status,
    pt.provider_payment_id,
    pt.created_at
  from public.payment_transactions pt
  join public.students s on s.id = pt.student_id
  where pt.id = p_transaction_id
    and s.profile_id = auth.uid()
  limit 1;
$$;

create or replace function public.update_current_student_payment_transaction_provider_state(
  p_transaction_id uuid,
  p_provider_payment_id text,
  p_provider_payload jsonb,
  p_status text,
  p_raw_status text,
  p_paid_at timestamptz default null,
  p_confirmation_url text default null,
  p_payment_method_id text default null,
  p_is_reusable_payment_method boolean default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_updated integer;
begin
  update public.payment_transactions pt
  set
    provider_payment_id = coalesce(p_provider_payment_id, pt.provider_payment_id),
    provider_payload = p_provider_payload,
    status = p_status,
    raw_status = p_raw_status,
    paid_at = p_paid_at,
    confirmation_url = p_confirmation_url,
    payment_method_id = p_payment_method_id,
    is_reusable_payment_method = p_is_reusable_payment_method,
    updated_at = now()
  from public.students s
  where pt.id = p_transaction_id
    and s.id = pt.student_id
    and s.profile_id = auth.uid();

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Payment transaction not found';
  end if;
end;
$$;

revoke all on function public.create_current_student_payment_transaction(uuid, uuid, text, text) from public;
revoke all on function public.create_current_student_payment_transaction(uuid, uuid, text, text) from anon;
grant execute on function public.create_current_student_payment_transaction(uuid, uuid, text, text) to authenticated;

revoke all on function public.load_current_student_payment_transaction_status(uuid) from public;
revoke all on function public.load_current_student_payment_transaction_status(uuid) from anon;
grant execute on function public.load_current_student_payment_transaction_status(uuid) to authenticated;

revoke all on function public.update_current_student_payment_transaction_provider_state(uuid, text, jsonb, text, text, timestamptz, text, text, boolean) from public;
revoke all on function public.update_current_student_payment_transaction_provider_state(uuid, text, jsonb, text, text, timestamptz, text, text, boolean) from anon;
grant execute on function public.update_current_student_payment_transaction_provider_state(uuid, text, jsonb, text, text, timestamptz, text, text, boolean) to authenticated;

commit;
