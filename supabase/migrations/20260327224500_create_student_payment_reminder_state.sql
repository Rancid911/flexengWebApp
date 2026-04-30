begin;

create table if not exists public.student_payment_reminder_state (
  student_id uuid primary key references public.students(id) on delete cascade,
  current_status text not null default 'none'
    check (current_status in ('none', 'low_balance', 'debt')),
  last_status_changed_at timestamptz,
  last_notification_sent_at timestamptz,
  last_popup_shown_at timestamptz,
  last_threshold_lessons integer
    check (last_threshold_lessons is null or last_threshold_lessons >= 0),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_student_payment_reminder_state_updated_at
on public.student_payment_reminder_state;

create trigger trg_student_payment_reminder_state_updated_at
before update on public.student_payment_reminder_state
for each row execute function public.touch_teacher_workspace_updated_at();

create index if not exists student_payment_reminder_state_status_idx
  on public.student_payment_reminder_state (current_status, updated_at desc);

alter table public.student_payment_reminder_state enable row level security;

drop policy if exists student_payment_reminder_state_manager_admin_rw
on public.student_payment_reminder_state;

create policy student_payment_reminder_state_manager_admin_rw
on public.student_payment_reminder_state
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
