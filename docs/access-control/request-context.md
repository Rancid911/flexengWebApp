# AppActor And Request Context

Status: current  
Audience: engineers working on server routes, loaders and guards  
Owner area: access-control  
Last reviewed: 2026-05-25  
Source of truth: summary; code and tests are implementation sources  
Related code: `lib/auth/request-context.ts`, `lib/auth/rbac-compat.ts`, `lib/auth/rbac-route-guard.ts`  
Related tests: `tests/unit/auth-request-context.test.ts`, `tests/unit/auth-request-context-rpc.test.ts`, `tests/unit/current-student.test.ts`

`AppActor` is the server-side access context for the current authenticated request. It separates identity from permission grants.

## What AppActor Represents

- User identity from Supabase Auth.
- Profile metadata used for display, defaults and diagnostics.
- DB-backed RBAC roles, permissions and scopes.
- Linked student and teacher identities when those rows exist.
- Workspace capabilities derived from RBAC and linked identity, not from `profiles.role`.
- RBAC load status so guards can fail closed when protected authorization cannot be proven.

## Identity Is Not Permission

Linked student or teacher identity is data context. It does not automatically grant every student or teacher permission. Protected reads and writes still require permissions/scopes and the relevant page/API guard.

`profileRole` may still be present on actors as legacy/display/diagnostic metadata. It must not grant access, notification visibility, student write capability or workspace authorization.

## Fail-Closed Behavior

- Loaded RBAC metadata can grant protected permissions when the required key and scope are present.
- Empty RBAC metadata denies protected permissions.
- RBAC load errors deny protected permissions.
- Explicit user-targeted workflows may use `actor.userId` where the feature contract allows it, but role-targeted or permission-protected behavior still requires RBAC.

## Dual-Role Considerations

Actors can have linked student and teacher records. Write paths that require a real student context must use the canonical real-student write boundary and deny teacher-linked preview flows. Teacher preview/demo mode is not a real-student write context.

See `docs/teacher-preview-write-surface-audit.md` for the current write-safety boundary.
