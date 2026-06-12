# Teacher Preview Write-Surface Audit

For the broader current access-control model and intentional compatibility layers, start with `docs/access-control-current-state.md`.

Teacher preview/demo is read/demo only. A teacher-primary or teacher-linked actor must not become a real student just because a preview `studentId` is present.

## Current Decision

`profileRole` is legacy/display/diagnostic metadata. It may still appear in profile DTOs, forms, tests, or audit/debug output, but it must not grant student write access. Older role-based documentation for the real-student write boundary is obsolete.

The current real-student write boundary is identity/link based:

```ts
actor.isStudent && Boolean(actor.studentId) && !actor.isTeacher
```

`requireRealStudentWriteContext(...)` is the canonical route/service helper for real student-owned write paths. `getCurrentRealStudentWriteContext(...)` wraps the same boundary for services that resolve the current actor internally.

This boundary means:

- the actor must be linked as a student;
- a concrete `studentId` must be resolved;
- teacher-primary or teacher-linked actors are denied for real student write paths;
- domain-specific permissions still apply where the route/service requires them.

## Verified Real-Student-Only Surfaces

| Surface | Status | Write behavior | Guard / evidence | Teacher preview can write real data? |
| --- | --- | --- | --- | --- |
| Practice attempts, answers, mistakes | Verified safe | Atomically creates `student_test_attempts` with its `student_test_answers`, then may update `student_mistakes` and homework progress. | `/api/practice/attempts` calls `requireRealStudentWriteContext(...)` and `requirePermission(..., "practice.attempts.submit")` before parsing; `practice-attempts.service.ts` repeats the real-student guard before activity loading or infrastructure creation. The authenticated RPC independently derives the student from `auth.uid()`, requires `homework.submit:own`, and rejects teacher-linked identities. Focused service and SQL smoke coverage verify denial before projections. | No |
| Word session completion | Verified safe | Persists `student_words` and `student_word_reviews`. | `/api/words/sessions/complete` calls `requireRealStudentWriteContext(...)` and `requirePermission(..., "word_cards.train")`; `completeWordSession(...)` calls `getCurrentRealStudentWriteContext(...)`. Tests cover teacher-primary actors with linked student rows denied before completion. | No |
| Current student write context | Verified safe | Provides the canonical `{ userId, studentId }` write context. | `requireRealStudentWriteContext(...)` requires `isStudent`, `studentId`, and `!isTeacher`. Tests cover real student allow and teacher-primary preview denial. | No |
| Student-facing payment list, checkout, status | Verified safe | Reads payment history/status and creates/syncs student payment transactions through student self-service routes. | Payment routes require RBAC-backed student self-service permissions such as `payments.view`, `payments.checkout.create`, and `payments.status.read`; tests cover teacher-preview denial before provider calls or transaction sync services. | No |
| Profile settings birth-date fallback | Verified safe | Legacy fallback may write `students.birth_date` only when the profile table lacks `birth_date`. | `canWriteStudentBirthDateFallback(...)` uses `actor.isStudent && Boolean(actor.studentId) && !actor.isTeacher`. Tests cover teacher-primary profile updates not creating/updating `students` rows. | No |
| Homework submit/progress through practice | Verified safe for reviewed path | Practice submission can update owned homework/progress state. | Covered by `practice.attempts.submit` / `homework.submit` permission alignment plus the real-student write context in `practice-attempts.service.ts`; one user-scoped client is shared with the existing homework synchronization service. | No |

## Staff / Teacher Operational Writes

These are not teacher preview writes. They are operational workflows with their own route guards, scope checks, and RLS:

- assigned homework creation and linked homework updates;
- teacher notes;
- schedule create/update/cancel;
- lesson follow-up attendance/outcome/homework/lesson charge workflow;
- admin/user management writes;
- billing/admin adjustments;
- provider webhooks.

These paths must remain documented and tested as operational permission/scope boundaries, not as student preview/demo writes.

## Out Of Scope / Future Review

| Surface | Classification | Reason |
| --- | --- | --- |
| Demo persistence tables | Out of scope | Not implemented; this doc sync does not add fake/demo storage. If persistent demo progress is needed, prefer separate demo-owned tables and a separate reviewed product decision. |
| Direct student-facing homework write APIs outside practice | Future review | No additional direct student homework write route was reviewed in this pass. Add the canonical real-student write context before introducing one. |
| Student favorites | Future review | Public UI links exist, but this pass did not verify a current mutation route. Any future favorite write must use real-student context or a reviewed alternative. |
| Enrollments / lesson progress | Future review | No active student-preview write path was verified here. Treat new writes as real student-owned data until proven otherwise. |
| Analytics/student lists | Out of scope | Preview/demo visibility in aggregate lists is a separate read-model concern, not a write-surface boundary in this document. |

## Required Future Rules

Any new API or service that writes real student-owned progress, billing, profile fallback, favorites, enrollment, or learning state must either:

- call `requireRealStudentWriteContext(...)` or `getCurrentRealStudentWriteContext(...)` before DB/provider side effects; or
- document why the write is a staff/teacher operational workflow and enforce its own permission/scope checks.

Future PR guardrails:

- Do not use `profileRole` for student write authorization.
- Do not let teacher preview/demo flows create or update real student-owned data.
- Keep teacher preview/demo read-only or demo-only unless a separate reviewed product decision introduces demo persistence.
- Keep route/API/service guards independent from UI preview controls.
- Keep domain permission checks in addition to the real-student write context where the route requires them.
