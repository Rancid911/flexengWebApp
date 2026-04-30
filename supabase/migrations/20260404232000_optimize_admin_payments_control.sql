create extension if not exists pg_trgm;

create index if not exists profiles_student_search_trgm_idx
  on public.profiles
  using gin (
    lower(
      concat_ws(
        ' ',
        coalesce(first_name, ''),
        coalesce(last_name, ''),
        coalesce(email, ''),
        coalesce(phone, '')
      )
    ) gin_trgm_ops
  )
  where role = 'student';

create index if not exists student_billing_ledger_latest_price_idx
  on public.student_billing_ledger (student_id, created_at desc)
  where effective_lesson_price_amount is not null;

create or replace function public.admin_payment_control_summary_rows(
  p_threshold_lessons integer default 1,
  p_query text default '',
  p_filter text default 'all'
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
  sort_priority integer
)
language sql
stable
as $$
  with filtered_students as (
    select
      s.id as student_id,
      p.id as profile_id,
      p.first_name,
      p.last_name,
      p.email,
      p.phone
    from public.students s
    join public.profiles p on p.id = s.profile_id
    where p.role = 'student'
      and (
        nullif(trim(coalesce(p_query, '')), '') is null
        or lower(
          concat_ws(
            ' ',
            coalesce(p.first_name, ''),
            coalesce(p.last_name, ''),
            coalesce(p.email, ''),
            coalesce(p.phone, '')
          )
        ) like '%' || lower(trim(coalesce(p_query, ''))) || '%'
      )
  ),
  ledger_totals as (
    select
      l.student_id,
      coalesce(
        sum(
          case
            when l.unit_type = 'lesson' and l.entry_direction = 'credit' then coalesce(l.lesson_units, 0)
            when l.unit_type = 'lesson' and l.entry_direction = 'debit' then -coalesce(l.lesson_units, 0)
            else 0
          end
        ),
        0
      )::integer as remaining_lesson_units,
      coalesce(
        sum(
          case
            when l.unit_type = 'money' and l.entry_direction = 'credit' then coalesce(l.money_amount, 0)
            when l.unit_type = 'money' and l.entry_direction = 'debit' then -coalesce(l.money_amount, 0)
            else 0
          end
        ),
        0
      )::numeric(12,2) as remaining_money_amount
    from public.student_billing_ledger l
    join filtered_students fs on fs.student_id = l.student_id
    group by l.student_id
  ),
  latest_price as (
    select distinct on (l.student_id)
      l.student_id,
      l.effective_lesson_price_amount::numeric(12,2) as effective_lesson_price_amount
    from public.student_billing_ledger l
    join filtered_students fs on fs.student_id = l.student_id
    where l.effective_lesson_price_amount is not null
      and l.effective_lesson_price_amount > 0
    order by l.student_id, l.created_at desc
  ),
  merged as (
    select
      fs.student_id,
      fs.profile_id,
      fs.first_name,
      fs.last_name,
      fs.email,
      fs.phone,
      sba.billing_mode,
      sba.currency as account_currency,
      sba.lesson_price_amount::numeric(12,2) as account_lesson_price_amount,
      coalesce(lt.remaining_lesson_units, 0) as remaining_lesson_units,
      coalesce(lt.remaining_money_amount, 0)::numeric(12,2) as remaining_money_amount,
      lp.effective_lesson_price_amount
    from filtered_students fs
    left join public.student_billing_accounts sba on sba.student_id = fs.student_id
    left join ledger_totals lt on lt.student_id = fs.student_id
    left join latest_price lp on lp.student_id = fs.student_id
  ),
  computed as (
    select
      merged.student_id,
      merged.profile_id,
      merged.first_name,
      merged.last_name,
      merged.email,
      merged.phone,
      merged.billing_mode,
      coalesce(merged.account_currency, 'RUB') as billing_currency,
      merged.account_lesson_price_amount as lesson_price_amount,
      merged.effective_lesson_price_amount,
      (merged.billing_mode is null) as billing_not_configured,
      (
        (merged.billing_mode = 'package_lessons' and merged.remaining_lesson_units < 0)
        or (merged.billing_mode = 'per_lesson_price' and merged.remaining_money_amount < 0)
      ) as billing_is_negative,
      case
        when merged.billing_mode = 'package_lessons'
          then greatest(merged.remaining_lesson_units, 0)
        when merged.billing_mode = 'per_lesson_price'
          and coalesce(merged.account_lesson_price_amount, merged.effective_lesson_price_amount, 0) > 0
          then floor(
            greatest(merged.remaining_money_amount, 0)
            / coalesce(merged.account_lesson_price_amount, merged.effective_lesson_price_amount)
          )::integer
        else 0
      end as available_lesson_count,
      case
        when merged.billing_mode = 'package_lessons' and merged.remaining_lesson_units < 0
          then abs(merged.remaining_lesson_units)
        when merged.billing_mode = 'per_lesson_price'
          and merged.remaining_money_amount < 0
          and coalesce(merged.account_lesson_price_amount, merged.effective_lesson_price_amount, 0) > 0
          then ceil(
            abs(merged.remaining_money_amount)
            / coalesce(merged.account_lesson_price_amount, merged.effective_lesson_price_amount)
          )::integer
        else 0
      end as debt_lesson_count,
      case
        when merged.remaining_money_amount < 0
          then abs(merged.remaining_money_amount)::numeric(12,2)
        else 0::numeric(12,2)
      end as debt_money_amount,
      case
        when merged.billing_mode = 'per_lesson_price'
          and coalesce(merged.account_lesson_price_amount, merged.effective_lesson_price_amount, 0) > 0
          then (
            greatest(merged.remaining_money_amount, 0)
            - floor(
              greatest(merged.remaining_money_amount, 0)
              / coalesce(merged.account_lesson_price_amount, merged.effective_lesson_price_amount)
            ) * coalesce(merged.account_lesson_price_amount, merged.effective_lesson_price_amount)
          )::numeric(12,2)
        else 0::numeric(12,2)
      end as money_remainder_amount
    from merged
  ),
  filtered as (
    select
      computed.*,
      (
        computed.billing_not_configured
        or computed.billing_is_negative
        or computed.available_lesson_count <= greatest(coalesce(p_threshold_lessons, 1), 0)
      ) as requires_attention,
      case
        when computed.billing_is_negative then 0
        when computed.billing_not_configured then 1
        when computed.available_lesson_count <= 1 then 2
        else 3
      end as sort_priority
    from computed
    where case coalesce(p_filter, 'all')
      when 'attention' then (
        computed.billing_not_configured
        or computed.billing_is_negative
        or computed.available_lesson_count <= greatest(coalesce(p_threshold_lessons, 1), 0)
      )
      when 'debt' then computed.billing_is_negative
      when 'one_lesson' then (
        not computed.billing_is_negative
        and not computed.billing_not_configured
        and computed.available_lesson_count <= 1
      )
      when 'unconfigured' then computed.billing_not_configured
      else true
    end
  )
  select
    filtered.student_id,
    filtered.profile_id,
    filtered.first_name,
    filtered.last_name,
    filtered.email,
    filtered.phone,
    filtered.billing_mode,
    filtered.available_lesson_count,
    filtered.debt_lesson_count,
    filtered.debt_money_amount,
    filtered.money_remainder_amount,
    filtered.lesson_price_amount,
    filtered.effective_lesson_price_amount,
    filtered.billing_currency,
    filtered.billing_not_configured,
    filtered.requires_attention,
    filtered.billing_is_negative,
    filtered.sort_priority
  from filtered;
$$;

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
as $$
  with rows as (
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
  from rows
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
as $$
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
  ) as rows;
$$;
