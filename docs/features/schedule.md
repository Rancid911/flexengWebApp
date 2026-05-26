# Schedule

Status: current  
Audience: engineers, product maintainers, teachers, support/admin operators, security reviewers  
Owner area: schedule  
Last reviewed: 2026-05-25  
Source of truth: feature summary; current code/tests remain implementation source  
Related code: `app/(workspace)/(shared-zone)/schedule/page.tsx`, `app/api/schedule/`, `features/schedule/`, `lib/schedule/`, `lib/teacher-workspace/`  
Related tests: `tests/unit/schedule-routes.test.ts`, `tests/unit/schedule-page.test.tsx`, `tests/unit/schedule-client.test.tsx`, `tests/unit/schedule-utils.test.ts`, `tests/unit/teacher-workspace-routes.test.ts`, `tests/unit/teacher-lesson-followup-service.test.ts`

## Overview

Schedule manages lesson lists, filters, lesson create/update/cancel flows and lesson follow-up data. Students see their own schedule, teachers see assigned student lessons, and staff/admin users can operate across all students/teachers according to permissions.

Global access rules are documented in `docs/access-control/README.md`, `docs/access-control/permissions.md`, `docs/access-control/guards.md`, `docs/access-control/request-context.md`, `docs/access-control/rls-rpc.md`, `docs/access-control/service-role.md`, `docs/access-control/storage-media.md` and `docs/access-control/verification-status.md`. The ScheduleActor boundary is documented in `docs/schedule-actor-permission-boundary.md`.

## User Flows

- Student opens `/schedule` and sees own lessons.
- Teacher opens `/schedule` and sees assigned-scope lessons and teacher-scoped filters.
- Staff/admin opens `/schedule` and sees all-scope operational schedule controls.
- Authorized users can filter by date/status/student/teacher where scope allows.
- Authorized staff/teachers can create, update or cancel lessons when `schedule.manage` and scope checks allow.
- Teachers record attendance/outcome follow-up through schedule follow-up APIs.

## Routes And UI

- `/schedule` is the shared schedule page guarded by `requireWorkspaceRouteAccess("schedule")`.
- `features/schedule/server/schedule-route.tsx` renders role-specific schedule data.
- `app/(workspace)/(shared-zone)/schedule/loading.tsx` provides the route-level skeleton.
- Schedule UI has local filter and drawer loading states for client interactions.
- Teacher student profile schedule tabs reuse teacher/student route boundaries rather than making schedule route groups authorization boundaries.

## APIs And Server Actions

| Endpoint | Method | Classification | Notes |
| --- | --- | --- | --- |
| `/api/schedule` | GET | protected | Requires `schedule.view`; validates filters; returns schedule page data. |
| `/api/schedule` | POST | protected mutation | Requires `schedule.manage`; validates lesson payload; creates lesson. |
| `/api/schedule/[id]` | PATCH | protected mutation | Requires `schedule.manage`; validates update payload. |
| `/api/schedule/[id]` | DELETE | protected mutation | Requires `schedule.manage`; cancels lesson. |
| `/api/schedule/options` | GET | protected | Requires `schedule.view`; returns filter catalog within actor scope. |
| `/api/schedule/[id]/attendance` | POST | protected mutation | Requires `schedule.followups.manage`; validates teacher follow-up payload. |
| `/api/schedule/[id]/outcome` | GET | protected | Requires `schedule.followups.read`; returns follow-up detail. |
| `/api/schedule/[id]/outcome` | POST/PATCH | protected mutation | Requires `schedule.followups.manage`; upserts follow-up detail. |
| `/api/schedule/followup-test-options` | GET | protected | Requires `schedule.followups.manage`; validates `studentId`. |

## Data Model

Key tables and concepts:

- `student_schedule_lessons`: scheduled lesson rows, student/teacher references, times and status.
- Attendance/outcome tables are loaded through schedule/teacher-workspace repositories.
- Student and teacher label resolution is scope-aware.
- Teacher assigned scope comes from linked teacher identity and accessible student ids.
- Schedule repositories use user-scoped Supabase clients for reads and mutations after guards.

## Access Control

- Page access uses `requireWorkspaceRouteAccess("schedule")`.
- API reads require `schedule.view`.
- Lesson create/update/cancel requires `schedule.manage`.
- Follow-up reads and writes use `schedule.followups.read` and `schedule.followups.manage`.
- `ScheduleActor.accessMode` is the data/scope boundary:
  - `student_own`: own student schedule.
  - `teacher_assigned`: assigned student schedule through linked teacher scope.
  - `staff_all`: all-scope operational schedule.
- `ScheduleActor.role` remains UI/DTO compatibility metadata and is not the service data/scope branch.
- Direct URL access is guarded; hidden navigation is not security.

## State And Lifecycle

- Lesson status supports active/cancelled/completed-style operational states through schedule types and status filters.
- Lessons can be created, updated and cancelled through guarded APIs.
- Attendance/outcome follow-up is stored after lesson/follow-up guards and payload validation.
- A lesson can only be marked completed when timing rules allow it.

## Integrations

- Teacher workspace follow-up services provide attendance/outcome detail.
- Billing can consume schedule lesson data for lesson-charge behavior.
- Homework/test options can be suggested from follow-up flows.
- Supabase user-scoped repositories and RLS/RPC are part of the database boundary.

## Loading And Errors

- Route-level loading should match the schedule page layout.
- Filter/search interactions remain local client loading.
- Invalid filters or lesson payloads return validation errors.
- Scope violations return schedule-style forbidden errors before service side effects.

## Tests

Current focused coverage includes:

- Schedule route guard and mutation tests.
- Schedule page/client utility tests.
- Teacher workspace route/follow-up tests.
- Security boundary matrix and workspace read-route RBAC tests.

Coverage gaps:

- Browser/e2e coverage for drawer interactions and filter transitions is useful but not required by this doc PR.
- Live RLS matrix remains separate verification.

## Operations

- For data-scope bugs, inspect `ScheduleActor.accessMode`, `studentId`, `teacherId` and `accessibleStudentIds`.
- For mutation failures, confirm `schedule.manage` or follow-up permissions and payload validation before investigating repositories.
- For teacher scope issues, verify linked teacher identity and assigned student scope, not `profiles.role`.

## Known Limitations

- `ScheduleActor.role` still exists for UI/DTO compatibility.
- Some schedule-related student profile sections live in teacher-workspace modules.
- Further cleanup may remove role-shaped DTO metadata after UI consumers are migrated.
