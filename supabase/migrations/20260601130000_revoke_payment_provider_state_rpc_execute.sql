begin;

revoke all on function public.update_current_student_payment_transaction_provider_state(
  uuid,
  text,
  jsonb,
  text,
  text,
  timestamptz,
  text,
  text,
  boolean
) from public;

revoke all on function public.update_current_student_payment_transaction_provider_state(
  uuid,
  text,
  jsonb,
  text,
  text,
  timestamptz,
  text,
  text,
  boolean
) from anon;

revoke all on function public.update_current_student_payment_transaction_provider_state(
  uuid,
  text,
  jsonb,
  text,
  text,
  timestamptz,
  text,
  text,
  boolean
) from authenticated;

commit;
