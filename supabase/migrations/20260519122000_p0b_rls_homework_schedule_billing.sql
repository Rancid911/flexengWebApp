begin;

alter table public.homework_assignments enable row level security;
alter table public.homework_items enable row level security;
alter table public.student_homework_progress enable row level security;
alter table public.student_schedule_lessons enable row level security;
alter table public.lesson_attendance enable row level security;
alter table public.lesson_outcomes enable row level security;
alter table public.student_billing_accounts enable row level security;
alter table public.student_billing_ledger enable row level security;
alter table public.payment_plans enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_webhook_events enable row level security;

drop policy if exists homework_assignments_select_own on public.homework_assignments;
drop policy if exists homework_assignments_select_access on public.homework_assignments;
drop policy if exists homework_assignments_insert_access on public.homework_assignments;
drop policy if exists homework_assignments_update_access on public.homework_assignments;
drop policy if exists homework_assignments_delete_access on public.homework_assignments;

create policy homework_assignments_select_access
on public.homework_assignments
for select
to authenticated
using (
  app_private.can_access_student(student_id)
  or app_private.has_permission('homework.view', 'all')
);

create policy homework_assignments_insert_access
on public.homework_assignments
for insert
to authenticated
with check (
  app_private.is_own_student(student_id)
  or (
    app_private.is_assigned_teacher(student_id)
    and app_private.has_permission('homework.assign', 'assigned')
  )
  or app_private.has_permission('homework.assign', 'all')
);

create policy homework_assignments_update_access
on public.homework_assignments
for update
to authenticated
using (
  app_private.is_own_student(student_id)
  or (
    app_private.is_assigned_teacher(student_id)
    and app_private.has_permission('homework.assign', 'assigned')
  )
  or app_private.has_permission('homework.assign', 'all')
)
with check (
  app_private.is_own_student(student_id)
  or (
    app_private.is_assigned_teacher(student_id)
    and app_private.has_permission('homework.assign', 'assigned')
  )
  or app_private.has_permission('homework.assign', 'all')
);

create policy homework_assignments_delete_access
on public.homework_assignments
for delete
to authenticated
using (
  app_private.is_own_student(student_id)
  or (
    app_private.is_assigned_teacher(student_id)
    and app_private.has_permission('homework.assign', 'assigned')
  )
  or app_private.has_permission('homework.assign', 'all')
);

drop policy if exists homework_items_select_via_own_assignment on public.homework_items;
drop policy if exists homework_items_select_access on public.homework_items;
drop policy if exists homework_items_insert_access on public.homework_items;
drop policy if exists homework_items_update_access on public.homework_items;
drop policy if exists homework_items_delete_access on public.homework_items;

create policy homework_items_select_access
on public.homework_items
for select
to authenticated
using (
  exists (
    select 1
    from public.homework_assignments ha
    where ha.id = homework_items.assignment_id
      and (
        app_private.can_access_student(ha.student_id)
        or app_private.has_permission('homework.view', 'all')
      )
  )
);

create policy homework_items_insert_access
on public.homework_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.homework_assignments ha
    where ha.id = homework_items.assignment_id
      and (
        app_private.is_own_student(ha.student_id)
        or (
          app_private.is_assigned_teacher(ha.student_id)
          and app_private.has_permission('homework.assign', 'assigned')
        )
        or app_private.has_permission('homework.assign', 'all')
      )
  )
);

create policy homework_items_update_access
on public.homework_items
for update
to authenticated
using (
  exists (
    select 1
    from public.homework_assignments ha
    where ha.id = homework_items.assignment_id
      and (
        app_private.is_own_student(ha.student_id)
        or (
          app_private.is_assigned_teacher(ha.student_id)
          and app_private.has_permission('homework.assign', 'assigned')
        )
        or app_private.has_permission('homework.assign', 'all')
      )
  )
)
with check (
  exists (
    select 1
    from public.homework_assignments ha
    where ha.id = homework_items.assignment_id
      and (
        app_private.is_own_student(ha.student_id)
        or (
          app_private.is_assigned_teacher(ha.student_id)
          and app_private.has_permission('homework.assign', 'assigned')
        )
        or app_private.has_permission('homework.assign', 'all')
      )
  )
);

create policy homework_items_delete_access
on public.homework_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.homework_assignments ha
    where ha.id = homework_items.assignment_id
      and (
        app_private.is_own_student(ha.student_id)
        or (
          app_private.is_assigned_teacher(ha.student_id)
          and app_private.has_permission('homework.assign', 'assigned')
        )
        or app_private.has_permission('homework.assign', 'all')
      )
  )
);

