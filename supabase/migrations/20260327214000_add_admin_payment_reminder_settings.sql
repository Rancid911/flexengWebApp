begin;

alter table if exists public.notifications
  add column if not exists target_user_ids uuid[];

create table if not exists public.admin_payment_reminder_settings (
  id boolean primary key default true,
  enabled boolean not null default true,
  threshold_lessons integer not null default 1 check (threshold_lessons >= 0),
  updated_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_payment_reminder_settings_singleton_check check (id = true)
);

insert into public.admin_payment_reminder_settings (id, enabled, threshold_lessons)
values (true, true, 1)
on conflict (id) do nothing;

drop trigger if exists trg_admin_payment_reminder_settings_updated_at on public.admin_payment_reminder_settings;
create trigger trg_admin_payment_reminder_settings_updated_at
before update on public.admin_payment_reminder_settings
for each row execute function public.touch_teacher_workspace_updated_at();

alter table public.admin_payment_reminder_settings enable row level security;

drop policy if exists admin_payment_reminder_settings_manager_admin_rw on public.admin_payment_reminder_settings;
create policy admin_payment_reminder_settings_manager_admin_rw
on public.admin_payment_reminder_settings
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

commit;
