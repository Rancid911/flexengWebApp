begin;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_key_check check (key in ('student', 'teacher', 'manager', 'admin'))
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text,
  category text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint permissions_key_check check (key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$')
);

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  scope text not null,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id, scope),
  constraint role_permissions_scope_check check (scope in ('own', 'assigned', 'all', 'own_demo', 'public', 'service_only'))
);

drop trigger if exists trg_roles_updated_at on public.roles;
create trigger trg_roles_updated_at
before update on public.roles
for each row execute function public.touch_updated_at();

drop trigger if exists trg_permissions_updated_at on public.permissions;
create trigger trg_permissions_updated_at
before update on public.permissions
for each row execute function public.touch_updated_at();

create index if not exists user_roles_role_id_idx
  on public.user_roles (role_id);

create index if not exists role_permissions_permission_scope_idx
  on public.role_permissions (permission_id, scope);

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;

insert into public.roles (key, name, description)
values
  ('student', 'Student', 'Learner workspace and own learning data access.'),
  ('teacher', 'Teacher', 'Assigned student, schedule, homework and teacher preview access.'),
  ('manager', 'Manager', 'Operational staff access for students, schedule, CRM and billing workflows.'),
  ('admin', 'Admin', 'Administrative access to users, roles, settings and operational domains.')
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description;

insert into public.permissions (key, category, description)
values
  ('users.view', 'users', 'View user directory and user profile records.'),
  ('users.manage', 'users', 'Create, update or deactivate users.'),
  ('roles.view', 'roles', 'View role and permission assignments.'),
  ('roles.manage', 'roles', 'Manage roles and role permission assignments.'),
  ('profile.view', 'profiles', 'View own or permitted profile data.'),
  ('profile.update', 'profiles', 'Update own or permitted profile data.'),
  ('students.view', 'students', 'View students within granted scope.'),
  ('students.manage', 'students', 'Create or update student records within granted scope.'),
  ('teachers.view', 'teachers', 'View teacher records.'),
  ('teachers.manage', 'teachers', 'Create or update teacher records.'),
  ('teacher_scope.view_assigned', 'teacher_scope', 'View students assigned to the current teacher.'),
  ('student_progress.view', 'student_progress', 'View student learning progress within granted scope.'),
  ('learning.preview_as_student', 'learning', 'Preview learner experience without writing real student progress.'),
  ('schedule.view', 'schedule', 'View schedule lessons within granted scope.'),
  ('schedule.manage', 'schedule', 'Create, update or cancel schedule lessons within granted scope.'),
  ('homework.view', 'homework', 'View homework within granted scope.'),
  ('homework.assign', 'homework', 'Assign homework within granted scope.'),
  ('homework.submit', 'homework', 'Submit own homework progress.'),
  ('billing.view', 'billing', 'View billing data within granted scope.'),
  ('billing.adjust', 'billing', 'Create billing adjustments.'),
  ('payments.view', 'payments', 'View payment data within granted scope.'),
  ('payments.manage', 'payments', 'Manage payment operations.'),
  ('crm.access', 'crm', 'Access CRM workspace.'),
  ('crm.leads.view', 'crm', 'View CRM leads.'),
  ('crm.leads.manage', 'crm', 'Manage CRM leads, statuses and comments.'),
  ('word_cards.train', 'word_cards', 'Train own word cards.'),
  ('word_cards.demo_train', 'word_cards', 'Preview word card training without writing real student progress.'),
  ('word_cards.manage', 'word_cards', 'Manage word card catalog.'),
  ('content.manage', 'content', 'Manage content and published learning/blog materials.'),
  ('notifications.view', 'notifications', 'View own notifications.'),
  ('notifications.manage', 'notifications', 'Manage notifications.'),
  ('search.ui', 'search', 'Open the search UI; result visibility is enforced by search access logic.')
on conflict (key) do update
set
  category = excluded.category,
  description = excluded.description;