drop policy if exists student_homework_progress_select_own on public.student_homework_progress;
drop policy if exists student_homework_progress_select_access on public.student_homework_progress;
drop policy if exists student_homework_progress_insert_own on public.student_homework_progress;
drop policy if exists student_homework_progress_update_own on public.student_homework_progress;
drop policy if exists student_homework_progress_delete_own on public.student_homework_progress;

create policy student_homework_progress_select_access
on public.student_homework_progress
for select
to authenticated
using (app_private.can_access_student(student_id));

create policy student_homework_progress_insert_own
on public.student_homework_progress
for insert
to authenticated
with check (
  app_private.is_own_student(student_id)
  and exists (
    select 1
    from public.homework_assignments ha
    where ha.id = student_homework_progress.assignment_id
      and ha.student_id = student_homework_progress.student_id
  )
);

create policy student_homework_progress_update_own
on public.student_homework_progress
for update
to authenticated
using (app_private.is_own_student(student_id))
with check (
  app_private.is_own_student(student_id)
  and exists (
    select 1
    from public.homework_assignments ha
    where ha.id = student_homework_progress.assignment_id
      and ha.student_id = student_homework_progress.student_id
  )
);

create policy student_homework_progress_delete_own
on public.student_homework_progress
for delete
to authenticated
using (app_private.is_own_student(student_id));

drop policy if exists student_schedule_lessons_select_own_student on public.student_schedule_lessons;
drop policy if exists student_schedule_lessons_select_teacher_scope on public.student_schedule_lessons;
drop policy if exists student_schedule_lessons_select_manager_admin on public.student_schedule_lessons;
drop policy if exists student_schedule_lessons_insert_teacher_scope on public.student_schedule_lessons;
drop policy if exists student_schedule_lessons_insert_manager_admin on public.student_schedule_lessons;
drop policy if exists student_schedule_lessons_update_teacher_scope on public.student_schedule_lessons;
drop policy if exists student_schedule_lessons_update_manager_admin on public.student_schedule_lessons;
drop policy if exists student_schedule_lessons_select_access on public.student_schedule_lessons;
drop policy if exists student_schedule_lessons_insert_access on public.student_schedule_lessons;
drop policy if exists student_schedule_lessons_update_access on public.student_schedule_lessons;
drop policy if exists student_schedule_lessons_delete_access on public.student_schedule_lessons;

create policy student_schedule_lessons_select_access
on public.student_schedule_lessons
for select
to authenticated
using (
  app_private.can_access_student(student_id)
  or app_private.has_permission('schedule.view', 'all')
);

create policy student_schedule_lessons_insert_access
on public.student_schedule_lessons
for insert
to authenticated
with check (
  (
    teacher_id = app_private.current_teacher_id()
    and app_private.is_assigned_teacher(student_id)
    and app_private.has_permission('schedule.manage', 'assigned')
  )
  or app_private.has_permission('schedule.manage', 'all')
);

create policy student_schedule_lessons_update_access
on public.student_schedule_lessons
for update
to authenticated
using (
  (
    teacher_id = app_private.current_teacher_id()
    and app_private.is_assigned_teacher(student_id)
    and app_private.has_permission('schedule.manage', 'assigned')
  )
  or app_private.has_permission('schedule.manage', 'all')
)
with check (
  (
    teacher_id = app_private.current_teacher_id()
    and app_private.is_assigned_teacher(student_id)
    and app_private.has_permission('schedule.manage', 'assigned')
  )
  or app_private.has_permission('schedule.manage', 'all')
);

create policy student_schedule_lessons_delete_access
on public.student_schedule_lessons
for delete
to authenticated
using (
  (
    teacher_id = app_private.current_teacher_id()
    and app_private.is_assigned_teacher(student_id)
    and app_private.has_permission('schedule.manage', 'assigned')
  )
  or app_private.has_permission('schedule.manage', 'all')
);

drop policy if exists lesson_attendance_select_own_student on public.lesson_attendance;
drop policy if exists lesson_attendance_teacher_scope_rw on public.lesson_attendance;
drop policy if exists lesson_attendance_manager_admin_rw on public.lesson_attendance;
drop policy if exists lesson_attendance_select_access on public.lesson_attendance;
drop policy if exists lesson_attendance_insert_access on public.lesson_attendance;
drop policy if exists lesson_attendance_update_access on public.lesson_attendance;
drop policy if exists lesson_attendance_delete_access on public.lesson_attendance;

