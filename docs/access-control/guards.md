# Page And API Guards

Status: current  
Audience: engineers adding routes, APIs or server actions  
Owner area: access-control  
Last reviewed: 2026-05-25  
Source of truth: summary; route code and guard tests are implementation sources  
Related code: `lib/auth/rbac-route-guard.ts`, `lib/admin/auth.ts`, `app/`, `app/api/`, `lib/supabase/middleware.ts`  
Related tests: `tests/unit/admin-auth.test.ts`, `tests/unit/middleware-auth.test.ts`, `tests/unit/workspace-read-route-rbac.test.tsx`

Hidden navigation is not security. Page and API guards are the application security boundary.

## Guard Rules

- Protected pages must guard direct URL access on the server.
- Protected API routes must authorize before service calls and before side effects.
- Mutations must validate resource scope, not only broad permission presence.
- Public, provider, internal and optional-auth routes must be explicit route classes.
- Guard behavior must not depend on `profiles.role`.
- RLS/RPC/storage remain defense in depth and require live DB verification.

## Patterns

Protected page:

```text
load actor -> require page permission/scope -> call page loader -> render
```

Protected API mutation:

```text
load actor -> require permission/scope -> validate input -> call service -> return response
```

Provider/system route:

```text
classify route as provider/internal -> validate provider signature or secret -> perform side effect
```

Optional-auth route:

```text
allow middleware pass-through -> resolve optional actor -> service enforces guest/public or actor-scoped visibility
```

`/api/search` is the primary optional-auth example. Middleware allows guests through, the route resolves an optional actor, and the search service/RPC enforces public-only guest results or RBAC/domain-scoped authenticated results. Client-supplied role, capability or scope parameters must not upgrade visibility.

## Route Classifications

- Public: no session required; service must still validate inputs and visibility.
- Optional-auth: guest allowed, authenticated actor supported, service decides visibility.
- Protected: authenticated actor and permission/scope required.
- Provider/internal: not user-authenticated, but must have provider/system validation.

When route classification changes, update tests and relevant docs in the same PR.
