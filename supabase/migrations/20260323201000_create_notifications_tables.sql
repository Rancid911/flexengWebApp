begin;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 240),
  body text not null check (char_length(body) between 1 and 6000),
  type text not null check (type in ('maintenance', 'update', 'news', 'assignments')),
  is_active boolean not null default true,
  target_roles text[] not null default array['all']::text[],
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notifications_expires_after_published check (expires_at is null or expires_at > published_at),
  constraint notifications_target_roles_not_empty check (cardinality(target_roles) >= 1),
  constraint notifications_target_roles_valid check (target_roles <@ array['all', 'student', 'teacher', 'manager', 'admin']::text[]),
  constraint notifications_target_roles_all_alone check (not ('all' = any(target_roles)) or cardinality(target_roles) = 1)
);

create table if not exists public.notification_user_state (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (notification_id, user_id),
  constraint notification_user_state_dismiss_requires_read check (dismissed_at is null or read_at is not null)
);

create index if not exists notifications_active_published_idx
  on public.notifications (is_active, published_at desc);

create index if not exists notifications_expires_idx
  on public.notifications (expires_at);

create index if not exists notification_user_state_user_idx
  on public.notification_user_state (user_id, dismissed_at, read_at);

create or replace function public.touch_notifications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_notifications_updated_at on public.notifications;
create trigger trg_notifications_updated_at
before update on public.notifications
for each row execute function public.touch_notifications_updated_at();

alter table public.notifications enable row level security;
alter table public.notification_user_state enable row level security;

drop policy if exists notifications_select_visible_for_authenticated on public.notifications;
create policy notifications_select_visible_for_authenticated
on public.notifications
for select
to authenticated
using (
  is_active = true
  and published_at <= now()
  and (expires_at is null or expires_at > now())
  and (
    'all' = any(target_roles)
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any(target_roles)
    )
  )
);

drop policy if exists notification_user_state_select_own on public.notification_user_state;
create policy notification_user_state_select_own
on public.notification_user_state
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists notification_user_state_insert_own on public.notification_user_state;
create policy notification_user_state_insert_own
on public.notification_user_state
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists notification_user_state_update_own on public.notification_user_state;
create policy notification_user_state_update_own
on public.notification_user_state
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

commit;
