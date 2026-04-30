alter table public.crm_leads
  add column if not exists viewed_at timestamptz,
  add column if not exists viewed_by uuid references public.profiles(id) on delete set null;

create index if not exists crm_leads_unread_new_requests_idx
  on public.crm_leads (status, viewed_at, created_at desc)
  where viewed_at is null;
