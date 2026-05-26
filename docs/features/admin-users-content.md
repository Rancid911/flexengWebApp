# Admin, Users And Content

Status: current  
Audience: engineers, admins, operations, security reviewers  
Owner area: admin-users-content  
Last reviewed: 2026-05-25  
Source of truth: feature summary; current code/tests remain implementation source  
Related code: `app/(workspace)/(staff-zone)/admin/`, `app/api/admin/`, `features/admin/`, `lib/admin/`, `lib/permissions/registry.ts`  
Related tests: `tests/unit/admin-auth.test.ts`, `tests/unit/admin-page.test.tsx`, `tests/unit/admin-users-route.test.ts`, `tests/unit/admin-users-list.test.tsx`, `tests/unit/admin-tests-route.test.ts`, `tests/unit/admin-blog-routes.test.ts`, `tests/unit/admin-blog-service.test.ts`, `tests/unit/admin-course-modules-route.test.ts`, `tests/unit/admin-word-card-sets.test.ts`, `tests/unit/admin-client-access-markers.test.ts`, `tests/unit/admin-audit.test.ts`

## Overview

Admin/users/content covers the admin console, user CRUD, teacher/student admin surfaces, blog/content management, tests/course modules and word card set management. It is a high-risk area because it includes cross-user operations, destructive mutations, content publishing and Supabase Auth admin operations.

Global access rules are documented in `docs/access-control/README.md`, `docs/access-control/permissions.md`, `docs/access-control/guards.md`, `docs/access-control/request-context.md`, `docs/access-control/rls-rpc.md`, `docs/access-control/service-role.md`, `docs/access-control/storage-media.md` and `docs/access-control/verification-status.md`.

## User Flows

- Admin/staff opens `/admin` and sees only sections permitted by RBAC.
- Admin lists, creates, updates or deletes users.
- Admin opens student/teacher directories and profile pages.
- Admin manages test materials, placement metadata, course modules, blog categories/tags/posts and word card sets.
- Admin notification and payments sections are documented in their own feature docs.

## Routes And UI

- `/admin` is guarded by `requireAdminPageAnyPermission(["users.view", "content.manage", "notifications.manage", "word_cards.manage"])`.
- `/admin/students` and `/admin/students/[studentId]` use student admin routes.
- `/admin/teachers` and `/admin/teachers/[teacherId]` use teacher admin routes.
- `/admin/payments` is documented in `docs/features/payments-billing.md`.
- Admin console tabs and drawers are client UI; visibility in the admin UI does not imply permission.
- Route-level admin loading exists at `app/(workspace)/(staff-zone)/admin/loading.tsx`.

## APIs And Server Actions

| Endpoint group | Methods | Classification | Notes |
| --- | --- | --- | --- |
| `/api/admin/users`, `/api/admin/users/[id]` | GET/POST/PATCH/DELETE | protected admin | `users.view` for list; `users.manage` for create/update/delete. |
| `/api/admin/users/teacher-options` | GET | protected admin | Teacher option lookup for admin flows. |
| `/api/admin/tests`, `/api/admin/tests/[id]` | GET/POST/PATCH/DELETE | protected admin | Requires `content.manage`. |
| `/api/admin/blog/*` | GET/POST/PATCH/DELETE | protected admin | Requires `content.manage` for categories, tags and posts. |
| `/api/admin/course-modules*`, `/api/admin/courses/options` | GET/POST | protected admin | Requires `content.manage`. |
| `/api/admin/word-card-sets*` | GET/POST/PATCH/DELETE | protected admin | Requires `word_cards.manage`. |
| `/api/admin/dashboard/metrics` | GET | protected admin | Guarded admin metric read path. |
| `/api/admin/teachers/[teacherId]/dossier/*` | PATCH | protected admin mutation | Teacher dossier section updates. |

## Data Model

Key areas:

- Supabase Auth users plus `profiles`.
- Linked `students` and `teachers` rows for academic identity.
- RBAC tables for roles/permissions.
- Blog tables: posts, categories, tags and joins.
- Course/module/test tables and nested questions/options.
- Word card sets/items.
- `audit_log` records selected admin operations.

## Access Control

- Admin pages and APIs use permission-aware guards from `lib/admin/auth.ts`.
- User list/read uses `users.view`; user create/update/delete uses `users.manage`.
- Content/blog/tests/course modules use `content.manage`.
- Word cards use `word_cards.manage`.
- Teacher/student directory/profile access uses `teachers.view` and `students.view`.
- Destructive operations require stronger management permissions and validation.
- Admin UI visibility is not security; each API route must guard independently.
- Supabase Auth admin create/update/delete uses a service-role auth admin exception allowlisted in `docs/service-role-inventory.md`.

## State And Lifecycle

- User creation creates Auth user, profile row and role-specific linked rows where needed.
- User update may update profile, Auth email/password, student details, assigned teacher and billing settings.
- User delete removes linked rows/profile and then Auth user.
- Admin test lifecycle must account for existing attempts before destructive question edits.
- Blog/content rows have publish/public visibility rules owned by content management and public blog routes.
- Audit writes record selected admin create/update/delete actions.

## Integrations

- Supabase Auth admin API for user account lifecycle.
- Supabase database tables for profiles, linked student/teacher details and content.
- Audit logging through `lib/admin/audit.ts`.
- Payments, notifications and CRM admin surfaces link to their own feature docs.

## Loading And Errors

- Admin console uses tab-level and drawer-level loading states.
- API validation errors use `VALIDATION_ERROR` responses before writes.
- Role changes are intentionally constrained; user update rejects direct role mutation.
- Auth admin failures and table write failures return typed admin errors.

## Tests

Current focused coverage includes:

- Admin auth guard tests.
- Admin users route/list tests.
- Admin test/blog/course module/word card route and service tests.
- Admin console UI and snapshot-style tests.
- Admin client access marker and architecture checks for service-role usage.
- Audit tests.

Coverage gaps:

- Full browser e2e for all admin drawer workflows can be added later.
- Live DB policy verification is separate from unit/admin route tests.

## Operations

- For user creation/update failures, inspect Auth admin result, profile write, linked student/teacher rows and cache invalidation.
- For content/test failures, inspect validation errors and whether existing attempts block edits.
- For new privileged admin operations, update service-role inventory and architecture checker before merge.
- Do not use `profiles.role` as an authorization shortcut; role-like form fields are profile metadata/defaults unless backed by RBAC.

## Known Limitations

- Admin console groups many domains in one UI; feature-specific docs should own deeper product behavior.
- Auth admin service-role operations remain a final exception because Supabase Auth admin API requires privileged credentials.
- Role/permission management documentation remains in access-control docs rather than this feature doc.
