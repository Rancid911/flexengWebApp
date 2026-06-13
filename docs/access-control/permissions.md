# Permissions And `can()`

Status: current  
Audience: engineers adding or reviewing protected behavior  
Owner area: access-control  
Last reviewed: 2026-05-25  
Source of truth: summary; registry and tests are implementation sources  
Related code: `lib/permissions/registry.ts`, `lib/permissions/index.ts`, `lib/auth/request-context.ts`  
Related tests: `tests/unit/permissions.test.ts`, `tests/unit/permissions-vocabulary.test.ts`, `tests/unit/auth-request-context.test.ts`

Permissions are concrete capabilities such as reading a page, managing a domain object, or performing a mutation. Scopes describe the data boundary for a permission, such as `own`, `assigned` or `all`.

## Current Rules

- Canonical permission keys live in `lib/permissions/registry.ts`.
- `can()` evaluates permissions from the current `AppActor` RBAC metadata.
- Empty RBAC metadata and RBAC load errors fail closed for protected permissions.
- Permission aliases and runtime compatibility keys must map to canonical permissions or explicit compatibility handling; they must not grant access from legacy profile data.
- `profiles.role` and `profileRole` are metadata/display/default/diagnostic fields only. They must not grant permissions.
- Role-shaped product labels are not authorization unless they are resolved from DB RBAC roles/permissions.

## Adding A Permission

1. Add the canonical key to the permission registry.
2. Seed or migrate DB RBAC metadata for roles/scopes that should receive the permission.
3. Add or update `can()`/guard tests for loaded, empty and errored RBAC.
4. Update feature docs with feature-specific routes, guards and scopes.
5. Do not add a role-based fallback to bridge missing RBAC data.

## Forbidden Patterns

- Do not check `profiles.role`, `profile.role` or `profileRole` to grant protected access.
- Do not hide security only in navigation.
- Do not infer admin, manager, teacher or student permission from display metadata.
- Do not create ad hoc permission strings outside the registry.
- Do not treat an optional UI permission such as `search.ui` as a broad API result authorization gate.

## Source Links

- Current-state overview: `docs/access-control-current-state.md`
- Request context: `docs/access-control/request-context.md`
- Guards: `docs/access-control/guards.md`
