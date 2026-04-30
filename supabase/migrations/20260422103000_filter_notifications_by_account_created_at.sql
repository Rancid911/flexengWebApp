begin;

drop policy if exists notifications_select_visible_for_authenticated on public.notifications;
create policy notifications_select_visible_for_authenticated
on public.notifications
for select
to authenticated
using (
  is_active = true
  and published_at <= now()
  and (expires_at is null or expires_at > now())
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and published_at >= p.created_at
      and (
        'all' = any(target_roles)
        or p.role = any(target_roles)
      )
  )
);

commit;
