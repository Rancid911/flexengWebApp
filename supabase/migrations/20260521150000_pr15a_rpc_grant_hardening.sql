begin;

create or replace function public.search_documents_query_for_actor(
  p_query text,
  p_limit integer default 25,
  p_section text default 'all',
  p_is_authenticated boolean default false,
  p_role text default null,
  p_capabilities text[] default array[]::text[],
  p_student_id uuid default null,
  p_teacher_id uuid default null,
  p_accessible_student_ids uuid[] default array[]::uuid[]
)
returns table (
  id uuid,
  entity_type text,
  entity_id uuid,
  title text,
  subtitle text,
  body text,
  href text,
  section text,
  icon text,
  badge text,
  role_scope text[],
  visibility text,
  owner_student_id uuid,
  course_id uuid,
  is_published boolean,
  meta jsonb,
  updated_at timestamptz,
  rank double precision
)
language plpgsql
stable
security definer
set search_path = public, app_private, pg_temp
as $$
declare
  v_query text := btrim(coalesce(p_query, ''));
  v_limit integer := greatest(1, least(coalesce(p_limit, 25), 100));
  v_tsq tsquery;
  v_actor_id uuid := auth.uid();
  v_student_id uuid;
  v_teacher_id uuid;
  v_accessible_student_ids uuid[] := array[]::uuid[];
  v_actor_roles text[] := array[]::text[];
  v_actor_scopes text[] := array[]::text[];
  v_staff_search_expansion boolean := false;
begin
  -- Compatibility parameters p_is_authenticated, p_role, p_capabilities,
  -- p_student_id, p_teacher_id and p_accessible_student_ids are intentionally
  -- ignored for privileged visibility. Direct callers cannot self-assert actor
  -- roles, capabilities or linked identities.
  perform p_is_authenticated, p_role, p_capabilities, p_student_id, p_teacher_id, p_accessible_student_ids;

  if char_length(v_query) < 2 then
    return;
  end if;

  if v_actor_id is not null then
    select s.id
    into v_student_id
    from public.students s
    where s.profile_id = v_actor_id
    limit 1;

    select t.id
    into v_teacher_id
    from public.teachers t
    where t.profile_id = v_actor_id
    limit 1;

    if v_teacher_id is not null then
      select coalesce(array_agg(distinct s.id) filter (where s.id is not null), array[]::uuid[])
      into v_accessible_student_ids
      from public.students s
      where s.primary_teacher_id = v_teacher_id;
    end if;

    select coalesce(array_agg(distinct r.key order by r.key), array[]::text[])
    into v_actor_roles
    from public.user_roles ur
    join public.roles r
      on r.id = ur.role_id
    where ur.user_id = v_actor_id;

    v_staff_search_expansion :=
      app_private.has_permission('students.view', 'all')
      or app_private.has_permission('students.manage', 'all')
      or app_private.has_permission('student_progress.view', 'all')
      or app_private.has_permission('content.manage', 'all')
      or app_private.has_permission('crm.leads.view', 'all')
      or app_private.has_permission('crm.leads.manage', 'all')
      or app_private.has_permission('users.view', 'all')
      or app_private.has_permission('users.manage', 'all')
      or app_private.has_permission('teachers.view', 'all')
      or app_private.has_permission('teachers.manage', 'all')
      or app_private.has_permission('payments.view', 'all')
      or app_private.has_permission('payments.manage', 'all')
      or app_private.has_permission('notifications.manage', 'all')
      or app_private.has_permission('word_cards.manage', 'all');
  end if;

  v_actor_scopes := v_actor_roles;
  if v_student_id is not null and not ('student' = any(v_actor_scopes)) then
    v_actor_scopes := array_append(v_actor_scopes, 'student');
  end if;
  if v_teacher_id is not null and not ('teacher' = any(v_actor_scopes)) then
    v_actor_scopes := array_append(v_actor_scopes, 'teacher');
  end if;
  if v_staff_search_expansion and not ('staff_admin' = any(v_actor_scopes)) then
    v_actor_scopes := array_append(v_actor_scopes, 'staff_admin');
  end if;

  begin
    v_tsq := websearch_to_tsquery('simple', v_query);
  exception
    when others then
      v_tsq := plainto_tsquery('simple', v_query);
  end;

  return query
  select
    sd.id,
    sd.entity_type,
    sd.entity_id,
    sd.title,
    sd.subtitle,
    sd.body,
    sd.href,
    sd.section,
    sd.icon,
    sd.badge,
    sd.role_scope,
    sd.visibility,
    sd.owner_student_id,
    sd.course_id,
    sd.is_published,
    sd.meta,
    sd.updated_at,
    (
      case when lower(sd.title) = lower(v_query) then 100 else 0 end +
      case when lower(sd.title) like lower(v_query) || '%' then 25 else 0 end +
      case
        when sd.section = 'homework' then 14
        when sd.section = 'practice' then 12
        when sd.section = 'words' then 10
        when sd.section = 'admin' then 8
        when sd.section = 'blog' then 6
        else 0
      end +
      case
        when sd.search_vector @@ v_tsq then ts_rank_cd(sd.search_vector, v_tsq) * 10
        else 0
      end +
      case when sd.updated_at >= now() - interval '14 days' then 1 else 0 end
    )::double precision as rank
  from public.search_documents sd
  where (p_section = 'all' or sd.section = p_section)
    and (
      sd.search_vector @@ v_tsq
      or sd.title ilike '%' || v_query || '%'
      or coalesce(sd.subtitle, '') ilike '%' || v_query || '%'
      or coalesce(sd.body, '') ilike '%' || v_query || '%'
    )
    and (
      (sd.visibility = 'public' and sd.is_published = true)
      or (
        sd.visibility = 'role'
        and v_actor_id is not null
        and (
          'all' = any(coalesce(sd.role_scope, array[]::text[]))
          or coalesce(sd.role_scope, array[]::text[]) && v_actor_scopes
          or v_staff_search_expansion
        )
      )
      or (
        sd.visibility = 'student_owned'
        and (
          v_staff_search_expansion
          or (v_student_id is not null and sd.owner_student_id = v_student_id)
          or (v_teacher_id is not null and sd.owner_student_id = any(v_accessible_student_ids))
        )
      )
      or (
        sd.visibility = 'enrollment'
        and sd.is_published = true
        and v_actor_id is not null
        and (
          v_staff_search_expansion
          or v_student_id is not null
          or v_teacher_id is not null
          or 'all' = any(coalesce(sd.role_scope, array[]::text[]))
          or coalesce(sd.role_scope, array[]::text[]) && v_actor_scopes
        )
      )
    )
  order by rank desc, sd.updated_at desc
  limit v_limit;
