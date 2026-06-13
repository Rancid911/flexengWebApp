begin;

alter table if exists public.search_documents enable row level security;

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
set search_path = public
as $$
declare
  v_query text := btrim(coalesce(p_query, ''));
  v_limit integer := greatest(1, least(coalesce(p_limit, 25), 100));
  v_tsq tsquery;
  v_capabilities text[] := coalesce(p_capabilities, array[]::text[]);
  v_accessible_student_ids uuid[] := coalesce(p_accessible_student_ids, array[]::uuid[]);
begin
  if char_length(v_query) < 2 then
    return;
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
        and coalesce(p_is_authenticated, false) = true
        and (
          'staff_admin' = any(v_capabilities)
          or 'all' = any(coalesce(sd.role_scope, array[]::text[]))
          or coalesce(p_role, '') = any(coalesce(sd.role_scope, array[]::text[]))
          or exists (
            select 1
            from unnest(v_capabilities) as capability(key)
            where capability.key = any(coalesce(sd.role_scope, array[]::text[]))
          )
        )
      )
      or (
        sd.visibility = 'student_owned'
        and (
          'staff_admin' = any(v_capabilities)
          or (p_student_id is not null and sd.owner_student_id = p_student_id)
          or (
            'teacher' = any(v_capabilities)
            and sd.owner_student_id = any(v_accessible_student_ids)
          )
        )
      )
      or (
        sd.visibility = 'enrollment'
        and sd.is_published = true
        and coalesce(p_is_authenticated, false) = true
        and (
          'staff_admin' = any(v_capabilities)
          or 'student' = any(v_capabilities)
          or 'teacher' = any(v_capabilities)
          or 'all' = any(coalesce(sd.role_scope, array[]::text[]))
          or coalesce(p_role, '') = any(coalesce(sd.role_scope, array[]::text[]))
        )
      )
    )
  order by rank desc, sd.updated_at desc
  limit v_limit;
end;
$$;

comment on function public.search_documents_query(text, integer, text)
  is 'Legacy unscoped search RPC kept for compatibility; prefer search_documents_query_for_actor.';

comment on function public.search_documents_query_for_actor(text, integer, text, boolean, text, text[], uuid, uuid, uuid[])
  is 'Actor-scoped search RPC for server-mediated search.';

revoke all on function public.search_documents_query_for_actor(text, integer, text, boolean, text, text[], uuid, uuid, uuid[]) from public;
revoke all on function public.search_documents_query_for_actor(text, integer, text, boolean, text, text[], uuid, uuid, uuid[]) from anon;
revoke all on function public.search_documents_query_for_actor(text, integer, text, boolean, text, text[], uuid, uuid, uuid[]) from authenticated;

grant execute on function public.search_documents_query_for_actor(text, integer, text, boolean, text, text[], uuid, uuid, uuid[]) to service_role;

commit;
