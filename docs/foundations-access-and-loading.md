# Foundations: Access And Loading Contracts

This document is the engineering reference for the foundational refactors completed in sections 1-5.

For the current access-control status and links to the RBAC/RLS, service-role, storage, ScheduleActor, and workspace boundary inventories, start with `docs/access-control-current-state.md`.

For the workspace loading and skeleton boundary after the one-shell migration, see `docs/workspace-loading-skeleton-contract.md`.

## Access Modes

- `user_scoped`: use the SSR client from `lib/supabase/server.ts` and rely on auth cookies plus RLS.
- `privileged`: use `createAdminClient()` only for staff-only operations, cross-user writes, and explicitly documented infrastructure exceptions.
- `aggregate`: prefer user-scoped RPCs for summary/search/dashboard read models; service role is only for documented final exceptions.

## Request Context Contract

- `lib/auth/request-context.ts` is the only place allowed to derive the authenticated actor and linked scope.
- `request-context` uses a 3-step bootstrap: minimal auth, profile identity, then RBAC/linked-scope resolution.
- Preferred linked-scope path is `get_linked_actor_scope(p_profile_id uuid)` via the user-scoped server client/RPC path.
- App-level chained resolution of `students`, `teachers`, and `student_course_enrollments` is fallback-only for migration drift or schema cache failures.
- `student` and `teacher` capabilities come from linked rows only.
- `staff_admin` capability comes only from loaded RBAC roles or all-scoped staff permissions.
- Empty RBAC metadata and RBAC load errors fail closed for protected access; `profiles.role` must not grant workspace, page, API, menu, or mutation access.
- `profileRole` remains an identity/display/default/diagnostic field only.
- Request context profile identity, RBAC metadata and linked actor scope use user-scoped reads/RPCs; service-role escalation is not part of actor scope derivation.

## Data Loading Levels

- `layout`: shell identity and minimum chrome state only.
- `page`: above-the-fold summary or initial list shell.
- `section`: independent detail/summary blocks that can later become async sections.
- `client_interaction`: user-triggered follow-up loads only.

## Transitional Aggregate Loaders

These loaders are intentionally transitional and should not absorb new unrelated concerns:

- `getSchedulePageData()`
- `getTeacherDashboardData()`
- `getTeacherStudentProfileData()`
- `getStudentPaymentsPageData()`

## Documented Exceptions

- The enforced service-role baseline and remaining privileged exceptions live in `docs/service-role-inventory.md`.
- New business/data access paths must be user-scoped or RPC-backed by default.