create policy lesson_attendance_select_access
on public.lesson_attendance
for select
to authenticated
using (
  app_private.is_own_student(student_id)
  or (
    teacher_id = app_private.current_teacher_id()
    and app_private.is_assigned_teacher(student_id)
  )
  or app_private.has_permission('schedule.view', 'all')
);

create policy lesson_attendance_insert_access
on public.lesson_attendance
for insert
to authenticated
with check (
  (
    teacher_id = app_private.current_teacher_id()
    and app_private.is_assigned_teacher(student_id)
    and app_private.has_permission('schedule.manage', 'assigned')
  )
  or app_private.has_permission('schedule.manage', 'all')
);

create policy lesson_attendance_update_access
on public.lesson_attendance
for update
to authenticated
using (
  (
    teacher_id = app_private.current_teacher_id()
    and app_private.is_assigned_teacher(student_id)
    and app_private.has_permission('schedule.manage', 'assigned')
  )
  or app_private.has_permission('schedule.manage', 'all')
)
with check (
  (
    teacher_id = app_private.current_teacher_id()
    and app_private.is_assigned_teacher(student_id)
    and app_private.has_permission('schedule.manage', 'assigned')
  )
  or app_private.has_permission('schedule.manage', 'all')
);

create policy lesson_attendance_delete_access
on public.lesson_attendance
for delete
to authenticated
using (
  (
    teacher_id = app_private.current_teacher_id()
    and app_private.is_assigned_teacher(student_id)
    and app_private.has_permission('schedule.manage', 'assigned')
  )
  or app_private.has_permission('schedule.manage', 'all')
);

drop policy if exists lesson_outcomes_select_own_visible on public.lesson_outcomes;
drop policy if exists lesson_outcomes_teacher_scope_rw on public.lesson_outcomes;
drop policy if exists lesson_outcomes_manager_admin_rw on public.lesson_outcomes;
drop policy if exists lesson_outcomes_select_access on public.lesson_outcomes;
drop policy if exists lesson_outcomes_insert_access on public.lesson_outcomes;
drop policy if exists lesson_outcomes_update_access on public.lesson_outcomes;
drop policy if exists lesson_outcomes_delete_access on public.lesson_outcomes;

create policy lesson_outcomes_select_access
on public.lesson_outcomes
for select
to authenticated
using (
  (
    visible_to_student = true
    and app_private.is_own_student(student_id)
  )
  or (
    teacher_id = app_private.current_teacher_id()
    and app_private.is_assigned_teacher(student_id)
  )
  or app_private.has_permission('schedule.view', 'all')
);

create policy lesson_outcomes_insert_access
on public.lesson_outcomes
for insert
to authenticated
with check (
  (
    teacher_id = app_private.current_teacher_id()
    and app_private.is_assigned_teacher(student_id)
    and app_private.has_permission('schedule.manage', 'assigned')
  )
  or app_private.has_permission('schedule.manage', 'all')
);

create policy lesson_outcomes_update_access
on public.lesson_outcomes
for update
to authenticated
using (
  (
    teacher_id = app_private.current_teacher_id()
    and app_private.is_assigned_teacher(student_id)
    and app_private.has_permission('schedule.manage', 'assigned')
  )
  or app_private.has_permission('schedule.manage', 'all')
)
with check (
  (
    teacher_id = app_private.current_teacher_id()
    and app_private.is_assigned_teacher(student_id)
    and app_private.has_permission('schedule.manage', 'assigned')
  )
  or app_private.has_permission('schedule.manage', 'all')
);

create policy lesson_outcomes_delete_access
on public.lesson_outcomes
for delete
to authenticated
using (
  (
    teacher_id = app_private.current_teacher_id()
    and app_private.is_assigned_teacher(student_id)
    and app_private.has_permission('schedule.manage', 'assigned')
  )
  or app_private.has_permission('schedule.manage', 'all')
);

drop policy if exists student_billing_accounts_select_own on public.student_billing_accounts;
drop policy if exists student_billing_accounts_teacher_scope_select on public.student_billing_accounts;
drop policy if exists student_billing_accounts_manager_admin_rw on public.student_billing_accounts;
drop policy if exists student_billing_accounts_select_access on public.student_billing_accounts;
drop policy if exists student_billing_accounts_insert_manage on public.student_billing_accounts;
drop policy if exists student_billing_accounts_update_manage on public.student_billing_accounts;
drop policy if exists student_billing_accounts_delete_manage on public.student_billing_accounts;

create policy student_billing_accounts_select_access
on public.student_billing_accounts
for select
to authenticated
using (app_private.can_view_payment(student_id));

