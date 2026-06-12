# ADR: Request Context Boundary

Status: accepted  
Audience: engineers, product maintainers, security reviewers  
Owner area: access-control  
Last reviewed: 2026-06-12  
Source of truth: architecture decision; current code and tests remain runtime truth  
Related code: `lib/auth/request-context.ts`, `lib/auth/next-request-context.ts`, `lib/auth/actor-resolver.ts`, `lib/auth/actor.repository.ts`  
Related tests: `tests/unit/auth-actor-repository.test.ts`, `tests/unit/auth-request-context.test.ts`, `tests/unit/auth-request-context-rpc.test.ts`, `tests/unit/auth-request-context-facade.test.ts`, `tests/unit/current-student.test.ts`

## Context

Request context previously combined user-scoped Supabase access, actor normalization, React request caching and Next.js guards in `lib/auth/request-context.ts`.

The bootstrap remains:

`Supabase Auth user -> profile identity -> RBAC + linked actor scope in parallel -> AppActor`

Minimal auth is resolved first. Profile identity is then loaded, after which RBAC metadata and the `get_linked_actor_scope` RPC run in parallel. React `cache()` shares profile, RBAC and RPC reads within the request. The same linked-scope RPC payload is normalized separately for layout and full actor modes.

The module has a broad consumer surface, so the extraction must preserve its public exports and all current authorization and failure semantics.

## Decision

The runtime uses this boundary:

`server usage -> request-context facade -> next-request-context -> actor-resolver -> actor.repository -> Supabase`

### Repository

`actor.repository.ts` owns user-scoped Supabase operations through an injected client:

- authenticated-user lookup through the existing auth lock retry;
- profile identity read from `profiles`;
- linked actor scope read through `get_linked_actor_scope`;
- RBAC metadata read from `user_roles` and its role/permission relations.

It returns raw query outcomes and does not import React or Next.js.

### Resolver

`actor-resolver.ts` owns pure actor rules and normalization:

- profile role, display identity and avatar URL assembly;
- RBAC role, permission and scope normalization;
- linked-scope normalization for layout and full modes;
- capability derivation and actor assembly;
- default-workspace precedence and actor type guards.

It does not import Supabase, React or Next.js.

### Next Adapter

`next-request-context.ts` owns:

- repository creation at the same workflow points as the previous client creation;
- the minimal, profile and full bootstrap sequence;
- React request-local cache boundaries;
- timing labels, warnings and error mapping;
- layout/full actor loaders and redirecting guards;
- existing invalidation entrypoints.

The adapter preserves the shared linked-scope RPC payload across layout and full actor resolution in one request. It does not introduce `unstable_cache` or another cross-request actor cache.

### Compatibility Facade

`request-context.ts` directly re-exports the established public actor types, normalization helpers, loaders, guards, aliases, `AuthAccessError` and invalidation functions. Existing production consumers remain on this facade.

## Compatibility Requirements

- `profiles.role` remains identity/display/diagnostic metadata and never grants capabilities or permissions.
- Student and teacher capabilities come only from linked identities returned by the RPC.
- `staff_admin` requires loaded RBAC metadata containing an admin/manager role or an allowed staff permission with `all` scope.
- Empty RBAC metadata has status `empty`; RBAC query errors have status `error`; both fail closed.
- An unavailable linked-scope RPC logs `REQUEST_CONTEXT_SCOPE_RPC_UNAVAILABLE` and produces no linked identities without direct-table fallback.
- Other linked-scope RPC errors log `REQUEST_CONTEXT_SCOPE_RPC_FAILED` and throw.
- Profile query errors continue to throw.
- Missing or failed authentication produces a null minimal context; redirecting guards continue to use `/login`.
- Layout mode omits a teacher's accessible student ids, while full mode includes them. Non-teacher actors use `accessibleStudentIds: null`.
- Loader names, guards, actor DTOs, aliases, timing labels and error types remain unchanged.
- Profile and RBAC invalidators remain no-ops. Linked-scope invalidation retains its existing tag calls without a new cross-request cache.

## Alternatives Considered

### Keep The Combined Module

Rejected because pure authorization rules and Supabase query contracts could not be tested independently from Next.js infrastructure.

### Create One Repository And Client For The Entire Request

Rejected for this extraction. Consolidating client creation could change cookie/session timing and test assumptions.

### Add Cross-Request Actor Caching

Rejected. Actor identity, linked scope and RBAC metadata are authorization-sensitive and require an explicit freshness and invalidation contract.

### Add Direct-Table Linked-Scope Fallback

Rejected. It would create a second authorization derivation path and change current fail-closed behavior.

## Consequences

- Supabase query contracts, pure actor rules and Next.js orchestration have independent test boundaries.
- The broad existing import surface remains stable.
- Auth, RBAC, RPC, RLS and access-mode behavior are unchanged.
- Client-count optimization and cross-request invalidation remain separate work.

## Verification

The extraction is covered by focused repository, resolver, Next adapter, facade and current-student tests, plus:

- `npm run lint`
- `npm run check:architecture`
- `git diff --check`

No database migration or live Supabase change is part of this decision.
