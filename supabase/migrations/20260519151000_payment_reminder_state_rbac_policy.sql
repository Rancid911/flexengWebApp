begin;

alter table public.student_payment_reminder_state enable row level security;

drop policy if exists student_payment_reminder_state_manager_admin_rw
on public.student_payment_reminder_state;
drop policy if exists student_payment_reminder_state_select_manage
on public.student_payment_reminder_state;
drop policy if exists student_payment_reminder_state_insert_manage
on public.student_payment_reminder_state;
drop policy if exists student_payment_reminder_state_update_manage
on public.student_payment_reminder_state;
drop policy if exists student_payment_reminder_state_delete_manage
on public.student_payment_reminder_state;

create policy student_payment_reminder_state_select_manage
on public.student_payment_reminder_state
for select
to authenticated
using (app_private.has_permission('payments.manage', 'all'));

create policy student_payment_reminder_state_insert_manage
on public.student_payment_reminder_state
for insert
to authenticated
with check (app_private.has_permission('payments.manage', 'all'));

create policy student_payment_reminder_state_update_manage
on public.student_payment_reminder_state
for update
to authenticated
using (app_private.has_permission('payments.manage', 'all'))
with check (app_private.has_permission('payments.manage', 'all'));

create policy student_payment_reminder_state_delete_manage
on public.student_payment_reminder_state
for delete
to authenticated
using (app_private.has_permission('payments.manage', 'all'));

commit;
