# RBAC / RLS Implementation Plan

This document is the decision log and PR roadmap for the next access-control migration phase. It is intentionally practical: minimal RBAC first, no individual overrides, no broad RLS rewrite, and no mass service-role cleanup until policies are proven.

## Final Direction

- `Role` is a business context, `Permission` is a function, `Scope` is a data boundary, and RLS is the final row filter.
- `profiles.role` stays physically unchanged for now. Treat it as a legacy / primary role / compatibility field, not the final source of truth.
- `admin` and `manager` are separate roles. Their permissions may overlap during MVP.
- Teacher preview is demo/read-only for MVP. It must not create or mutate real student records.
- Menus, route guards, and API guards should gradually move to permissions.
- RLS rolls out by domain: identity/core access first, operational data second, CRM/search/secondary domains later.
- Service role remains allowed only for classified server-side boundaries. Do not remove it broadly before matching RLS policies and tests exist.

## MVP RBAC Model

Add these tables first:

| Table | Required fields | Notes |
| --- | --- | --- |
| `roles` | `id`, `key`, `name`, `description`, `created_at`, `updated_at` | Seed `admin`, `manager`, `teacher`, `student`. |
| `user_roles` | `user_id`, `role_id`, `created_at` | Unique `(user_id, role_id)`. Backfill from `profiles.role`. |
| `permissions` | `id`, `key`, `description`, `category`, `created_at` | Unique `(key)`. Seed MVP permissions. |
| `role_permissions` | `role_id`, `permission_id`, `scope`, `created_at` | Unique `(role_id, permission_id, scope)`. This is the MVP role preset mechanism. |

Do not add in the first DB PR:

- `user_permissions`;
- `effect = allow | deny`;
- permission preset tables;
- role/permission admin UI;
- a physical rename of `profiles.role`.

MVP scopes:

```text
own
assigned
all
own_demo
public
service_only
```

Transition source of truth:

1. Early: `profiles.role` plus RBAC mirror.
2. Mid: `AppActor.permissions` and `AppActor.scopes` from RBAC, while legacy actor fields remain.
3. Target: RBAC tables for application authorization, RLS helpers for row access, and `profiles.role` as compatibility/display only.

## MVP Permission Taxonomy

| Domain | Permission | Default roles | Scopes | Used for | Priority |
| --- | --- | --- | --- | --- | --- |
| Users/Roles | `users.view` | admin, manager | all | menu/route/API/RLS | P0-A |
| Users/Roles | `users.manage` | admin | all | route/API/RLS | P0-A |
| Users/Roles | `roles.view` | admin | all | route/API/RLS | P0-A |
| Users/Roles | `roles.manage` | admin | all | route/API/RLS | P0-A |
| Profiles | `profile.view` | all | own/all | route/API/RLS | P0-A |
| Profiles | `profile.update` | all | own/all | API/RLS | P0-A |
| Students | `students.view` | admin, manager, teacher | all/assigned | menu/route/API/RLS | P0-A |
| Students | `students.manage` | admin, manager | all | API/RLS | P0-A |
| Teachers | `teachers.view` | admin, manager | all | menu/route/API/RLS | P0-A |
| Teachers | `teachers.manage` | admin | all | API/RLS | P0-A |
| Teacher scope | `teacher_scope.view_assigned` | teacher | assigned | API/RLS | P0-A |
| Student progress | `student_progress.view` | student, teacher, manager, admin | own/assigned/all | route/API/RLS | P0-A |
| Teacher preview | `learning.preview_as_student` | teacher | own_demo | route/API | P0-A |
| Schedule | `schedule.view` | all roles | own/assigned/all | menu/route/API/RLS | P0-B |
| Schedule | `schedule.manage` | teacher, manager, admin | assigned/all | API/RLS | P0-B |
| Homework | `homework.view` | student, teacher, manager, admin | own/assigned/all | route/API/RLS | P0-B |
| Homework | `homework.assign` | teacher, manager, admin | assigned/all | API/RLS | P0-B |
| Homework | `homework.submit` | student | own | API/RLS | P0-B |
| Billing/Payments | `billing.view` | student, teacher, manager, admin | own/assigned/all | route/API/RLS | P0-B |
| Billing/Payments | `billing.adjust` | manager, admin | all | API/RLS | P0-B |
| Billing/Payments | `payments.view` | student, manager, admin | own/all | route/API/RLS | P0-B |
| Billing/Payments | `payments.manage` | admin, manager | all | API/RLS | P0-B |
| CRM | `crm.access` | manager, admin | all | menu/route | P1 |
| CRM | `crm.leads.view` | manager, admin | all | API/RLS | P1 |
| CRM | `crm.leads.manage` | manager, admin | all | API/RLS | P1 |
| Word cards | `word_cards.train` | student | own | route/API/RLS | P0-B |
| Word cards | `word_cards.demo_train` | teacher | own_demo | route/API | P0-B |
| Word cards | `word_cards.manage` | admin, manager | all | API/RLS | P1 |
| Content | `content.manage` | admin, manager | all | route/API/RLS | P1 |
| Notifications | `notifications.view` | all roles | own | API/RLS | P1 |
| Notifications | `notifications.manage` | admin, manager | all | API/RLS | P1 |
| Search | `search.ui` | all authenticated | own/assigned/all | menu/route only | P1 |
| Search | data access | derived by domain scopes | own/assigned/all/public | RPC/access layer/RLS | P1 |

