begin;

create or replace function public.admin_list_payment_control(
  p_threshold_lessons integer default 1,
  p_query text default '',
  p_filter text default 'all',
  p_page integer default 1,
  p_page_size integer default 20
)
returns table (
  student_id uuid,
  profile_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  billing_mode text,
  available_lesson_count integer,
  debt_lesson_count integer,
  debt_money_amount numeric(12,2),
  money_remainder_amount numeric(12,2),
  lesson_price_amount numeric(12,2),
  effective_lesson_price_amount numeric(12,2),
  billing_currency text,
  billing_not_configured boolean,
  requires_attention boolean,
  billing_is_negative boolean,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, app_private, pg_temp
as $$
  with authorized as (
    select
      app_private.has_permission('payments.view', 'all')
      or app_private.has_permission('payments.manage', 'all') as ok
  ),
  rows as (
    select *
    from public.admin_payment_control_summary_rows(
      greatest(coalesce(p_threshold_lessons, 1), 0),
      coalesce(p_query, ''),
      coalesce(p_filter, 'all')
    )
  )
  select
    rows.student_id,
    rows.profile_id,
    rows.first_name,
    rows.last_name,
    rows.email,
    rows.phone,
    rows.billing_mode,
    rows.available_lesson_count,
    rows.debt_lesson_count,
    rows.debt_money_amount,
    rows.money_remainder_amount,
    rows.lesson_price_amount,
    rows.effective_lesson_price_amount,
    rows.billing_currency,
    rows.billing_not_configured,
    rows.requires_attention,
    rows.billing_is_negative,
    count(*) over() as total_count
  from rows, authorized
  where authorized.ok
  order by
    rows.sort_priority asc,
    rows.available_lesson_count asc,
    lower(concat_ws(' ', coalesce(rows.first_name, ''), coalesce(rows.last_name, ''), coalesce(rows.email, ''))) asc
  offset greatest(coalesce(p_page, 1) - 1, 0) * greatest(coalesce(p_page_size, 20), 1)
  limit greatest(coalesce(p_page_size, 20), 1);
$$;

create or replace function public.admin_payment_control_stats(
  p_threshold_lessons integer default 1,
  p_query text default '',
  p_filter text default 'all'
)
returns table (
  total_students bigint,
  attention_students bigint,
  debt_students bigint,
  one_lesson_left_students bigint,
  unconfigured_students bigint
)
language sql
stable
security definer
set search_path = public, app_private, pg_temp
as $$
  with authorized as (
    select
      app_private.has_permission('payments.view', 'all')
      or app_private.has_permission('payments.manage', 'all') as ok
  )
  select
    count(*)::bigint as total_students,
    count(*) filter (where rows.requires_attention)::bigint as attention_students,
    count(*) filter (where rows.billing_is_negative)::bigint as debt_students,
    count(*) filter (
      where not rows.billing_is_negative
        and not rows.billing_not_configured
        and rows.available_lesson_count <= 1
    )::bigint as one_lesson_left_students,
    count(*) filter (where rows.billing_not_configured)::bigint as unconfigured_students
  from public.admin_payment_control_summary_rows(
    greatest(coalesce(p_threshold_lessons, 1), 0),
    coalesce(p_query, ''),
    coalesce(p_filter, 'all')
  ) as rows,
  authorized
  where authorized.ok;
$$;

revoke all on function public.admin_payment_control_summary_rows(integer, text, text) from public;
revoke all on function public.admin_payment_control_summary_rows(integer, text, text) from anon;
revoke all on function public.admin_payment_control_summary_rows(integer, text, text) from authenticated;

revoke all on function public.admin_list_payment_control(integer, text, text, integer, integer) from public;
revoke all on function public.admin_list_payment_control(integer, text, text, integer, integer) from anon;
grant execute on function public.admin_list_payment_control(integer, text, text, integer, integer) to authenticated;

revoke all on function public.admin_payment_control_stats(integer, text, text) from public;
revoke all on function public.admin_payment_control_stats(integer, text, text) from anon;
grant execute on function public.admin_payment_control_stats(integer, text, text) to authenticated;

commit;
