# Settings And Profile

Status: current  
Audience: engineers, product maintainers, support, security reviewers  
Owner area: settings-profile  
Last reviewed: 2026-05-25  
Source of truth: feature summary; current code/tests remain implementation source  
Related code: `app/(workspace)/(shared-zone)/settings/`, `app/api/settings/profile/route.ts`, `features/settings/`, `lib/settings/profile.service.ts`, `lib/settings/profile.repository.ts`, `lib/settings/profile-identity.gateway.ts`, `lib/settings/profile-avatar.gateway.ts`, `lib/settings/profile.types.ts`, `lib/media/urls.ts`, `lib/media/service.ts`<br>
Related tests: `tests/unit/settings-profile-page.test.tsx`, `tests/unit/settings-profile-route.test.ts`, `tests/unit/settings-profile-service.test.ts`, `tests/unit/settings-profile-repository.test.ts`, `tests/unit/settings-profile-identity-gateway.test.ts`, `tests/unit/settings-profile-avatar-gateway.test.ts`, `tests/unit/settings-form-state.test.tsx`, `tests/e2e/settings-routes.smoke.spec.ts`, `tests/e2e/settings.smoke.spec.ts`, `tests/unit/media-api-routes.test.ts`

## Overview

Settings/profile lets authenticated users view and edit their own profile, email/password access settings, phone/name fields, birth date and avatar. Payment settings are separate and documented in `docs/features/payments-billing.md`.

Global documentation lives in `docs/README.md`, `docs/access-control/README.md`, `docs/access-control/permissions.md`, `docs/access-control/guards.md`, `docs/access-control/request-context.md`, `docs/access-control/rls-rpc.md`, `docs/access-control/storage-media.md` and `docs/access-control/verification-status.md`.

## User Flows

- Authenticated user opens `/settings/profile`.
- Client settings state loads `/api/settings/profile`.
- User edits profile fields, email or avatar and saves through `PATCH /api/settings/profile`.
- Password changes use the separate `/api/auth/password/change` flow.
- Avatar upload/delete updates Supabase Storage and the profile avatar URL.
- `/settings` redirects to `/settings/profile`.

## Routes And UI

- `/settings` redirects to `/settings/profile`.
- `/settings/profile` requires a layout actor and `profile.view` with `own` or `all` scope.
- `SettingsClient` renders profile, email, password and save sections.
- `app/(workspace)/(shared-zone)/settings/profile/loading.tsx` provides a route-specific fallback.
- Workspace navigation shows profile settings when RBAC grants `profile.view`.

## APIs And Server Actions

| Endpoint | Method | Classification | Notes |
| --- | --- | --- | --- |
| `/api/settings/profile` | GET | protected | Requires `profile.view` scoped to `ownerUserId: actor.userId`. |
| `/api/settings/profile` | PATCH | protected mutation | Requires `profile.update` scoped to `ownerUserId: actor.userId`; accepts form data for profile/email/avatar changes. |
| `/api/auth/password/change` | POST | protected auth mutation | Verifies the current password and applies the new password through the Auth service. |

The settings client also calls `/api/request-context/invalidate` after successful changes that affect cached actor/profile state.

## Data Model

Key data:

- `profiles`: first name, last name, phone, avatar URL, email, birth date when present.
- Supabase Auth user: canonical email and pending email for the profile flow; password updates are owned by the Auth API.
- `students`: birth-date fallback only when the profile table lacks the column and the actor is a real student write context.
- Storage bucket `avatars`: avatar object path convention is `${userId}/avatar`.

## Access Control

- Page guard uses `profile.view` and direct URL access is denied when the permission/scope is missing.
- GET API uses `requirePermission(actor, "profile.view", { ownerUserId: actor.userId })`.
- PATCH API uses `requirePermission(actor, "profile.update", { ownerUserId: actor.userId })`.
- The service validates that the authenticated Supabase user id matches `actor.userId`.
- `profile.repository.ts` owns `profiles`/`students` access; identity and avatar gateways isolate Auth and Storage calls.
- `profileRole`/`profiles.role` is returned as profile metadata only and must not grant access.
- Student birth-date fallback writes require `actor.isStudent && Boolean(actor.studentId) && !actor.isTeacher`.
- Avatar media access and bucket posture are documented in `docs/features/storage-media.md` and `docs/access-control/storage-media.md`.

## State And Lifecycle

- Client state uses a runtime snapshot/cache so the form can render quickly after navigation.
- Email change can enter a pending confirmation state.
- Password change verifies the current password in the separate Auth API before update.
- Avatar upload normalizes/crops an image client-side, uploads to Storage, then updates `profiles.avatar_url`.
- Avatar delete removes the Storage object and clears `profiles.avatar_url`.

## Integrations

- Supabase Auth through the settings identity gateway for email updates and through the Auth service for password updates.
- Supabase Database for profile/student fallback rows.
- Supabase Storage `avatars` bucket through the settings avatar gateway.
- Workspace shell profile cache listens to profile update events.

## Loading And Errors

- The page has a route-level skeleton and client runtime loading state.
- `SettingsClient` shows a local loading message when no runtime snapshot is available.
- Validation errors are split into profile/access sections.
- Auth errors redirect to `/login`; API errors map to user-facing messages.

## Tests

Current focused coverage includes:

- Settings profile page guard/render tests.
- Settings profile API route tests.
- Settings profile service tests, including orchestration and student birth-date fallback behavior.
- Focused repository, identity gateway and avatar gateway tests.
- Settings form state tests.
- Media API route tests for avatar access.
- Settings e2e smoke tests.

Coverage gaps:

- Full browser coverage for every avatar crop/upload edge case can be expanded later.
- Live Storage/RLS behavior requires storage smoke verification.

## Operations

- For profile save failures, inspect API response codes, `profile.service.ts` orchestration and the focused repository/gateway result.
- For avatar failures, check Storage bucket policy, object path and media proxy behavior.
- Never commit or expose service-role credentials while debugging media issues.
- Payment settings issues should be routed to `docs/features/payments-billing.md`.

## Known Limitations

- The birth-date fallback exists for compatibility with deployments where `profiles.birth_date` may be absent.
- Profile role remains visible metadata but is not an authorization source.
- Live DB/Storage verification is separate from local unit tests.