`search.ui` is not a data-security permission. Search result security must come from the access layer, domain scopes, RPCs, or RLS.

## RLS Rollout Priority

### P0-A: identity, RBAC, teacher scope, core student data

Tables:

- `roles`, `user_roles`, `permissions`, `role_permissions`;
- `profiles`, `students`, `teachers`;
- `teacher_student_notes`;
- `student_test_attempts`, `student_test_answers`, `student_lesson_progress`, `student_words`, `student_word_reviews`.

Minimum policies:

- own profile/student access;
- teacher assigned-student access via `can_access_student(student_id)`;
- admin/manager access via `has_permission(...)`;
- `WITH CHECK` on every INSERT/UPDATE path that carries `student_id`, `teacher_id`, `profile_id`, or owner fields.

Required tests:

- student cannot read/write another student's data;
- teacher cannot access unassigned student;
- malformed/missing teacher scope denies;
- admin/manager access is permission-based.

### P0-B: sensitive operational data

Tables:

- `homework_assignments`, `homework_items`, `student_homework_progress`;
- `student_schedule_lessons`, `lesson_attendance`, `lesson_outcomes`;
- `student_billing_accounts`, `student_billing_ledger`, `payment_transactions`, `payment_plans`.

Minimum policies:

- student own read/write where intended;
- teacher assigned read/write where intended;
- manager/admin by permissions;
- payment provider/system paths remain service-only.

Required tests:

- schedule assigned/unassigned matrix;
- homework assign/submit/review matrix;
- billing own/assigned/all matrix;
- payment webhook remains service-only.

### P1: CRM, search, notifications, teacher dossiers, course/test content

Tables:

- `crm_leads`, `crm_lead_comments`, `crm_lead_status_history`, `crm_settings`;
- `search_documents`;
- `notifications`, `notification_user_state`;
- `teacher_dossiers`;
- `courses`, `course_modules`, `lessons`, `tests`, `test_questions`, `test_question_options`.

Required tests:

- CRM permission matrix;
- search has no private leakage;
- notifications target visibility remains correct;
- teacher dossier visibility is explicit.

### P2: public/lower-risk hardening

Tables and areas:

- `blog_posts`, `blog_categories`, `blog_tags`, `blog_post_tags`;
- `word_card_sets`, `word_card_items`;
- secondary settings;
- storage bucket hardening if backend proxy remains stable.

### Service-only

- `payment_webhook_events`;
- provider raw payloads;
- search indexing/system jobs;
- audit/backfill/system tables.

## RLS Helper Strategy

Functional helpers:

