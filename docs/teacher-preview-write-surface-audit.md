# Teacher Preview Write-Surface Audit

Teacher preview/demo is read/demo only. A teacher-primary actor must not become a real student just because a preview `studentId` is present.

The current real-student write boundary is:

```ts
actor.isStudent && Boolean(actor.studentId) && actor.profileRole === "student"
```

`getCurrentRealStudentWriteContext(...)` remains the canonical helper for student progress writes.

## Verified Real-Student-Only Surfaces

| Surface | Status | Guard / evidence |
| --- | --- | --- |
| Practice attempts, answers, mistakes | Guarded | `submitPracticeTestAttempt(...)` calls `getCurrentRealStudentWriteContext(...)` before loading tests or creating `student_test_attempts`, `student_test_answers`, or `student_mistakes`. |
| Word session completion | Guarded | `completeWordSession(...)` calls `getCurrentRealStudentWriteContext(...)` before touching `student_words` or `student_word_reviews`. |
| Current student write context | Guarded | Tests cover real student, teacher-primary preview denial, and explicit real dual-role behavior. |
| Student-facing payment list, checkout, status | Guarded | Route permissions deny teacher-primary preview actors before payment loaders, provider calls, or transaction sync services. |
| Profile settings birth-date fallback | Guarded | The legacy fallback that writes `students.birth_date` is now real-student-only; teacher-primary profile updates do not create/update `students` rows. |

## Staff / Teacher Operational Writes

These are not teacher preview writes. They are operational workflows with their own route guards, scope checks, and RLS:

- assigned homework creation and linked homework updates;
- teacher notes;
- schedule create/update/cancel;
- lesson follow-up attendance/outcome/homework/lesson charge workflow;
- admin/user management writes.

## Out Of Scope For This PR

| Surface | Reason |
| --- | --- |
| Demo persistence tables | Not implemented; this PR does not add fake/demo storage. |
| Student favorites / enrollments / lesson progress | No active student-facing write API was identified in this PR’s tested route set; add a real-student-only guard before introducing one. |
| Billing/admin adjustments | Staff/admin operational workflow, not teacher preview. |
| Provider webhooks | System/provider boundary, not actor preview. |

## Required Future Rule

Any new API or service that writes real student-owned progress or payment state must either:

- call `getCurrentRealStudentWriteContext(...)` before DB/provider side effects; or
- document why the write is a staff/teacher operational workflow and enforce its own permission/scope checks.