with grants(role_key, permission_key, scope) as (
  values
    ('admin', 'users.view', 'all'),
    ('admin', 'users.manage', 'all'),
    ('admin', 'roles.view', 'all'),
    ('admin', 'roles.manage', 'all'),
    ('admin', 'profile.view', 'all'),
    ('admin', 'profile.update', 'all'),
    ('admin', 'students.view', 'all'),
    ('admin', 'students.manage', 'all'),
    ('admin', 'teachers.view', 'all'),
    ('admin', 'teachers.manage', 'all'),
    ('admin', 'teacher_scope.view_assigned', 'all'),
    ('admin', 'student_progress.view', 'all'),
    ('admin', 'schedule.view', 'all'),
    ('admin', 'schedule.manage', 'all'),
    ('admin', 'homework.view', 'all'),
    ('admin', 'homework.assign', 'all'),
    ('admin', 'billing.view', 'all'),
    ('admin', 'billing.adjust', 'all'),
    ('admin', 'payments.view', 'all'),
    ('admin', 'payments.manage', 'all'),
    ('admin', 'crm.access', 'all'),
    ('admin', 'crm.leads.view', 'all'),
    ('admin', 'crm.leads.manage', 'all'),
    ('admin', 'word_cards.manage', 'all'),
    ('admin', 'content.manage', 'all'),
    ('admin', 'notifications.view', 'all'),
    ('admin', 'notifications.manage', 'all'),
    ('admin', 'search.ui', 'all'),

    ('manager', 'users.view', 'all'),
    ('manager', 'profile.view', 'all'),
    ('manager', 'profile.update', 'own'),
    ('manager', 'students.view', 'all'),
    ('manager', 'students.manage', 'all'),
    ('manager', 'teachers.view', 'all'),
    ('manager', 'student_progress.view', 'all'),
    ('manager', 'schedule.view', 'all'),
    ('manager', 'schedule.manage', 'all'),
    ('manager', 'homework.view', 'all'),
    ('manager', 'homework.assign', 'all'),
    ('manager', 'billing.view', 'all'),
    ('manager', 'billing.adjust', 'all'),
    ('manager', 'payments.view', 'all'),
    ('manager', 'payments.manage', 'all'),
    ('manager', 'crm.access', 'all'),
    ('manager', 'crm.leads.view', 'all'),
    ('manager', 'crm.leads.manage', 'all'),
    ('manager', 'word_cards.manage', 'all'),
    ('manager', 'content.manage', 'all'),
    ('manager', 'notifications.view', 'own'),
    ('manager', 'notifications.manage', 'all'),
    ('manager', 'search.ui', 'all'),

    ('teacher', 'profile.view', 'own'),
    ('teacher', 'profile.update', 'own'),
    ('teacher', 'students.view', 'assigned'),
    ('teacher', 'teacher_scope.view_assigned', 'assigned'),
    ('teacher', 'student_progress.view', 'assigned'),
    ('teacher', 'learning.preview_as_student', 'own_demo'),
    ('teacher', 'schedule.view', 'assigned'),
    ('teacher', 'schedule.manage', 'assigned'),
    ('teacher', 'homework.view', 'assigned'),
    ('teacher', 'homework.assign', 'assigned'),
    ('teacher', 'billing.view', 'assigned'),
    ('teacher', 'word_cards.demo_train', 'own_demo'),
    ('teacher', 'notifications.view', 'own'),
    ('teacher', 'search.ui', 'assigned'),

    ('student', 'profile.view', 'own'),
    ('student', 'profile.update', 'own'),
    ('student', 'student_progress.view', 'own'),
    ('student', 'schedule.view', 'own'),
    ('student', 'homework.view', 'own'),
    ('student', 'homework.submit', 'own'),
    ('student', 'billing.view', 'own'),
    ('student', 'payments.view', 'own'),
    ('student', 'word_cards.train', 'own'),
    ('student', 'notifications.view', 'own'),
    ('student', 'search.ui', 'own')
)
insert into public.role_permissions (role_id, permission_id, scope)
select r.id, p.id, grants.scope
from grants
join public.roles r on r.key = grants.role_key
join public.permissions p on p.key = grants.permission_key
on conflict (role_id, permission_id, scope) do nothing;

commit;