- `has_permission(permission_key text)`;
- use for users, roles, system settings, CRM coarse access, content management, and admin-only operations;
- do not use as the only check for student-owned rows, teacher-assigned rows, payment rows, or high-volume progress queries.

Resource/scope helpers:

- `is_own_student(student_id uuid)`;
- `is_assigned_teacher(student_id uuid)`;
- `can_access_student(student_id uuid)`;
- use for students, schedule, homework, progress, words, notes, outcomes, and billing summaries.

Domain helpers:

- `can_view_payment(student_id uuid)`;
- `can_submit_homework(assignment_id uuid)`;
- `can_view_test_attempt(attempt_id uuid)`;
- use when access depends on indirect ownership or domain state.

RPC / service-only:

- use for dashboard aggregates, search, billing summaries, admin metrics, provider jobs, and search indexing.
- prefer RPCs for expensive aggregate/read-model paths instead of heavy per-row RLS.

Required indexes before policy rollout:

- `permissions(key)`;
- `user_roles(user_id, role_id)`;
- `role_permissions(role_id, permission_id, scope)`;
- `students(profile_id)`;
- `students(primary_teacher_id)`;
- `teachers(profile_id)`;
- student-owned tables on `student_id`;
- `student_schedule_lessons(student_id, starts_at)`;
- `student_schedule_lessons(teacher_id, starts_at)`.

## Teacher Preview Decision

MVP behavior:

- teacher preview is read/demo-only;
- no real `students` row should be created for preview;
- preview flows must not write to `student_test_attempts`, `student_words`, `student_lesson_progress`, or `student_homework_progress`;
- real dual-role is allowed only when the person genuinely studies as a student.

Early guard PR:

- identify preview/student-like routes and write services;
- add guards/tests so teacher preview cannot mutate real student tables;
- document a classification query for profiles that have both `teachers` and `students` rows.

PR 4A write-surface inventory:

- practice attempts: `student_test_attempts`, `student_test_answers`, `student_mistakes`, and homework sync into `student_homework_progress`;
- word-card sessions: `student_words` and `student_word_reviews`;
- read-only student pages remain outside PR 4A scope;
- existing data cleanup/migration is not part of PR 4A.

Teacher + student classification query:

```sql
select
  p.id as profile_id,
  p.email,
  p.role as legacy_profile_role,
  s.id as student_id,
  t.id as teacher_id,
  case
    when p.role = 'student' then 'candidate_real_dual_role'
    when p.role = 'teacher' then 'candidate_teacher_preview_or_fake_student'
    else 'needs_manual_review'
  end as classification
from public.profiles p
join public.students s on s.profile_id = p.id
join public.teachers t on t.profile_id = p.id
order by p.role, p.email nulls last;
```

Later, if persistent demo progress is required, add separate `teacher_demo_*` tables. Do not add `mode = real/demo` to shared student tables for MVP.

## Service Role Strategy

Keep:

- payment webhooks/provider callbacks;
- migrations/backfill;
- system jobs;
- search indexing;
- media proxy while Storage is backend-mediated;
- explicit admin aggregates where RLS/RPC replacement is not ready.

Keep temporarily:

- request-context profile loading and linked actor scope;
- schedule/homework/practice repositories;
- teacher workspace repositories;
- CRM repositories;
- admin repositories.

Replace with RPC later:

- dashboard aggregates;
- billing summaries;
- admin metrics;
- search read model;
- complex schedule summaries.

Replace with user-scoped client later:

- own profile operations;
- own student dashboard;
- own homework/progress/words;
- teacher assigned-student reads after RLS tests.

Remove immediately / forbid:

- service role in client bundle;
- direct service-role usage in new API handlers without service/repository boundary;
- any new `createAdminClient()` call site without inventory classification;
- service role as a workaround for missing permission checks.

Application-level `requirePermission()` before service-role access is acceptable during transition only when the service also validates resource scope and has tests.

## PR Roadmap

### PR 1: Access Model Decision Log + Static Inventory

