# Access Control Current State

Status date: 2026-05-24

This is the current-state entrypoint for access-control architecture. Historical rollout details remain in the RBAC/RLS roadmap, but day-to-day implementation decisions should start here.

## Runtime Chain

```text
DB RBAC
-> RequestContext / AppActor
-> can() / requirePermission() / page and API guards
-> Menu / Navigation
-> Page Guards
-> API Guards
-> RLS Policies / RPC
```

`Role` is business context, `Permission` is a concrete function, `Scope` is the data boundary, and RLS/RPC is the final database boundary.

## Source Of Truth

- DB RBAC metadata is the only authority for protected authorization.
- Empty RBAC metadata and RBAC load errors fail closed for protected access.
- `profiles.role` remains a compatibility, display, form-default and diagnostic field. It must not grant access.
- `student` and `teacher` workspace capabilities require real linked `students` / `teachers` rows.
- `staff_admin` workspace capability is derived from loaded RBAC roles or all-scoped staff permissions only.
- App-layer guards are defense in depth. Sensitive database paths still need RLS policies or internally validated RPCs.
- `/api/search` is an optional-auth hybrid endpoint: guests receive public-only results, while authenticated users receive public plus server-derived domain-permission/scoped workspace results. `anon` may execute `search_documents_query_for_actor`, but unauthenticated execution returns public-only results because privileged visibility is derived from `auth.uid()` plus DB RBAC/linked scope, not caller parameters. `search.ui` controls search UI availability only; it is not the API result-authorization gate.
- Notification `target_roles` values are RBAC role keys, not `profiles.role` values. User notification visibility is filtered server-side from the current actor's loaded RBAC roles; explicit `target_user_ids` and `all` audiences remain supported.

## Authoritative Documents

| Topic | Document |
| --- | --- |
| Foundational request-context and data-loading contract | `docs/foundations-access-and-loading.md` |
| RBAC/RLS historical decision log and vocabulary notes | `docs/decisions/historical/rbac-rls-implementation-plan.md` |
| Permission vocabulary registry and static diff test | `lib/permissions/registry.ts`, `tests/unit/permissions-vocabulary.test.ts` |
| Live RLS verification scripts and expected smoke status | `docs/rls-smoke-harness.md` |
| Enforced service-role baseline and remaining exceptions | `docs/service-role-inventory.md` |
| Supabase Storage bucket inventory and smoke target | `docs/storage-access-inventory.md` |
| `ScheduleActor` transitional data/scope boundary | `docs/schedule-actor-permission-boundary.md` |
| Workspace route-group remount and hard-refresh boundary | `docs/workspace-hard-refresh-audit.md` |
| Teacher preview write-surface boundary | `docs/teacher-preview-write-surface-audit.md` |

## Current Production-Readiness Boundary

Application-layer authorization is RBAC-only for protected access: API/page guards use canonical permissions, navigation is permission-gated where migrated, and `can()` denies protected permissions when RBAC metadata is empty or fails to load.

Production confidence still depends on running the live SQL smoke scripts against the target Supabase database after migrations are applied. Static migration review is not a substitute for checking active `pg_policies`, RLS enabled state, grants, and RPC behavior on the deployed database.

## Intentional Compatibility Layers

- `profiles.role` remains exported and readable as compatibility, display, form-default, and diagnostic metadata, but it must not grant protected access.
- `ScheduleActor.accessMode` is the transitional data/scope field for existing schedule, billing, homework, placement, and teacher-workspace services; `ScheduleActor.role` remains compatibility/UI/DTO metadata and canonical route authorization must happen before either field is used.
- Deprecated and runtime compatibility permission keys remain exported intentionally so older call sites and tests fail predictably while they map to canonical DB-backed permissions or dedicated `can()` handling.
- Service-role final exceptions remain allowed only when they are listed in `docs/service-role-inventory.md` and enforced by the architecture checker.
- Workspace route groups share the common workspace shell; remaining hard-refresh exceptions and self-wrapped routes are documented in `docs/workspace-hard-refresh-audit.md`.

## Change Rules

- New protected routes should use permission-aware page/API guards and pass full `AppActor` context.
- New DB-backed permissions must be added to both the seed/migration path and `lib/permissions/registry.ts`.
- Runtime compatibility permissions must be classified in the registry instead of being silently added as ad hoc strings.
- New service-role call sites require a dedicated security/RLS plan and updates to `docs/service-role-inventory.md` plus the architecture checker allowlist.
- Do not combine authorization semantics, RLS rewrites, service-role cleanup, and workspace routing/shell changes in one PR.
