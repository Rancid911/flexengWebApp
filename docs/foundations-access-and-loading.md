# Foundations: Access And Loading Contracts

This document is the engineering reference for the foundational refactors completed in sections 1-5.

## Access Modes

- `user_scoped`: use the SSR client from `lib/supabase/server.ts` and rely on auth cookies plus RLS.
- `privileged`: use `createAdminClient()` only for staff-only operations, cross-user writes, and explicitly documented infrastructure exceptions.
- `aggregate`: use service-role backed summary/search/metrics paths when a user-scoped path is not viable.

## Request Context Contract

- `lib/auth/request-context.ts` is the only place allowed to derive the authenticated actor and linked scope.
- `request-context` uses a 3-step bootstrap: minimal auth, profile identity, then privileged linked-scope resolution.
- Preferred linked-scope path is `get_linked_actor_scope(p_profile_id uuid)` via privileged RPC.
- App-level chained resolution of `students`, `teachers`, and `student_course_enrollments` is fallback-only for migration drift or schema cache failures.
- `student` and `teacher` capabilities come from linked rows only.
- `staff_admin` capability comes from `profiles.role` equal to `manager` or `admin`.
- `profileRole` remains an identity/display field and a workspace resolution input, not a domain capability source.
- The privileged linked resolver is the only allowed escalation point for actor scope derivation.

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

- Student-facing billing summary remains a temporary privileged exception until a user-scoped summary RPC/view exists.
- Student dashboard payment reminder remains isolated as a privileged section companion until reminder state can be served from a user-scoped summary path.
