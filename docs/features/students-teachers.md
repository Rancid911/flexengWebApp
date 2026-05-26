# Students And Teachers

Status: current  
Audience: engineers, product maintainers, academic operations, security reviewers  
Owner area: students-teachers  
Last reviewed: 2026-05-25  
Source of truth: feature summary; current code/tests remain implementation source  
Related code: `app/(workspace)/(staff-zone)/admin/students/`, `app/(workspace)/(staff-zone)/admin/teachers/`, `app/(workspace)/(teacher-zone)/students/`, `app/api/students/`, `app/api/teacher-notes/`, `features/students/`, `features/teacher-workspace/`, `features/admin/`, `lib/students/`, `lib/teacher-workspace/`, `lib/admin/teacher-profile.ts`  
Related tests: `tests/unit/admin-students-page.test.tsx`, `tests/unit/admin-student-profile-page.test.tsx`, `tests/unit/admin-teachers-page.test.tsx`, `tests/unit/admin-teacher-profile-page.test.tsx`, `tests/unit/teacher-students-page.test.tsx`, `tests/unit/teacher-student-profile-page.test.tsx`, `tests/unit/teacher-workspace-routes.test.ts`, `tests/unit/current-student.test.ts`, `tests/unit/security-boundary-matrix.test.ts`

## Overview

Students/teachers covers staff directories, teacher assigned-student views, student profile sections, teacher notes, homework assignment, placement assignment and teacher dossier pages. It is the main identity-and-scope feature area for academic operations.

Global access rules are documented in `docs/access-control/README.md`, `docs/access-control/permissions.md`, `docs/access-control/guards.md`, `docs/access-control/request-context.md`, `docs/access-control/rls-rpc.md`, `docs/access-control/service-role.md`, `docs/access-control/storage-media.md` and `docs/access-control/verification-status.md`. Teacher preview write safety is documented in `docs/teacher-preview-write-surface-audit.md`.

## User Flows

- Staff/admin opens `/admin/students` and `/admin/teachers` to browse all-scope directories.
- Staff/admin opens individual student or teacher profile pages.
- Teacher opens `/students` to see assigned students.
- Teacher opens `/students/[studentId]` and related tabs for assigned student detail, homework, notes, schedule and mistakes.
- Staff can use `/students` as a convenience route that falls back to admin-style all-student behavior when the actor has staff access.
- Student-owned write flows such as practice attempts are outside this feature doc but use the real-student write boundary documented separately.

## Routes And UI

- `/admin/students` and `/admin/students/[studentId]` are staff/admin routes.
- `/admin/teachers` and `/admin/teachers/[teacherId]` are staff/admin routes.
- `/students` and `/students/[studentId]` are teacher workspace routes with staff fallback behavior.
- Student profile tabs include homework, notes, schedule and mistakes under both staff and teacher route trees.
- Route-level loading exists for teacher students directory/detail and admin/staff high-impact routes.
- Directory search and pagination are client UI concerns after server-side guarded loading.

## APIs And Server Actions

| Endpoint | Method | Classification | Notes |
| --- | --- | --- | --- |
| `/api/students/[id]/teacher-notes` | POST | protected mutation | Requires `students.notes.write` scoped to `studentId`; validates note payload. |
| `/api/teacher-notes/[id]` | PATCH/DELETE | protected mutation | Requires `students.notes.write`; updates/deletes existing note through scoped service. |
| `/api/students/[id]/homework-assignments` | GET/POST | protected | Requires `homework.assign` scoped to `studentId`; lists or creates standalone homework. |
| `/api/students/[id]/placement-assignment` | POST/DELETE | protected mutation | Requires `learning.placement.assign` scoped to `studentId`. |
| `/api/students/[id]/billing` | GET/PATCH | protected | Billing-specific; see `docs/features/payments-billing.md`. |
| `/api/students/[id]/billing/adjustments` | POST | protected mutation | Billing-specific; see `docs/features/payments-billing.md`. |
| `/api/admin/teachers/[teacherId]/dossier/*` | PATCH | protected mutation | Requires teacher dossier permissions through admin route guards. |
| `/api/admin/users/teacher-options` | GET | protected | Provides teacher option data for admin workflows. |

## Data Model

Key tables/concepts:

- `profiles`: user profile metadata; `profiles.role` is display/default/diagnostic only.
- `students`: linked student identity and academic fields.
- `teachers`: linked teacher identity.
- Teacher/student relationship data drives assigned student scope.
- Teacher notes, standalone homework, placement assignment and schedule/billing rows are related student-owned operational data.
- Teacher dossiers store staff-managed teacher profile sections.
- RBAC tables (`roles`, `permissions`, `user_roles`, `role_permissions`) grant access; linked identity alone is not a permission grant.

## Access Control

- Student identity and teacher identity are not permission grants.
- Teacher assigned access requires linked teacher identity plus assigned student scope.
- Staff/admin all-scope access requires RBAC permissions such as `students.view:all`, `teachers.view:all` or management equivalents.
- Admin student directory/profile pages use `students.view`.
- Admin teacher directory/profile pages use `teachers.view`.
- Teacher workspace student routes use `requireWorkspaceRouteAccess("students")` plus schedule/teacher workspace scope checks.
- Notes, homework and placement APIs require feature-specific permissions scoped to the target student.
- Teacher preview/demo mode must not write real student-owned data; see `docs/teacher-preview-write-surface-audit.md`.

## State And Lifecycle

- Student and teacher rows link application users to academic identities.
- Assigned student scope controls teacher visibility.
- Notes can be created, updated and deleted by authorized staff/teachers.
- Placement assignment can be assigned/cancelled.
- Homework assignment can be listed/created for a scoped student.
- Billing and schedule state are documented in their own feature docs.

## Integrations

- Schedule uses linked identities and assigned scope through `ScheduleActor.accessMode`.
- Homework/practice use student-owned and assigned-student boundaries.
- Payments/billing uses student id and billing permissions.
- Search can expose student/teacher/admin results only when domain permissions/scopes allow.

## Loading And Errors

- Directory/profile routes have page-specific skeletons where implemented.
- Unauthorized direct URL access redirects or denies through server guards before rendering private data.
- Missing student/teacher rows generally produce not-found or redirected behavior depending on route context.
- API validation errors are returned before service writes.

## Tests

Current focused coverage includes:

- Admin student/teacher directory and profile tests.
- Teacher students directory/profile tests.
- Teacher workspace route tests.
- Current-student real write boundary tests.
- Student billing/homework/placement/notes route tests.
- Security boundary matrix tests.

Coverage gaps:

- Some cross-feature profile tabs depend on schedule, homework, billing and progress coverage.
- Manual/e2e verification is useful for teacher assigned-scope navigation.

## Operations

- For teacher visibility issues, inspect linked `teacherId` and `accessibleStudentIds`.
- For student self-context bugs, inspect linked `studentId` and the real-student write boundary.
- For staff access bugs, inspect RBAC permission/scopes, not `profiles.role`.
- For stale profile labels, inspect profile/student/teacher row linkage and repository label queries.

## Known Limitations

- Teacher workspace and staff student profile routes share several profile-section loaders.
- Some route/service names remain schedule-shaped because ScheduleActor is still used as a shared scope context.
- Feature-specific write surfaces in homework/practice/progress are documented in their own or future docs.
