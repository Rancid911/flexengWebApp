# ADR: Practice Attempts Boundary And Atomicity

Status: accepted  
Audience: engineers, product maintainers, security reviewers  
Owner area: practice attempts  
Last reviewed: 2026-06-12  
Source of truth: architecture decision; current code and database policies remain runtime truth  
Related code: `app/api/practice/attempts/route.ts`, `lib/practice/practice-attempts.service.ts`, `lib/practice/practice-attempts-grading.policy.ts`, `lib/practice/practice-attempts.repository.ts`, `lib/practice/practice-attempts.infrastructure.ts`  
Related tests: `tests/unit/practice-attempts-api-route.test.ts`, `tests/unit/practice-attempts-submit.test.ts`, `tests/unit/practice-attempts-grading-policy.test.ts`, `tests/unit/practice-attempts-repository.test.ts`, `tests/unit/practice-attempts-infrastructure.test.ts`

## Context

Practice attempt submission currently follows this path:

`API -> attempts.ts -> activity queries + grading -> Supabase writes -> homework sync`

The route is already a thin transport adapter, but `lib/practice/attempts.ts` combines authorization-aware orchestration, grading, Supabase access, cross-domain homework synchronization and Next.js cache invalidation.

Before any write, the current flow:

1. Requires a real-student write context for `practice.attempts.submit`.
2. Loads the activity and requires a supported test activity.
3. Validates the activity id.
4. Validates complete answers, except timeout-driven partial placement submissions.
5. Verifies that every selected option belongs to its question.
6. Loads authoritative grading data from the database.
7. Builds review DTOs, score, pass/fail status and, for placement tests, the placement summary.

These validations and grading rules must remain unchanged during the boundary extraction.

## Current Persistence Flow

Writes currently occur sequentially and without a transaction:

1. Insert `student_test_attempts`.
2. Insert `student_test_answers`.
3. Load existing `student_mistakes`, then update or insert mistake rows one question at a time.
4. Mark mistakes for correctly answered questions as resolved.
5. Upsert `student_homework_progress` and update affected homework assignment statuses.
6. Revalidate dashboard, practice, homework, progress, schedule, student and activity paths.

Attempt and answer writes are hard-failure boundaries. An attempt insert failure returns `ATTEMPT_CREATE_FAILED`; an answer insert failure returns `ATTEMPT_ANSWERS_SAVE_FAILED`.

Mistake and homework operations currently do not inspect most returned errors. They therefore behave as soft projections: failures can leave these projections incomplete without changing the successful attempt result. A boundary-only refactor must preserve this behavior rather than silently introducing new exceptions.

## Atomicity Assessment

The minimum required atomic unit is:

`student_test_attempts + student_test_answers`

An answer insert failure after the attempt insert currently leaves an attempt without its answer rows. This is the primary integrity gap.

`student_mistakes` is a derived projection of the graded result. Ideally it should be included in the same transaction. A lower-risk alternative is to update it after the core commit through an explicitly idempotent operation. The unique `(student_id, question_id)` constraint is compatible with idempotent upsert-based processing, but the current read-then-update/insert behavior must not be changed during extraction.

Homework progress is a cross-domain projection. It should remain after the core attempt commit and become independently idempotent and observable. It should not be included in the first attempt RPC because doing so would couple the practice transaction to homework assignment aggregation and broaden its failure surface.

## Decision

The runtime now uses the behavior-preserving extraction without an RPC:

`API -> practice-attempts.service -> grading policy -> practice-attempts.repository -> Supabase`

- `practice-attempts-grading.policy.ts` contains pure answer validation, review-question construction, score/pass calculation, placement calculation and attempt timestamps.
- `practice-attempts.repository.ts` contains grading-data reads, module/course lookup, attempt and answer inserts, and mistake reads/writes.
- `practice-attempts.service.ts` retains the real-student guard, activity validation, orchestration, homework synchronization, error mapping and Next.js revalidation.
- `attempts.ts` is a compatibility facade that re-exports `submitPracticeTestAttempt`.
- One user-scoped Supabase client is created for the workflow, injected into the practice repository and passed to the existing homework synchronization service.

The extraction must preserve:

- the API payload and `PracticeAttemptResult` shape;
- existing error codes and HTTP mapping;
- partial placement submissions and missing-answer grading;
- current score, pass/fail and placement-summary calculations;
- the current write order;
- hard failures for attempt/answer persistence;
- current soft-error behavior for mistakes and homework synchronization;
- current RLS-based authenticated client model.

## Future Transactional RPC

A Postgres function is recommended as a separate, explicitly approved change after the extraction. Its initial responsibility should be the atomic creation of the core attempt record and its answer rows.

The function must:

- derive or independently verify grading from authoritative test questions and options instead of trusting caller-provided `score` or `is_correct`;
- atomically create `student_test_attempts` and `student_test_answers`;
- optionally include idempotent mistake upsert/resolve only after that behavior is specified and tested;
- execute for the current authenticated actor and preserve the existing RLS ownership model without service-role bypass;
- return the identifiers and grading data required to preserve the existing API response;
- exclude Next.js revalidation;
- initially exclude homework progress and assignment-status projection.

Introducing this function changes the database contract and production failure semantics. It therefore requires a dedicated migration, RLS/grant review, repository integration, live database verification and explicit approval.

## Alternatives Considered

### Keep The Current Combined Module

This preserves behavior but leaves grading, persistence and cross-domain orchestration coupled. It also makes the atomicity gap harder to isolate and test.

### Add The RPC During Boundary Extraction

Rejected for the next phase. Combining structural extraction with a database transaction and changed failure semantics would increase risk and make regressions harder to attribute.

### Introduce Prisma

Rejected. Prisma would not make the existing Supabase Data API and RLS workflow transactional. It would require a separate database connection, authorization model and deployment contract without removing the need for a carefully designed Postgres transaction.

## Consequences

- The immediate extraction can follow the established service/repository/policy pattern without changing production behavior.
- The orphan-attempt risk remains until a transactional RPC is introduced.
- Mistake and homework projections remain potentially incomplete after partial failures.
- Tests for the extraction must explicitly lock current hard- and soft-failure semantics so a later RPC change is intentional.

## Verification

The accepted extraction is verified by focused policy, repository, infrastructure, service, facade and API route tests, plus:

- `npm run lint`
- `npm run check:architecture`
- `git diff --check`

RPC work must additionally include migration tests, authenticated/RLS verification and live database smoke coverage.