end;
$$;

comment on function public.search_documents_query_for_actor(text, integer, text, boolean, text, text[], uuid, uuid, uuid[])
  is 'Actor-scoped search RPC. Privileged visibility is derived from auth.uid() and DB RBAC/linked identities; caller-supplied role/capability parameters are compatibility-only.';

create or replace function public.admin_dashboard_metrics(period_anchor timestamptz default now())
returns table (
  revenue_month numeric(14,2),
  new_payments_7d bigint,
  active_students_7d bigint,
  active_teachers_7d bigint,
  avg_check_month numeric(14,2),
  currency text
)
language plpgsql
stable
security definer
set search_path = public, app_private, pg_temp
as $$
begin
  -- admin.dashboard.read is still an application runtime key. Until it becomes
  -- DB-backed, the dashboard aggregate RPC is gated by roles.view:all, which is
  -- seeded as admin-only and prevents direct manager/student/teacher execution.
  if not app_private.has_permission('roles.view', 'all') then
    raise exception 'admin_dashboard_metrics requires roles.view:all'
      using errcode = '42501';
  end if;

  return query
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
end;
$$;

comment on function public.admin_dashboard_metrics(timestamptz)
  is 'Admin dashboard aggregate RPC. API guards are defense in depth; direct DB execution requires DB-backed roles.view:all until admin.dashboard.read is seeded.';

revoke all on function public.search_documents_query_for_actor(text, integer, text, boolean, text, text[], uuid, uuid, uuid[]) from public;
revoke all on function public.search_documents_query_for_actor(text, integer, text, boolean, text, text[], uuid, uuid, uuid[]) from anon;
grant execute on function public.search_documents_query_for_actor(text, integer, text, boolean, text, text[], uuid, uuid, uuid[]) to authenticated;

revoke all on function public.admin_dashboard_metrics(timestamptz) from public;
revoke all on function public.admin_dashboard_metrics(timestamptz) from anon;
grant execute on function public.admin_dashboard_metrics(timestamptz) to authenticated;

commit;
