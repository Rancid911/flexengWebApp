# Dashboard

Status: current  
Audience: engineers, product maintainers, support, security reviewers  
Owner area: dashboard  
Last reviewed: 2026-05-25  
Source of truth: feature summary; current code/tests remain implementation source  
Related code: `app/(workspace)/(shared-zone)/dashboard/page.tsx`, `app/api/admin/dashboard/metrics/route.ts`, `features/dashboard/`, `lib/dashboard/`, `lib/admin/dashboard-metrics.ts`, `lib/teacher-workspace/queries.ts`  
Related tests: `tests/unit/dashboard-page.test.tsx`, `tests/unit/student-dashboard-route.test.tsx`, `tests/unit/student-dashboard.test.ts`, `tests/unit/student-dashboard-view.test.tsx`, `tests/unit/teacher-dashboard-view.test.tsx`, `tests/unit/admin-dashboard-metrics.test.ts`, `tests/unit/admin-dashboard-metrics-server.test.ts`, `tests/unit/dashboard-cache.test.ts`

## Overview

The dashboard is the authenticated workspace landing surface. It routes users into role-specific summaries: student progress and next actions, teacher schedule/roster context, admin metrics, and a lightweight staff/manager view.

Global documentation lives in `docs/README.md`, `docs/access-control/README.md`, `docs/access-control/permissions.md`, `docs/access-control/guards.md`, `docs/access-control/request-context.md`, `docs/access-control/rls-rpc.md` and `docs/access-control/verification-status.md`.

## User Flows

- Students open `/dashboard` and see homework, placement, practice, words, schedule preview and payment reminder context.
- Teachers open `/dashboard` and see today/week lessons, attention queue and roster summary when their teacher profile is linked.
- Admin users open `/dashboard` and see admin metrics from the dashboard metrics RPC.
- Manager/staff users without a specialized branch see the staff dashboard shell.

## Routes And UI

- `/dashboard` renders `renderDashboardRoute()` and branches by `resolveDefaultWorkspace(actor)`.
- `app/(workspace)/(shared-zone)/dashboard/loading.tsx` provides the dashboard route fallback.
- Student dashboard sections use Suspense for secondary recommendation, schedule and summary data.
- Teacher dashboard uses Suspense for attention queue and roster sections.

## APIs And Server Actions

| Endpoint | Method | Classification | Notes |
| --- | --- | --- | --- |
| `/api/admin/dashboard/metrics` | GET | protected admin | Requires `roles.view`; returns `admin_dashboard_metrics` output. |

Student and teacher dashboard data is primarily loaded by server routes and query modules rather than a dashboard-specific public API.

## Data Model

Dashboard data is assembled from existing domain tables:

- Student: `student_lesson_progress`, `student_test_attempts`, `student_course_enrollments`, homework assignments, `student_words`, schedule preview data and payment reminder RPC data.
- Teacher: schedule lessons and assigned-student roster/attention queries.
- Admin: `admin_dashboard_metrics(timestamptz)` RPC.
- Payment reminder widgets link to billing/reminder state documented in `docs/features/payments-billing.md`.

## Access Control

- `/dashboard` requires the shared authenticated workspace layout/request context.
- Dashboard branch selection is based on the resolved `AppActor` workspace, not `profiles.role` authorization.
- Admin metrics API is guarded by `requireAdminApiPermission("roles.view")`.
- Student dashboard loaders use current student identity/scope helpers and user-scoped Supabase queries.
- Teacher dashboard data is loaded through `ScheduleActor`/teacher scope helpers. See `docs/features/schedule.md`.
- Navigation visibility is UX only; direct page/API guards remain authoritative.

## State And Lifecycle

- Student dashboard splits initial core data from deferred secondary data to keep the initial page responsive.
- Payment reminder state is loaded separately from the core student dashboard loader.
- Teacher dashboards tolerate an unlinked teacher profile by rendering an empty linked-profile state.
- Admin dashboard metrics can fail without preventing the admin dashboard shell from rendering.

## Integrations

- Supabase is used through server query modules and the admin metrics RPC.
- Schedule, homework/practice, words, billing and students/teachers feature data is summarized rather than owned by the dashboard.
- Workspace shell utilities such as global search and notifications are documented in their own feature docs.

## Loading And Errors

- The route-level dashboard skeleton should match dashboard layout and stay inside the shared workspace content area.
- Section Suspense fallbacks are local and should not duplicate full-page skeletons.
- Admin metrics failures render the admin dashboard with `initialMetrics: null`.
- Missing optional student dashboard schema is handled defensively in several loaders, but live DB verification remains separate.

## Tests

Current focused coverage includes:

- Dashboard workspace branch selection.
- Student dashboard route/data assembly and view rendering.
- Teacher dashboard view rendering.
- Admin dashboard metrics route/server behavior.
- Dashboard cache and shell overlay behavior.

Coverage gaps:

- Browser-level verification for every role-specific dashboard route remains manual/e2e follow-up.
- Live DB RPC/RLS behavior is not proven by unit tests.

## Operations

- For student dashboard issues, inspect `lib/dashboard/student-dashboard.ts` and related domain loaders first.
- For admin metric failures, verify `admin_dashboard_metrics` grants/hardening and run the RPC hardening smoke where appropriate.
- For visible loading regressions, use `docs/workspace-loading-skeleton-contract.md`.

## Known Limitations

- Dashboard is an aggregator; feature-specific data ownership stays in schedule, homework/practice, words, billing, students/teachers and admin docs.
- Staff/manager dashboard remains lightweight compared with student/teacher/admin dashboards.
- Full production confidence requires live DB smoke where RPC/RLS behavior is involved.
