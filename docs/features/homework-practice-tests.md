# Homework, Practice And Tests

Status: current  
Audience: engineers, teachers, academic operations, security reviewers  
Owner area: homework-practice-tests  
Last reviewed: 2026-06-12
Source of truth: feature summary; current code/tests remain implementation source  
Related code: `app/(workspace)/(shared-zone)/homework/`, `app/(workspace)/(shared-zone)/practice/`, `app/api/practice/attempts/route.ts`, `app/api/students/[id]/homework-assignments/route.ts`, `app/api/students/[id]/placement-assignment/route.ts`, `app/api/admin/tests/`, `features/homework/`, `features/practice/`, `lib/homework/`, `lib/practice/`, `lib/students/current-student.ts`, `lib/admin/tests*`  
Related tests: `tests/unit/homework-routes.test.tsx`, `tests/unit/homework-detail-page.test.tsx`, `tests/unit/practice-library-routes.test.tsx`, `tests/unit/practice-activity-route.test.tsx`, `tests/unit/practice-attempts-atomic-migration.test.ts`, `tests/unit/practice-attempts-repository.test.ts`, `tests/unit/practice-attempts-grading-policy.test.ts`, `tests/unit/practice-attempts-infrastructure.test.ts`, `tests/unit/practice-attempts-submit.test.ts`, `tests/unit/practice-attempts-facade.test.ts`, `tests/unit/practice-attempts-api-route.test.ts`, `tests/unit/placement.test.ts`, `tests/unit/placement-test-flow.test.tsx`, `tests/unit/admin-tests-route.test.ts`, `tests/unit/student-homework-assignments-api-route.test.ts`, `tests/unit/student-placement-assignment-api-route.test.ts`, `tests/unit/current-student.test.ts`

## Overview

Homework, practice and tests cover student homework lists/details, practice catalogs, test runners, placement tests, teacher/staff assignment flows and admin-created test content. Student-owned writes are intentionally narrow: real student submissions require a real-student write context and cannot be performed through teacher preview/demo actors.

Global access rules are documented in `docs/access-control/README.md`, `docs/access-control/permissions.md`, `docs/access-control/guards.md`, `docs/access-control/request-context.md`, `docs/access-control/rls-rpc.md`, `docs/access-control/service-role.md`, `docs/access-control/storage-media.md` and `docs/access-control/verification-status.md`. Teacher preview write safety is documented in `docs/teacher-preview-write-surface-audit.md`. Related student/teacher scope is documented in `docs/features/students-teachers.md`.

## User Flows

- Student opens `/homework` and related filtered routes to see active, completed or overdue assignments.
- Student opens `/homework/[id]` to review assignment items and progress.
- Student opens `/practice`, catalog, recommendations, topics, mistakes, favorites or a specific activity.
- Student submits a practice/test attempt through `/api/practice/attempts`.
- Teacher/staff assigns standalone homework to a student from student profile workflows.
- Teacher/staff assigns or cancels placement test assignment.
- Admin creates and manages tests, questions, options and placement metadata from the admin console.

## Routes And UI

- `/homework`, `/homework/active`, `/homework/completed`, `/homework/overdue`, `/homework/[id]` are workspace routes guarded by `requireWorkspaceRouteAccess("homework")`.
- `/practice`, `/practice/catalog`, `/practice/recommended`, `/practice/topics`, `/practice/topics/[topic]`, `/practice/topics/[topic]/[subtopic]`, `/practice/mistakes`, `/practice/favorites`, `/practice/activity/[activityId]` are workspace practice routes.
- Removed legacy student aliases no longer redirect into practice; use `/practice` directly.
- Teacher/student profile homework and placement controls are documented with students/teachers.
- Practice overview uses section-level Suspense fallbacks for independent recommendation/topic cards.

## APIs And Server Actions

| Endpoint | Method | Classification | Notes |
| --- | --- | --- | --- |
| `/api/practice/attempts` | POST | protected student write | Requires real-student write context and `practice.attempts.submit`; validates attempt payload. |
| `/api/students/[id]/homework-assignments` | GET/POST | protected | Requires `homework.assign` scoped to `studentId`; lists or creates teacher/student homework. |
| `/api/students/[id]/placement-assignment` | POST/DELETE | protected mutation | Requires `learning.placement.assign` scoped to `studentId`; assigns/cancels placement homework. |
| `/api/admin/tests` | GET/POST | protected admin | Requires `content.manage`; lists or creates test material. |
| `/api/admin/tests/[id]` | GET/PATCH/DELETE | protected admin | Requires `content.manage`; loads, updates or deletes a test. |
| `/api/schedule/followup-test-options` | GET | protected | Requires `schedule.followups.manage`; returns assignable tests for schedule follow-up. |

