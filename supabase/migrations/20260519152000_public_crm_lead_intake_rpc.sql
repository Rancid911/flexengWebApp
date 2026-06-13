create or replace function public.create_public_crm_lead(
  p_name text,
  p_phone text,
  p_email text,
  p_form_type text,
  p_comment text default null,
  p_source text default null,
  p_page_url text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table(id uuid, status text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_lead_id uuid;
  v_status text := 'new_request';
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
begin
  if nullif(btrim(coalesce(p_name, '')), '') is null then
    raise exception 'Lead name is required' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(p_phone, '')), '') is null then
    raise exception 'Lead phone is required' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(p_email, '')), '') is null then
    raise exception 'Lead email is required' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(p_form_type, '')), '') is null then
    raise exception 'Lead form_type is required' using errcode = '22023';
  end if;

  if jsonb_typeof(v_metadata) is distinct from 'object' then
    raise exception 'Lead metadata must be a JSON object' using errcode = '22023';
  end if;

  insert into public.crm_leads (
    name,
    phone,
    email,
    comment,
    source,
    form_type,
    page_url,
    metadata,
    status
  )
  values (
    btrim(p_name),
    btrim(p_phone),
    lower(btrim(p_email)),
    nullif(btrim(coalesce(p_comment, '')), ''),
    nullif(btrim(coalesce(p_source, '')), ''),
    btrim(p_form_type),
    nullif(btrim(coalesce(p_page_url, '')), ''),
    v_metadata,
    v_status
  )
  returning crm_leads.id into v_lead_id;

  insert into public.crm_lead_status_history (
    lead_id,
    from_status,
    to_status,
    changed_by
  )
  values (
    v_lead_id,
    null,
    v_status,
    null
  );

  return query select v_lead_id, v_status;
end;
$$;

comment on function public.create_public_crm_lead(text, text, text, text, text, text, text, jsonb)
  is 'Narrow public lead intake RPC. Inserts a CRM lead and initial status history row without exposing anon table policies.';

revoke all on function public.create_public_crm_lead(text, text, text, text, text, text, text, jsonb) from public;
revoke all on function public.create_public_crm_lead(text, text, text, text, text, text, text, jsonb) from anon;
revoke all on function public.create_public_crm_lead(text, text, text, text, text, text, text, jsonb) from authenticated;

grant execute on function public.create_public_crm_lead(text, text, text, text, text, text, text, jsonb) to anon;
grant execute on function public.create_public_crm_lead(text, text, text, text, text, text, text, jsonb) to authenticated;
