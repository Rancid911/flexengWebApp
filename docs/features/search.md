# Search

Status: current  
Audience: engineers, product maintainers, security reviewers  
Owner area: search  
Last reviewed: 2026-05-25  
Source of truth: feature summary; current code/tests and SQL remain implementation source  
Related code: `app/search/page.tsx`, `app/api/search/route.ts`, `features/search/`, `lib/search/`, `lib/supabase/middleware.ts`, `supabase/migrations/20260521150000_pr15a_rpc_grant_hardening.sql`, `supabase/migrations/20260525120000_search_rpc_anon_execute_grant.sql`  
Related tests: `tests/unit/search-api-route.test.ts`, `tests/unit/middleware-auth.test.ts`, `tests/unit/search-service.test.ts`, `tests/unit/search-documents-source.test.ts`, `tests/unit/search-rpc-grants.test.ts`, `tests/unit/search-page.test.tsx`, `tests/unit/search-page-view.test.tsx`

## Overview

Search provides site-wide lookup for public content and authenticated workspace content. It supports guests and authenticated users through a hybrid optional-auth API. Guest users receive public-only results. Authenticated users receive public results plus private/workspace results allowed by their server-derived domain permissions and scopes.

Global access rules are documented in `docs/access-control/README.md`, `docs/access-control/permissions.md`, `docs/access-control/guards.md`, `docs/access-control/request-context.md`, `docs/access-control/rls-rpc.md`, `docs/access-control/service-role.md`, `docs/access-control/storage-media.md` and `docs/access-control/verification-status.md`.

## User Flows

- Guest opens `/search` from public pages and searches public content.
- Authenticated user opens `/search`; if allowed to view the UI, the page renders in the workspace shell.
- Authenticated users can call `/api/search` without requiring `search.ui`; result visibility is based on domain permissions/scopes.
- Workspace shell search trigger can be gated by `search.ui` as a UI capability.

## Routes And UI

- `/search` is a mixed public/auth page.
- Guest `/search` renders the public marketing shell.
- Authenticated `/search` is self-wrapped in `WorkspaceShell` and currently requires `search.ui` for the page UI.
- `/api/search` is optional-auth hybrid and does not require `search.ui` as an API result gate.
- The self-wrapped `/search` route is an intentional mixed public/auth exception documented separately from the shared workspace shell.

## APIs And Server Actions

| Endpoint | Method | Classification | Notes |
| --- | --- | --- | --- |
| `/api/search` | GET | optional-auth hybrid | Accepts `q`, `section`, `limit`; middleware allows guests; service resolves optional actor and enforces visibility. |

Allowed sections are `all`, `practice`, `homework`, `words`, `blog` and `admin`. Invalid section values normalize to `all`; limit is clamped.

## Data Model

Key table/RPC:

- `search_documents`: indexed search candidates with section, visibility, role scope, owner student id, publication state and rank.
- `search_documents_query_for_actor(text, integer, text, boolean, text, text[], uuid, uuid, uuid[])`: hardened RPC used for candidate retrieval.
- Related domain tables such as blog/content, homework, tests, words and student-owned rows are represented through search documents.

## Access Control

- Middleware classifies `/api/search` as optional-auth, not protected-only.
- Guest context has no actor and can only see `visibility = public` and published results.
- Authenticated context is derived from `getAppActor()` and includes RBAC roles, permissions, permission scopes, linked student/teacher ids and assigned student ids.
- `search.ui` is a UI capability only; it is not the API result authorization gate.
- Private result visibility is enforced by server-side TypeScript filtering plus the hardened RPC.
- Client-supplied role/capability/student/teacher parameters must not upgrade visibility.
- `anon` may execute the search RPC for public-only search; privileged expansion requires `auth.uid()` plus DB RBAC/linked scope.

## State And Lifecycle

- Search is read-only.
- Query strings shorter than two characters return no results.
- Candidate expansion may fetch more than the requested result limit so final server-side filtering can dedupe and enforce visibility.
- Student practice search can use assigned homework/tests and English level for enrollment visibility.

## Integrations

- Supabase RPC retrieves ranked candidates.
- Blog/public content contributes public candidates.
- Workspace domains contribute role, student-owned or enrollment candidates.
- Middleware preserves optional authenticated context for `/api/search` when an auth cookie exists.

## Loading And Errors

- Search page view handles empty query, empty results and grouped results.
- API schema/cache missing errors are treated as empty candidates in source code; other RPC failures return typed search errors.
- Public and workspace page shells differ intentionally.

## Tests

Current focused coverage includes:

- Search API optional-auth behavior.
- Middleware protected/optional-auth classification.
- Search service and source filtering.
- Search RPC grant/static tests.
- Search page/view rendering.
- Dashboard global search component tests.

Coverage gaps:

- Live DB grant/RPC behavior must be verified on the target database. Static migrations and unit tests are not live DB verification.

## Operations

- If guest search fails with RPC permission errors, verify the anon execute grant on the exact search RPC signature.
- If private results appear incorrectly, inspect `lib/search/access.ts`, `getSearchContext()` and the RPC hardening smoke.
- Run `supabase/sql-editor/rpc_hardening_smoke_20260521.sql` on the target DB when verifying grants and spoofing behavior.

## Known Limitations

- `/search` page UI still uses `search.ui` for authenticated page rendering; `/api/search` result access does not.
- `/search` is intentionally self-wrapped because it supports both public and authenticated modes.
- Full production confidence requires live RPC/RLS verification.
