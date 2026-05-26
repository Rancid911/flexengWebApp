# ScheduleActor Permission Boundary

Status date: 2026-05-24

`ScheduleActor` is a transitional data/scope actor. It carries an explicit `accessMode` plus the resolved workspace role metadata, linked student, linked teacher, and assigned-student scope for existing schedule, billing, homework, placement, and teacher-workspace services. It is not the primary authorization source for protected routes.

For the broader current access-control model and intentional compatibility layers, start with `docs/access-control-current-state.md`.

## Boundary rule

Page and API entrypoints must make the canonical permission decision before using `ScheduleActor` for data loading or service scope. Schedule service/data branching now uses `ScheduleActor.accessMode` (`student_own`, `teacher_assigned`, `staff_all`) to choose query shape and enforce student/teacher/staff data scope. `ScheduleActor.role` remains compatibility/UI/DTO metadata and must not be treated as a replacement for `can()`, `requirePermission()`, `requireAdminPagePermission()`, or workspace route guards.

## Current entrypoints

| Entrypoint | Guard before `ScheduleActor` service/data use | Current `ScheduleActor` use |
| --- | --- | --- |
| `/schedule` page | `requireWorkspaceRouteAccess("schedule")` | Schedule page query scope and filters |
| `/api/schedule` and `/api/schedule/[id]` | `schedule.view` / `schedule.manage` through `requirePermission()` | Schedule read/write service scope |
| `/api/schedule/[id]/outcome`, `/api/schedule/[id]/attendance`, `/api/schedule/followup-test-options` | `schedule.followups.read` / `schedule.followups.manage` through `requirePermission()` | Follow-up read/write service scope |
| `/admin/students/[studentId]` | `requireAdminPagePermission("students.view")` | Existing student profile loader scope |
| `/admin/students/[studentId]/schedule`, `/homework`, `/notes`, `/mistakes` | `requireAdminPagePermission("students.view")` | Existing detail section loader scope |
| `/students` and `/students/[studentId]` teacher mirror pages | `requireWorkspaceRouteAccess("students")` | Teacher-scoped data rendering; staff actors render in place without admin-path redirect |
| `/api/students/[id]/billing` | `billing.view` / `billing.adjust` through `requirePermission()` | Billing summary and settings service scope |
| `/api/students/[id]/homework-assignments` | `homework.assign` through `requirePermission()` | Standalone homework assignment service scope |
| `/api/students/[id]/placement-assignment` | `learning.placement.assign` through `requirePermission()` | Placement homework assignment service scope |
| `/api/students/[id]/teacher-notes` and `/api/teacher-notes/[id]` | `students.notes.write` through `requirePermission()` | Note write service scope and note ownership checks |

## Known transitional behavior

- `ScheduleActor.accessMode` is used by schedule services to choose student, teacher, or staff data shape.
- `ScheduleActor.role` is still returned where current UI/DTO consumers expect the role-shaped field, but new data/scope decisions should use `accessMode` helpers instead of raw role comparisons.
- Staff actors can render teacher mirror `/students...` paths in place after workspace route access. Those paths should not force a canonical redirect to `/admin/students...`.
- Student actors are denied from staff/teacher student detail paths before private student data loaders expose records.
- A later cleanup can remove `ScheduleActor.role` after UI/DTO consumers stop requiring it, but that should be a separate compatibility-removal PR.

## Regression expectations

- Admin student pages deny missing `students.view` before `requireSchedulePage()` or profile/detail loaders run.
- Schedule APIs deny missing `schedule.*` / `schedule.followups.*` before request body parsing or service calls.
- Student billing, homework, placement, and notes APIs deny missing canonical/runtime permissions before service calls.
- Teacher mirror routes keep permissioned in-place rendering and do not reintroduce cross-zone redirects.