Goal: freeze decisions and expose all legacy role/RLS/service-role dependencies.

Scope:

- docs/static inventory only;
- raw `profiles.role` checks;
- RLS policies using `profiles.role`;
- service-role call sites;
- teacher+student candidate query documented.

Must not include runtime or DB schema changes.

Acceptance:

- this document exists;
- stale architecture guidance is updated;
- service-role inventory references the RBAC/RLS roadmap.

Verification:

```bash
npm run check:architecture
rg "p\\.role|role in \\('manager', 'admin'\\)|target_roles|role_scope" supabase/migrations
rg "createAdminClient\\(" app features lib
```

### PR 2: Additive Minimal RBAC Schema

Add `roles`, `user_roles`, `permissions`, `role_permissions`, scope field, indexes, and seed data. Do not add `user_permissions`, `deny`, presets, admin UI, AppActor switch, or RLS rewrites.

### PR 3: Backfill Current Roles Into RBAC

Populate `user_roles` from `profiles.role`, seed default `role_permissions`, and add validation SQL. Do not switch runtime to RBAC yet.

### PR 4: AppActor RBAC Compatibility Layer

Expose RBAC-derived permissions/scopes in `AppActor` while preserving legacy actor fields and compatibility checks.

### PR 4A: Early Teacher Preview Guard

Block new fake-student writes in teacher preview/student-like flows. Do not add demo tables or redesign preview UX.

### PR 5: Permission-Based Menu/Route Pilot

Use `settings/profile` or a small content/blog admin subsection as the pilot. Do not use CRM as the first pilot.

### PR 6: Broader Menu/Route/API Permission Alignment

Expand permission-driven access after the pilot. Do not include RLS policy rewrites or service-role reduction.

### PR 7: RLS Helper Functions + Indexes

Add tested helpers and indexes. Do not rewrite broad policies yet.

### PR 8A: P0-A RLS

Secure RBAC tables, identity tables, teacher scope, and core student private data.

### PR 8B: P0-B RLS

Secure homework, schedule, attendance/outcomes, billing and payment core.

### PR 9A: CRM RLS

Move CRM from role-based policies to permission/scope policies after the low-risk pilot and P0 RLS are stable.

### PR 9B: Search/Notifications/Content/Secondary Domains

Harden search, notifications, teacher dossiers, course/test content, public content, word card catalog, and secondary settings.

### PR 10: Service Role Reduction Pass

Reduce only proven service-role candidates after matching RLS policies and tests exist.

## Decision Log

| Decision | Final choice | Revisit trigger |
| --- | --- | --- |
| `profiles.role` | Keep as-is physically; treat as compatibility field | After AppActor/RLS no longer depend on it |
| `user_permissions` | Do not add in first DB PR | Real need for individual overrides and audit UI |
| `deny` | Defer | Need to restrict broad role defaults |
| Permission presets | Defer | Need multiple staff templates |
| Teacher preview | No saved progress now | Product requires persistent demo progress |
| Teacher demo storage | No tables now; prefer `teacher_demo_*` later | Demo persistence becomes required |
| Admin vs manager | Separate roles with possible overlapping permissions | Permission divergence needed |
| First pilot domain | Settings/profile or small content subsection | Pilot passes and access matrix is stable |
| RLS P0 split | P0-A identity/core, P0-B operational/financial | Helpers and indexes verified |
| Service role cleanup | After RLS rollout | Domain policies are tested |
| Search access | Access layer/RPC, not `search.ui` security | Search private-data leakage is addressed |

## Guardrails

- Do not mix DB schema, AppActor runtime switch, and RLS rewrite in one PR.
- Do not mix teacher preview UX redesign with real student data guards.
- Do not use CRM as the first menu/route permission pilot.
- Do not reduce service-role usage in the same PR that introduces new RLS policies.
- Do not add `user_permissions` or `deny` to the initial RBAC schema.
- New protected API routes must call `requirePermission()` before side effects.
- New service-role call sites must be added to `docs/service-role-inventory.md`.