create policy student_billing_accounts_insert_manage
on public.student_billing_accounts
for insert
to authenticated
with check (
  app_private.has_permission('billing.adjust', 'all')
  or app_private.has_permission('payments.manage', 'all')
);

create policy student_billing_accounts_update_manage
on public.student_billing_accounts
for update
to authenticated
using (
  app_private.has_permission('billing.adjust', 'all')
  or app_private.has_permission('payments.manage', 'all')
)
with check (
  app_private.has_permission('billing.adjust', 'all')
  or app_private.has_permission('payments.manage', 'all')
);

create policy student_billing_accounts_delete_manage
on public.student_billing_accounts
for delete
to authenticated
using (
  app_private.has_permission('billing.adjust', 'all')
  or app_private.has_permission('payments.manage', 'all')
);

drop policy if exists student_billing_ledger_select_own on public.student_billing_ledger;
drop policy if exists student_billing_ledger_teacher_scope_select on public.student_billing_ledger;
drop policy if exists student_billing_ledger_manager_admin_rw on public.student_billing_ledger;
drop policy if exists student_billing_ledger_select_access on public.student_billing_ledger;
drop policy if exists student_billing_ledger_insert_manage on public.student_billing_ledger;
drop policy if exists student_billing_ledger_update_manage on public.student_billing_ledger;
drop policy if exists student_billing_ledger_delete_manage on public.student_billing_ledger;

create policy student_billing_ledger_select_access
on public.student_billing_ledger
for select
to authenticated
using (app_private.can_view_payment(student_id));

create policy student_billing_ledger_insert_manage
on public.student_billing_ledger
for insert
to authenticated
with check (
  app_private.has_permission('billing.adjust', 'all')
  or app_private.has_permission('payments.manage', 'all')
);

create policy student_billing_ledger_update_manage
on public.student_billing_ledger
for update
to authenticated
using (
  app_private.has_permission('billing.adjust', 'all')
  or app_private.has_permission('payments.manage', 'all')
)
with check (
  app_private.has_permission('billing.adjust', 'all')
  or app_private.has_permission('payments.manage', 'all')
);

create policy student_billing_ledger_delete_manage
on public.student_billing_ledger
for delete
to authenticated
using (
  app_private.has_permission('billing.adjust', 'all')
  or app_private.has_permission('payments.manage', 'all')
);

drop policy if exists payment_transactions_select_own on public.payment_transactions;
drop policy if exists payment_transactions_select_access on public.payment_transactions;
drop policy if exists payment_transactions_insert_manage on public.payment_transactions;
drop policy if exists payment_transactions_update_manage on public.payment_transactions;
drop policy if exists payment_transactions_delete_manage on public.payment_transactions;

create policy payment_transactions_select_access
on public.payment_transactions
for select
to authenticated
using (
  (
    student_id is not null
    and app_private.is_own_student(student_id)
    and app_private.has_permission('payments.view', 'own')
  )
  or app_private.has_permission('payments.view', 'all')
);

create policy payment_transactions_insert_manage
on public.payment_transactions
for insert
to authenticated
with check (app_private.has_permission('payments.manage', 'all'));

create policy payment_transactions_update_manage
on public.payment_transactions
for update
to authenticated
using (app_private.has_permission('payments.manage', 'all'))
with check (app_private.has_permission('payments.manage', 'all'));

create policy payment_transactions_delete_manage
on public.payment_transactions
for delete
to authenticated
using (app_private.has_permission('payments.manage', 'all'));

drop policy if exists payment_plans_select_active on public.payment_plans;
drop policy if exists payment_plans_select_access on public.payment_plans;
drop policy if exists payment_plans_insert_manage on public.payment_plans;
drop policy if exists payment_plans_update_manage on public.payment_plans;
drop policy if exists payment_plans_delete_manage on public.payment_plans;

create policy payment_plans_select_access
on public.payment_plans
for select
to authenticated
using (
  is_active = true
  or app_private.has_permission('payments.manage', 'all')
);

create policy payment_plans_insert_manage
on public.payment_plans
for insert
to authenticated
with check (app_private.has_permission('payments.manage', 'all'));

create policy payment_plans_update_manage
on public.payment_plans
for update
to authenticated
using (app_private.has_permission('payments.manage', 'all'))
with check (app_private.has_permission('payments.manage', 'all'));

create policy payment_plans_delete_manage
on public.payment_plans
for delete
to authenticated
using (app_private.has_permission('payments.manage', 'all'));

commit;
