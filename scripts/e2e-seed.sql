-- E2E seed (run in Supabase SQL Editor)
-- Replace UUID placeholders with existing auth.users ids.
-- This seed ensures:
-- 1) test profiles exist for student/admin;
-- 2) one active unread notification is visible for the student;
-- 3) student notification state is reset (not dismissed).

begin;

-- put real ids from auth.users
-- select id, email from auth.users;
do $$
declare
  v_student_id uuid := '00000000-0000-0000-0000-000000000001';
  v_admin_id uuid := '00000000-0000-0000-0000-000000000002';
  v_notification_id uuid;
begin
  insert into public.profiles (id, role, first_name, last_name, email, phone)
  values
    (v_student_id, 'student', 'E2E', 'Student', 'e2e-student@example.com', '+79990000001'),
    (v_admin_id, 'admin', 'E2E', 'Admin', 'e2e-admin@example.com', '+79990000002')
  on conflict (id) do update
  set role = excluded.role,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      email = excluded.email,
      phone = excluded.phone;

  insert into public.notifications (
    title,
    body,
    type,
    is_active,
    target_roles,
    published_at,
    expires_at,
    created_by
  )
  values (
    'E2E smoke notification',
    'Visible unread notification for smoke tests.',
    'update',
    true,
    array['all']::text[],
    now() - interval '1 minute',
    now() + interval '14 days',
    v_admin_id
  )
  returning id into v_notification_id;

  insert into public.notification_user_state (notification_id, user_id, read_at, dismissed_at)
  values (v_notification_id, v_student_id, null, null)
  on conflict (notification_id, user_id) do update
  set read_at = null,
      dismissed_at = null;
end $$;

commit;

