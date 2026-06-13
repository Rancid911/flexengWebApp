# Access And Security Documentation

Status: current  
Audience: engineers, security reviewers, maintainers, AI coding agents  
Owner area: access-control  
Last reviewed: 2026-05-25  
Source of truth: navigation index; links to current source docs  
Related code: `lib/auth/`, `lib/permissions/`, `app/`, `lib/supabase/middleware.ts`, `supabase/migrations/`  
Related tests: `tests/unit/permissions.test.ts`, `tests/unit/auth-request-context.test.ts`, `tests/unit/access-docs-consistency.test.ts`

This directory is the current access/security entrypoint. It organizes the active access-control model so engineers do not need to read historical migration plans to understand current runtime behavior.

## Current Model

```text
DB RBAC -> AppActor -> can()/guards -> menu/page/API -> RLS/RPC
```

- DB-backed RBAC is the authority for protected application authorization.
- `AppActor` carries identity, linked student/teacher state, RBAC roles, permissions and scopes.
- `can()` and route guards use loaded RBAC metadata and fail closed for protected permissions when RBAC is empty or errored.
- Navigation visibility is UX, not security.
- Page guards protect direct URL access.
- API guards protect mutations and side effects before services run.
- RLS/RPC/storage policies remain the database boundary and require live verification on the target Supabase project.
- `profiles.role` is metadata/display/default/diagnostic only. It must not grant access or control visibility.
- Service-role usage must stay allowlisted and enforced by `npm run check:architecture`.

## Start Here

| Topic | Doc |
| --- | --- |
| Current access-state summary | `docs/access-control-current-state.md` |
| Permissions and `can()` | `docs/access-control/permissions.md` |
| AppActor and request context | `docs/access-control/request-context.md` |
| Page/API guards and route classes | `docs/access-control/guards.md` |
| Service-role rules | `docs/access-control/service-role.md` |
| Storage and media access | `docs/access-control/storage-media.md` |
| RLS/RPC model | `docs/access-control/rls-rpc.md` |
| Verification status | `docs/access-control/verification-status.md` |

## Current Source Docs

- `docs/access-control-current-state.md` is the compact current-state source.
- `docs/service-role-inventory.md` is the authoritative service-role exception inventory.
- `docs/storage-access-inventory.md` is the authoritative storage/media inventory.
- `docs/rls-smoke-harness.md` is the live RLS verification runbook.
- `docs/schedule-actor-permission-boundary.md` documents the schedule data/scope boundary.
- `docs/teacher-preview-write-surface-audit.md` documents teacher preview and real-student write safety.
- `docs/workspace-hard-refresh-audit.md` documents the workspace shell boundary despite the audit title.

## Intentional Exceptions

- `/api/search` is an optional-auth hybrid route. Guests get public-only results; authenticated users get public plus server-derived RBAC/domain-scoped private results. `search.ui` is a UI capability, not the API result gate.
- Provider/webhook routes are explicit route-class exceptions and must validate provider/system inputs before side effects.
- Service-role final exceptions remain only where listed in `docs/service-role-inventory.md`.
- Public storage bucket posture is documented in `docs/storage-access-inventory.md`; direct public object URL exposure is an intentional risk until a separate storage redesign.
- `ScheduleActor.role` may still exist as UI/DTO compatibility metadata; `ScheduleActor.accessMode` is the data/scope boundary.

## Historical Context

Historical migration plans can explain why the model changed, but they are not current runtime truth:

- `docs/decisions/historical/rbac-rls-implementation-plan.md`
- `docs/decisions/historical/architecture-migration.md`
- `docs/decisions/historical/refactor-backlog.md`

Use current code, tests and the docs linked above before relying on historical notes.
