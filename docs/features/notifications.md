# Notifications

Status: current  
Audience: engineers, product maintainers, operations, security reviewers  
Owner area: notifications  
Last reviewed: 2026-05-25  
Source of truth: feature summary; current code/tests remain implementation source  
Related code: `app/api/notifications/`, `app/api/admin/notifications/`, `features/workspace-shell/components/dashboard-notifications-drawer.tsx`, `features/workspace-shell/components/shell/workspace-notifications-panel.tsx`, `features/admin/components/admin-console/admin-notification-form-drawer.tsx`, `lib/notifications/`, `lib/admin/notifications*`  
Related tests: `tests/unit/notifications-server.test.ts`, `tests/unit/notifications-routes.test.ts`, `tests/unit/admin-notifications-routes.test.ts`, `tests/unit/admin-notifications-service.test.ts`, `tests/unit/dashboard-notifications-drawer.test.tsx`, `tests/unit/dashboard-notifications-read-lifecycle.test.tsx`

## Overview

Notifications provide workspace announcements and user-visible operational messages. Users can list, read and dismiss their own notifications. Admin/staff users with notification management permission can create, update and delete notifications from the admin console.

Global access rules are documented in `docs/access-control/README.md`, `docs/access-control/permissions.md`, `docs/access-control/guards.md`, `docs/access-control/request-context.md`, `docs/access-control/rls-rpc.md`, `docs/access-control/service-role.md`, `docs/access-control/storage-media.md` and `docs/access-control/verification-status.md`.

## User Flows

- Authenticated user opens the workspace notification drawer or unread badge.
- Client fetches `/api/notifications` or `/api/notifications/unread-summary`.
- User marks a notification read or dismisses it through user-scoped state APIs.
- Admin opens the admin console notification section and creates, edits or deletes a notification.
- Admin can target `all`, RBAC role keys, or explicit users where supported by the data model.

## Routes And UI

- Workspace notification UI lives in the workspace shell components.
- Admin notification management is part of the admin console.
- Notification drawer state and read lifecycle are local client concerns after guarded API reads.
- Navigation and badges are UX only; server-side filtering decides visibility.

## APIs And Server Actions

| Endpoint | Method | Classification | Notes |
| --- | --- | --- | --- |
| `/api/notifications` | GET | protected | Requires `notifications.user.read`; returns visible items and unread count. |
| `/api/notifications/unread-summary` | GET | protected | Requires `notifications.user.read`; returns unread count only. |
| `/api/notifications/[id]/read` | POST | protected mutation | Requires `notifications.user.manage`; upserts user read state. |
| `/api/notifications/[id]/dismiss` | POST | protected mutation | Requires `notifications.user.manage`; upserts dismissed state. |
| `/api/admin/notifications` | GET/POST | protected admin | Requires `notifications.manage`; lists or creates notifications. |
| `/api/admin/notifications/[id]` | PATCH/DELETE | protected admin mutation | Requires `notifications.manage`; updates or deletes a notification. |

## Data Model

Key tables and fields:

- `notifications`: title, body, type, active flag, publish/expiry times, `target_roles`, `target_user_ids`.
- `notification_user_state`: per-user read and dismissed state keyed by notification/user.
- `target_roles` means RBAC role keys: `student`, `teacher`, `manager`, `admin`, or `all`.
- `target_user_ids` is an explicit user-targeting override.

`profiles.role` is not used for notification visibility.

## Access Control

- User reads require `notifications.user.read`, which maps to canonical notification view behavior.
- User read/dismiss mutations require `notifications.user.manage`.
- Admin notification management requires `notifications.manage`.
- Visibility filtering is server-side through `isNotificationVisibleForActor(...)`.
- `target_roles` values are interpreted as RBAC role keys, not profile roles.
- Empty/error RBAC fails closed for role-targeted notifications.
- Explicit `target_user_ids` can make a notification visible by user id even if role targeting would fail.
- `all` notifications are visible to authenticated users after the route guard.

See `docs/access-control/permissions.md` and `docs/access-control/guards.md` for global rules.

## State And Lifecycle

- Notification is visible only when active and published.
- Expired notifications are excluded by repository query.
- Account-created filtering prevents old notifications from appearing to newly created accounts.
- User state tracks `read_at` and `dismissed_at`.
- Dismissed notifications are excluded from user lists and unread counts.

## Integrations

- Workspace shell uses notification APIs for badges and drawer content.
- Admin console uses admin notification APIs and shared audience constants.
- Payment reminders can create student-targeted notifications with explicit `target_user_ids`.
- Supabase RLS policies and app-layer filtering both matter; live DB verification is separate.

## Loading And Errors

- Notification drawer and badge loading are local client states.
- User API failures return typed notification errors.
- Admin create/update validation rejects invalid target role combinations, including `all` mixed with other roles.
- Missing notification state returns 404 for read/dismiss when the target notification is unavailable.

## Tests

Current focused coverage includes:

- RBAC role-targeted visibility tests.
- Empty/error RBAC fail-closed tests for role-targeted notifications.
- Explicit user target and `all` audience tests.
- User-state scoping tests.
- Admin notification route and service tests.
- Dashboard notification drawer and lifecycle tests.

Coverage gaps:

- Live DB policy verification for active target databases is covered by smoke scripts, not unit tests.
- Full e2e drawer interactions can be added later if notification UX changes.

## Operations

- For missing notifications, inspect `is_active`, `published_at`, `expires_at`, account creation date, `target_roles`, `target_user_ids` and user state.
- For role-targeting issues, inspect `actor.rbacStatus` and `actor.rbacRoles`, not `profiles.role`.
- For admin form issues, verify target audience constants and validation.

## Known Limitations

- `target_roles` keeps its legacy column name for compatibility but now means RBAC role keys.
- The feature does not provide a full audience segmentation system.
- Live RLS verification must be recorded separately before claiming production DB closure.
