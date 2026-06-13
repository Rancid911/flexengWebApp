begin;

alter table public.crm_leads enable row level security;
alter table public.crm_lead_comments enable row level security;
alter table public.crm_lead_status_history enable row level security;
alter table public.crm_settings enable row level security;
alter table storage.objects enable row level security;

drop policy if exists crm_leads_manager_admin_select on public.crm_leads;
drop policy if exists crm_leads_manager_admin_write on public.crm_leads;
drop policy if exists crm_leads_select_access on public.crm_leads;
drop policy if exists crm_leads_insert_manage on public.crm_leads;
drop policy if exists crm_leads_update_manage on public.crm_leads;
drop policy if exists crm_leads_delete_manage on public.crm_leads;

create policy crm_leads_select_access
on public.crm_leads
for select
to authenticated
using (
  app_private.has_permission('crm.leads.view', 'all')
  or app_private.has_permission('crm.leads.manage', 'all')
);

create policy crm_leads_insert_manage
on public.crm_leads
for insert
to authenticated
with check (app_private.has_permission('crm.leads.manage', 'all'));

create policy crm_leads_update_manage
on public.crm_leads
for update
to authenticated
using (app_private.has_permission('crm.leads.manage', 'all'))
with check (app_private.has_permission('crm.leads.manage', 'all'));

create policy crm_leads_delete_manage
on public.crm_leads
for delete
to authenticated
using (app_private.has_permission('crm.leads.manage', 'all'));

drop policy if exists crm_lead_comments_manager_admin_select on public.crm_lead_comments;
drop policy if exists crm_lead_comments_manager_admin_write on public.crm_lead_comments;
drop policy if exists crm_lead_comments_select_access on public.crm_lead_comments;
drop policy if exists crm_lead_comments_insert_manage on public.crm_lead_comments;
drop policy if exists crm_lead_comments_update_manage on public.crm_lead_comments;
drop policy if exists crm_lead_comments_delete_manage on public.crm_lead_comments;

create policy crm_lead_comments_select_access
on public.crm_lead_comments
for select
to authenticated
using (
  exists (
    select 1
    from public.crm_leads l
    where l.id = crm_lead_comments.lead_id
      and (
        app_private.has_permission('crm.leads.view', 'all')
        or app_private.has_permission('crm.leads.manage', 'all')
      )
  )
);

create policy crm_lead_comments_insert_manage
on public.crm_lead_comments
for insert
to authenticated
with check (
  app_private.has_permission('crm.leads.manage', 'all')
  and exists (
    select 1
    from public.crm_leads l
    where l.id = crm_lead_comments.lead_id
  )
);

create policy crm_lead_comments_update_manage
on public.crm_lead_comments
for update
to authenticated
using (app_private.has_permission('crm.leads.manage', 'all'))
with check (
  app_private.has_permission('crm.leads.manage', 'all')
  and exists (
    select 1
    from public.crm_leads l
    where l.id = crm_lead_comments.lead_id
  )
);

create policy crm_lead_comments_delete_manage
on public.crm_lead_comments
for delete
to authenticated
using (app_private.has_permission('crm.leads.manage', 'all'));

drop policy if exists crm_lead_status_history_manager_admin_select on public.crm_lead_status_history;
drop policy if exists crm_lead_status_history_manager_admin_write on public.crm_lead_status_history;
drop policy if exists crm_lead_status_history_select_access on public.crm_lead_status_history;
drop policy if exists crm_lead_status_history_insert_manage on public.crm_lead_status_history;
drop policy if exists crm_lead_status_history_update_manage on public.crm_lead_status_history;
drop policy if exists crm_lead_status_history_delete_manage on public.crm_lead_status_history;

create policy crm_lead_status_history_select_access
on public.crm_lead_status_history
for select
to authenticated
using (
  exists (
    select 1
    from public.crm_leads l
    where l.id = crm_lead_status_history.lead_id
      and (
        app_private.has_permission('crm.leads.view', 'all')
        or app_private.has_permission('crm.leads.manage', 'all')
      )
  )
);

create policy crm_lead_status_history_insert_manage
on public.crm_lead_status_history
for insert
to authenticated
with check (
  app_private.has_permission('crm.leads.manage', 'all')
  and exists (
    select 1
    from public.crm_leads l
    where l.id = crm_lead_status_history.lead_id
  )
);

create policy crm_lead_status_history_update_manage
on public.crm_lead_status_history
for update
to authenticated
using (app_private.has_permission('crm.leads.manage', 'all'))
with check (
  app_private.has_permission('crm.leads.manage', 'all')
  and exists (
    select 1
    from public.crm_leads l
    where l.id = crm_lead_status_history.lead_id
  )
);

create policy crm_lead_status_history_delete_manage
on public.crm_lead_status_history
for delete
to authenticated
using (app_private.has_permission('crm.leads.manage', 'all'));

drop policy if exists crm_settings_manager_admin_select on public.crm_settings;
drop policy if exists crm_settings_manager_admin_write on public.crm_settings;
drop policy if exists crm_settings_select_access on public.crm_settings;
drop policy if exists crm_settings_insert_manage on public.crm_settings;
drop policy if exists crm_settings_update_manage on public.crm_settings;
drop policy if exists crm_settings_delete_manage on public.crm_settings;

create policy crm_settings_select_access
on public.crm_settings
for select
to authenticated
using (
  app_private.has_permission('crm.leads.view', 'all')
  or app_private.has_permission('crm.leads.manage', 'all')
);

create policy crm_settings_insert_manage
on public.crm_settings
for insert
to authenticated
with check (
  id = true
  and app_private.has_permission('crm.leads.manage', 'all')
);

create policy crm_settings_update_manage
on public.crm_settings
for update
to authenticated
using (app_private.has_permission('crm.leads.manage', 'all'))
with check (
  id = true
  and app_private.has_permission('crm.leads.manage', 'all')
);

create policy crm_settings_delete_manage
on public.crm_settings
for delete
to authenticated
using (app_private.has_permission('crm.leads.manage', 'all'));

drop policy if exists crm_assets_manager_admin_insert on storage.objects;
drop policy if exists crm_assets_manager_admin_update on storage.objects;
drop policy if exists crm_assets_manager_admin_delete on storage.objects;
drop policy if exists crm_assets_insert_manage on storage.objects;
drop policy if exists crm_assets_update_manage on storage.objects;
drop policy if exists crm_assets_delete_manage on storage.objects;

create policy crm_assets_insert_manage
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'crm-assets'
  and app_private.has_permission('crm.leads.manage', 'all')
);

create policy crm_assets_update_manage
on storage.objects
for update
to authenticated
using (
  bucket_id = 'crm-assets'
  and app_private.has_permission('crm.leads.manage', 'all')
)
with check (
  bucket_id = 'crm-assets'
  and app_private.has_permission('crm.leads.manage', 'all')
);

create policy crm_assets_delete_manage
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'crm-assets'
  and app_private.has_permission('crm.leads.manage', 'all')
);

commit;
