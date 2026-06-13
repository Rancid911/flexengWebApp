begin;

alter table public.notifications enable row level security;
alter table public.notification_user_state enable row level security;
alter table public.admin_payment_reminder_settings enable row level security;

drop policy if exists notifications_select_visible_for_authenticated on public.notifications;
drop policy if exists notifications_select_access on public.notifications;
drop policy if exists notifications_insert_manage on public.notifications;
drop policy if exists notifications_update_manage on public.notifications;
drop policy if exists notifications_delete_manage on public.notifications;

create policy notifications_select_access
on public.notifications
for select
to authenticated
using (
  app_private.has_permission('notifications.manage', 'all')
  or (
    is_active = true
    and published_at <= now()
    and (expires_at is null or expires_at > now())
    and exists (
      select 1
      from public.profiles current_profile
      where current_profile.id = auth.uid()
        and notifications.published_at >= current_profile.created_at
    )
    and (
      auth.uid() = any(coalesce(target_user_ids, array[]::uuid[]))
      or 'all' = any(target_roles)
      or exists (
        select 1
        from public.user_roles ur
        join public.roles r
          on r.id = ur.role_id
        where ur.user_id = auth.uid()
          and r.key = any(notifications.target_roles)
      )
    )
  )
);

create policy notifications_insert_manage
on public.notifications
for insert
to authenticated
with check (app_private.has_permission('notifications.manage', 'all'));

create policy notifications_update_manage
on public.notifications
for update
to authenticated
using (app_private.has_permission('notifications.manage', 'all'))
with check (app_private.has_permission('notifications.manage', 'all'));

create policy notifications_delete_manage
on public.notifications
for delete
to authenticated
using (app_private.has_permission('notifications.manage', 'all'));

drop policy if exists notification_user_state_select_own on public.notification_user_state;
drop policy if exists notification_user_state_insert_own on public.notification_user_state;
drop policy if exists notification_user_state_update_own on public.notification_user_state;

create policy notification_user_state_select_own
on public.notification_user_state
for select
to authenticated
using (user_id = auth.uid());

create policy notification_user_state_insert_own
on public.notification_user_state
for insert
to authenticated
with check (user_id = auth.uid());

create policy notification_user_state_update_own
on public.notification_user_state
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists admin_payment_reminder_settings_manager_admin_rw on public.admin_payment_reminder_settings;
drop policy if exists admin_payment_reminder_settings_select_manage on public.admin_payment_reminder_settings;
drop policy if exists admin_payment_reminder_settings_insert_manage on public.admin_payment_reminder_settings;
drop policy if exists admin_payment_reminder_settings_update_manage on public.admin_payment_reminder_settings;
drop policy if exists admin_payment_reminder_settings_delete_manage on public.admin_payment_reminder_settings;

create policy admin_payment_reminder_settings_select_manage
on public.admin_payment_reminder_settings
for select
to authenticated
using (app_private.has_permission('payments.manage', 'all'));

create policy admin_payment_reminder_settings_insert_manage
on public.admin_payment_reminder_settings
for insert
to authenticated
with check (
  id = true
  and app_private.has_permission('payments.manage', 'all')
);

create policy admin_payment_reminder_settings_update_manage
on public.admin_payment_reminder_settings
for update
to authenticated
using (app_private.has_permission('payments.manage', 'all'))
with check (
  id = true
  and app_private.has_permission('payments.manage', 'all')
);

create policy admin_payment_reminder_settings_delete_manage
on public.admin_payment_reminder_settings
for delete
to authenticated
using (app_private.has_permission('payments.manage', 'all'));

commit;
