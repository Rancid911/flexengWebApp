# Words And Flashcards

Status: current  
Audience: engineers, product maintainers, learning content maintainers, security reviewers  
Owner area: words-flashcards  
Last reviewed: 2026-06-12
Source of truth: feature summary; current code/tests remain implementation source  
Related code: `app/(workspace)/(shared-zone)/words/`, `app/api/words/sessions/complete/route.ts`, `app/api/admin/word-card-sets/`, `features/words/`, `lib/words/`, `lib/admin/word-card-sets.service.ts`, `lib/admin/word-card-sets.repository.ts`  
Related tests: `tests/unit/words-repository.test.ts`, `tests/unit/words-review-policy.test.ts`, `tests/unit/words-service.test.ts`, `tests/unit/words-queries.test.ts`, `tests/unit/words-flashcards.test.ts`, `tests/unit/words-list-pages.test.tsx`, `tests/unit/words-train-page.test.tsx`, `tests/unit/words-session-complete-route.test.ts`, `tests/unit/words-session-complete-service.test.ts`, `tests/unit/admin-word-card-sets.test.ts`, `tests/unit/admin-word-card-sets-service.test.ts`

## Overview

Words/flashcards provides student vocabulary review, new-word discovery, difficult-word practice and flashcard training. Admin content maintainers manage published word card sets through the admin console.

Global documentation lives in `docs/README.md`, `docs/access-control/README.md`, `docs/access-control/permissions.md`, `docs/access-control/guards.md`, `docs/access-control/request-context.md`, `docs/access-control/rls-rpc.md` and `docs/access-control/verification-status.md`. Related feature docs: `docs/features/admin-users-content.md`, `docs/features/homework-practice-tests.md` and `docs/features/search.md`.

## User Flows

- Student opens `/words`, which renders the cards overview.
- Student reviews all words, due review words, new words, difficult words or a topic detail.
- Student starts `/words/train` with optional mode/topic/set/limit query params.
- Student completes a training session; answers update own `student_words` progress and create review history.
- Admin manages word card sets and items from the admin console.

## Routes And UI

- `/words`, `/words/review`, `/words/new`, `/words/difficult`, `/words/topics/[topicSlug]` render list/topic pages after `requireWorkspaceRouteAccess("words")`.
- `/words/train` renders the flashcard trainer or empty state.
- Admin word-card management is part of the admin console documented in `docs/features/admin-users-content.md`.

## APIs And Server Actions

| Endpoint | Method | Classification | Notes |
| --- | --- | --- | --- |
| `/api/words/sessions/complete` | POST | protected student mutation | Requires real student write context and `word_cards.train`. |
| `/api/admin/word-card-sets` | GET/POST | protected admin | Requires `word_cards.manage`. |
| `/api/admin/word-card-sets/[id]` | GET/PATCH/DELETE | protected admin | Requires `word_cards.manage`. |

## Data Model

Key tables:

- `student_words`: student-owned vocabulary progress, status, review timestamps, catalog linkage and counters.
- `student_word_reviews`: review event history for completed sessions.
- `word_card_sets`: admin-managed published/unpublished sets.
- `word_card_items`: words inside admin-managed sets.

The read model combines student progress with published catalog sets. Catalog items are surfaced as new cards until a student creates progress for them.

## Architecture

- Server routes and the completion API call `lib/words/words.service.ts`.
- The service owns request-local caching, DTO assembly and read/write orchestration.
- `lib/words/words.repository.ts` is the student Words boundary for Supabase reads and writes.
- `lib/words/words-review.policy.ts` owns due queues, answer aggregation and spaced-repetition transitions as pure functions.
- `lib/words/words.types.ts` owns the public DTO and domain types used by server and UI code.
- `lib/words/queries.ts` remains a compatibility facade and must not regain query or business logic.

## Access Control

- Words workspace routes use `requireWorkspaceRouteAccess("words")`.
- Student training completion requires `requireRealStudentWriteContext(actor, "word_cards.train")` and `requirePermission(actor, "word_cards.train")`.
- Teacher preview/demo actors must not write real `student_words` rows.
- Admin word-card CRUD requires `word_cards.manage`.
- `word_cards.demo_train` can expose demo/preview navigation, but real progress writes remain guarded by the real-student write context.
- RLS/static expectations are covered by `docs/access-control/rls-rpc.md`; live DB verification remains separate.

## State And Lifecycle

- Word statuses include `new`, `learning`, `review`, `difficult` and `mastered`.
- Known answers extend the review interval and can eventually mark a word mastered.
- Hard/unknown answers shorten review intervals and can mark a word difficult.
- Completing a session updates or inserts `student_words` rows and records `student_word_reviews`.
- Published admin card sets become available to student word sessions.

## Integrations

- Search can index words and link users back to word surfaces.
- Homework/practice may create or influence vocabulary surfaces through student-owned progress.
- Admin/content documentation owns broader admin console behavior.

## Loading And Errors

- Words list pages are server-rendered from page-level loaders.
- `/words/train` validates query params and falls back to default mode/limit.
- Empty session state renders `WordsTrainEmptyState`.
- Missing optional schema in some word loaders can return empty data rather than blocking the page.

## Tests

Current focused coverage includes:

- Word overview/list/train page rendering.
- Repository query shape and policy transition coverage.
- Service catalog assembly, fallback behavior and completion orchestration.
- Session completion route and service behavior.
- Admin word-card set route/service behavior.
- Workspace navigation/read-route coverage for `word_cards.train` and demo permissions.

Coverage gaps:

- Browser-level flashcard interaction coverage can be expanded.
- Live RLS behavior for student word writes requires DB verification.

## Operations

- For missing catalog cards, inspect `word_card_sets.is_published`, `word_card_items`, `lib/words/words.repository.ts` and catalog mapping in `lib/words/words.service.ts`.
- For write denials, check real-student write context before checking permission names.
- For admin card-set failures, inspect validation rules: published sets require enough cards.

## Known Limitations

- Some loaders intentionally fail soft when optional word schema is missing.
- Removed legacy flashcards alias no longer redirects into words; use `/words` directly.
- Full security closure depends on live RLS smoke outside this documentation PR.
