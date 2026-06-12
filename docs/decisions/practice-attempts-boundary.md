# ADR: Practice Attempts Boundary And Atomicity

Status: accepted  
Audience: engineers, product maintainers, security reviewers  
Owner area: practice attempts  
Last reviewed: 2026-06-12  
Source of truth: architecture decision; current code and database policies remain runtime truth  
Related code: `app/api/practice/attempts/route.ts`, `lib/practice/practice-attempts.service.ts`, `lib/practice/practice-attempts-grading.policy.ts`, `lib/practice/practice-attempts.repository.ts`, `lib/practice/practice-attempts.infrastructure.ts`, `supabase/migrations/20260612201818_atomic_practice_test_attempt_rpc.sql`
Related tests: `tests/unit/practice-attempts-api-route.test.ts`, `tests/unit/practice-attempts-submit.test.ts`, `tests/unit/practice-attempts-grading-policy.test.ts`, `tests/unit/practice-attempts-repository.test.ts`, `tests/unit/practice-attempts-infrastructure.test.ts`, `tests/unit/practice-attempts-atomic-migration.test.ts`

## Context

Practice attempt submission follows this path:

`API -> practice-attempts.service -> grading policy -> repository RPC -> atomic attempt + answers -> post-commit projections`

The route remains a thin transport adapter. `attempts.ts` is a compatibility facade; orchestration, pure grading, Supabase access and cross-domain projections have separate owners.

Before any write, the current flow:

1. Requires a real-student write context for `practice.attempts.submit`.
2. Loads the activity and requires a supported test activity.
3. Validates the activity id.
4. Validates complete answers, except timeout-driven partial placement submissions.
5. Verifies that every selected option belongs to its question.
6. Loads authoritative grading data from the database.
7. Builds review DTOs, score, pass/fail status and, for placement tests, the placement summary.

These validations and grading rules remain part of the public behavior even though the database now repeats them authoritatively.

## Persistence Flow

The core write is now transactional:

1. The service performs existing JS validation/grading for early errors and review DTO assembly.
2. The repository calls authenticated `submit_practice_test_attempt`.
3. The RPC derives the student from `auth.uid()`, checks `homework.submit:own`, reloads DB questions/options, validates and grades again.
4. The RPC inserts `student_test_attempts` and the complete `student_test_answers` set in one transaction.
5. The service verifies DB grading parity before continuing.
6. Mistakes, homework synchronization and Next.js revalidation run after commit in their previous order.

Attempt and answer failures retain `ATTEMPT_CREATE_FAILED` and `ATTEMPT_ANSWERS_SAVE_FAILED`. An answer failure rolls back the attempt.

Mistake and homework operations do not inspect most returned errors. They therefore behave as soft projections: failures can leave these projections incomplete without changing the successful attempt result.

## Atomicity Decision

The minimum required atomic unit is:

`student_test_attempts + student_test_answers`

The authenticated `SECURITY INVOKER` RPC is the minimum atomic boundary and closes the orphan-attempt gap without bypassing RLS.

`student_mistakes` is a derived projection of the graded result. Ideally it should be included in the same transaction. A lower-risk alternative is to update it after the core commit through an explicitly idempotent operation. The unique `(student_id, question_id)` constraint is compatible with idempotent upsert-based processing, but the current read-then-update/insert behavior must not be changed during extraction.

Homework progress is a cross-domain projection. It should remain after the core attempt commit and become independently idempotent and observable. It should not be included in the first attempt RPC because doing so would couple the practice transaction to homework assignment aggregation and broaden its failure surface.

## Decision

The runtime uses the extracted boundary with an authenticated transactional RPC:

`API -> practice-attempts.service -> grading policy -> practice-attempts.repository -> submit_practice_test_attempt`

- `practice-attempts-grading.policy.ts` contains pure answer validation, review-question construction, score/pass calculation, placement calculation and attempt timestamps.
- `practice-attempts.repository.ts` contains grading-data reads, module/course lookup, the atomic RPC call, and mistake reads/writes.
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

The RPC intentionally excludes mistakes, homework progress and Next.js revalidation. Those operations remain post-commit projections and keep their existing soft-error behavior.

## Alternatives Considered

### Keep The Current Combined Module

This preserves behavior but leaves grading, persistence and cross-domain orchestration coupled. It also makes the atomicity gap harder to isolate and test.

### Introduce Prisma

Rejected. Prisma would not make the existing Supabase Data API and RLS workflow transactional. It would require a separate database connection, authorization model and deployment contract without removing the need for a carefully designed Postgres transaction.

## Consequences

- The established service/repository/policy pattern remains intact while the core persistence boundary is transactional.
- Attempt and answer rows can no longer be committed separately.
- Mistake and homework projections remain potentially incomplete after partial failures.
- Duplicate valid submissions remain possible because idempotency is outside this decision.
- Attempt/answer table access is enforced only by canonical `app_private.*` policies: students retain own-row mutations, assigned/all-scope staff retain reads, and undocumented staff mutations are removed.

## Verification

The accepted boundary and atomic RPC are verified by focused policy, repository, infrastructure, service, facade, API route and migration-contract tests, plus the rollback-only SQL smoke:

- `npm run lint`
- `npm run check:architecture`
- `git diff --check`

Database verification additionally includes applying the migration before runtime deployment, running the authenticated SQL smoke, and reviewing database advisors.