## Data Model

Key tables/concepts:

- `homework_assignments`, `homework_items`, `homework_progress`.
- `tests`, `test_questions`, `test_question_options`.
- `student_test_attempts`, `student_test_answers`, `student_mistakes`.
- Placement metadata: `assessment_kind = placement`, scoring profile and placement bands.
- Homework progress is synchronized when a real student completes a matching test.

## Access Control

- Homework pages use `homework.view` through workspace route access.
- Assignment management uses `homework.assign` scoped to the target student.
- Placement assignment uses `learning.placement.assign`.
- Practice attempt submission requires both `requireRealStudentWriteContext(...)` and `practice.attempts.submit`.
- Real student write context is identity/link based: a linked student id and no teacher-linked actor for that write path.
- Teacher preview/demo mode is not a real-student write context and must remain read/demo-only.
- Admin test/content management uses `content.manage`.
- Direct URL and API access must be guarded server-side; UI preview controls are not security.

## State And Lifecycle

- Homework assignments move through not-started/in-progress/completed/overdue-style states.
- Homework items can reference test activities and are marked complete through progress sync.
- Practice attempts are graded and their core attempt/answer rows are committed atomically; wrong answers can then update mistakes as a post-commit projection.
- Placement attempts can produce recommended level/band summaries.
- Admin tests with existing attempts have restricted destructive edits in service logic/tests.

## Practice Attempt Architecture

- `/api/practice/attempts` delegates to `practice-attempts.service.ts`.
- The service owns real-student guarding, activity validation, persistence orchestration, homework synchronization and route revalidation.
- `practice-attempts-grading.policy.ts` owns pure answer validation, review DTO assembly, scoring, placement calculation and timestamps.
- `practice-attempts.repository.ts` owns grading-data reads, the authenticated atomic attempt RPC and mistake persistence.
- `practice-attempts.infrastructure.ts` creates one user-scoped SSR Supabase client for the repository and homework synchronization.
- `submit_practice_test_attempt` derives the student from `auth.uid()`, revalidates answers and grading from DB rows, and atomically inserts the attempt plus its complete answer set under RLS.
- The service compares authoritative RPC grading with the local pure policy before running mistakes, homework synchronization and revalidation.
- `attempts.ts` is a compatibility facade and must not regain grading or Supabase access.

## Integrations

- Schedule follow-up can create lesson-linked homework.
- Students/teachers profile pages surface homework, mistakes and placement summaries.
- Search can surface homework/practice candidates according to visibility rules.
- Progress pages consume attempts and mistakes.

## Loading And Errors

- Homework list/detail loaders are page/section scoped.
- Practice overview has local Suspense fallbacks for independent cards.
- Invalid attempts return validation errors before writes.
- Missing activities or unsupported question types return practice-specific errors.
- Non-real-student or teacher-preview attempts are denied before parsing unsafe payloads.

## Tests

Current focused coverage includes:

- Homework route and detail tests.
- Practice library/activity/test runner tests.
- Practice attempt API and submit-service tests.
- Practice attempt repository, grading policy, one-client infrastructure and facade tests.
- Placement flow and assignment API tests.
- Admin test route tests, including placement and attempt-protected edit behavior.
- Current-student write boundary tests.

Coverage gaps:

- Full e2e practice session and teacher assignment flows can be added later.
- The transactional SQL smoke covers authenticated ownership, teacher/anon denial, invalid submissions, forced answer rollback and regular/placement grading parity.

## Operations

- For student write failures, inspect `requireRealStudentWriteContext(...)`, linked student id and teacher-linked status.
- For missing homework, inspect assignment visibility, item references and student id.
- For placement issues, inspect test assessment kind, scoring profile and placement band metadata.
- For admin test edit failures, inspect whether attempts already exist for the test.

## Known Limitations

- Homework, practice, tests and progress share data but are not yet split into separate detailed docs.
- Mistake and homework updates remain soft projections and can be incomplete after partial failures.
- Valid duplicate submissions remain possible because the RPC intentionally does not add idempotency.
- Teacher follow-up homework assignment is partly owned by schedule/teacher-workspace flows.
- Demo/preview persistence is intentionally not a real student write path.
