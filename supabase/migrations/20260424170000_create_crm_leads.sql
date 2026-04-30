create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  source text,
  form_type text not null,
  page_url text,
  comment text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'new_request' check (
    status in (
      'new_request',
      'not_reached',
      'contact_established',
      'not_fit',
      'consultation_scheduled',
      'consultation_no_show',
      'consultation_done',
      'thinking',
      'contract_sent',
      'contract_signed',
      'awaiting_payment'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_lead_status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  from_status text check (
    from_status is null or from_status in (
      'new_request',
      'not_reached',
      'contact_established',
      'not_fit',
      'consultation_scheduled',
      'consultation_no_show',
      'consultation_done',
      'thinking',
      'contract_sent',
      'contract_signed',
      'awaiting_payment'
    )
  ),
  to_status text not null check (
    to_status in (
      'new_request',
      'not_reached',
      'contact_established',
      'not_fit',
      'consultation_scheduled',
      'consultation_no_show',
      'consultation_done',
      'thinking',
      'contract_sent',
      'contract_signed',
      'awaiting_payment'
    )
  ),
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_lead_comments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  body text not null,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists crm_leads_status_created_at_idx
  on public.crm_leads (status, created_at desc);

create index if not exists crm_leads_created_at_idx
  on public.crm_leads (created_at desc);

create index if not exists crm_lead_status_history_lead_created_at_idx
  on public.crm_lead_status_history (lead_id, created_at desc);

create index if not exists crm_lead_comments_lead_created_at_idx
  on public.crm_lead_comments (lead_id, created_at desc);

drop trigger if exists trg_crm_leads_updated_at on public.crm_leads;
create trigger trg_crm_leads_updated_at
before update on public.crm_leads
for each row execute function public.touch_student_cabinet_updated_at();

alter table public.crm_leads enable row level security;
alter table public.crm_lead_status_history enable row level security;
alter table public.crm_lead_comments enable row level security;

drop policy if exists crm_leads_manager_admin_select on public.crm_leads;
create policy crm_leads_manager_admin_select
on public.crm_leads
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
);

drop policy if exists crm_leads_manager_admin_write on public.crm_leads;
create policy crm_leads_manager_admin_write
on public.crm_leads
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
);

drop policy if exists crm_lead_status_history_manager_admin_select on public.crm_lead_status_history;
create policy crm_lead_status_history_manager_admin_select
on public.crm_lead_status_history
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
);

drop policy if exists crm_lead_status_history_manager_admin_write on public.crm_lead_status_history;
create policy crm_lead_status_history_manager_admin_write
on public.crm_lead_status_history
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
);

drop policy if exists crm_lead_comments_manager_admin_select on public.crm_lead_comments;
create policy crm_lead_comments_manager_admin_select
on public.crm_lead_comments
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
);

drop policy if exists crm_lead_comments_manager_admin_write on public.crm_lead_comments;
create policy crm_lead_comments_manager_admin_write
on public.crm_lead_comments
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
);
