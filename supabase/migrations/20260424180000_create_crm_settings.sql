create table if not exists public.crm_settings (
  id boolean primary key default true,
  background_image_url text,
  updated_at timestamptz not null default now(),
  updated_by_profile_id uuid references public.profiles(id) on delete set null,
  constraint crm_settings_singleton_check check (id = true)
);

insert into public.crm_settings (id, background_image_url)
values (true, null)
on conflict (id) do nothing;

drop trigger if exists trg_crm_settings_updated_at on public.crm_settings;
create trigger trg_crm_settings_updated_at
before update on public.crm_settings
for each row execute function public.touch_student_cabinet_updated_at();

alter table public.crm_settings enable row level security;

drop policy if exists crm_settings_manager_admin_select on public.crm_settings;
create policy crm_settings_manager_admin_select
on public.crm_settings
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

drop policy if exists crm_settings_manager_admin_write on public.crm_settings;
create policy crm_settings_manager_admin_write
on public.crm_settings
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

insert into storage.buckets (id, name, public)
values ('crm-assets', 'crm-assets', true)
on conflict (id) do update set public = excluded.public;

alter table storage.objects enable row level security;

drop policy if exists crm_assets_public_select on storage.objects;
create policy crm_assets_public_select
on storage.objects
for select
to public
using (bucket_id = 'crm-assets');

drop policy if exists crm_assets_manager_admin_insert on storage.objects;
create policy crm_assets_manager_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'crm-assets'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
);

drop policy if exists crm_assets_manager_admin_update on storage.objects;
create policy crm_assets_manager_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'crm-assets'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
)
with check (
  bucket_id = 'crm-assets'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
);

drop policy if exists crm_assets_manager_admin_delete on storage.objects;
create policy crm_assets_manager_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'crm-assets'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('manager', 'admin')
  )
);
