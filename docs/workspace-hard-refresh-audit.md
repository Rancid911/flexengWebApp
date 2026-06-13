# Workspace Hard Refresh Audit

For the broader current access-control model and intentional compatibility layers, start with `docs/access-control-current-state.md`.

## Current State

Workspace pages still live under separate route groups for organization, but the authenticated workspace shell is owned by the common `app/(workspace)/layout.tsx` layout.

- `(staff-zone)` is a thin passthrough group for staff routes.
- `(teacher-zone)` is a thin passthrough group for teacher/student-directory routes.
- `(student-zone)` is a thin passthrough group for student-specific route aliases and settings.
- `(shared-zone)` is a thin passthrough group for shared workspace routes.
- `(search-zone)` is a thin passthrough group if used by future workspace search routing.

The shell chrome mode is derived from pathname intent rather than physical route-group ownership. Crossing `(staff-zone)`, `(teacher-zone)`, `(student-zone)` and `(shared-zone)` should no longer remount a separate zone-owned shell during normal internal workspace navigation.

There are two separate causes behind the remaining hard-refresh/remount reports:

- self-wrapped shell routes outside `app/(workspace)` that serve mixed public/authenticated behavior, currently `/search`;
- Explicit redirects or path rewrites that force the user from one role path to another.

The first cause is intentionally deferred because `/search` has public and authenticated modes. The second cause should stay limited to actual guard failures or intentional route aliases, not permissioned workspace navigation.

## PR14E Boundary

Staff users who have access to student directory/profile routes can now stay on `/students` and `/students/[studentId]` without being redirected to the `/admin/students` mirror. Admin routes keep their existing `/admin/students` behavior.

Authorization semantics are unchanged: existing route guards still decide whether the actor may load the page, and RLS/data loaders still enforce row access.

Normal workspace navigation should stay `next/link`-driven. The known intentional full-page navigation cases are outside regular internal workspace links:

- placement navigation guard preserving an in-progress placement attempt before leaving the flow;
- payment provider confirmation redirects;
- logout/root fallback after session termination.

## Remaining Work

The main one-shell boundary is closed for workspace route groups. Remaining follow-up should be limited to special routes and verification:

Safe cleanup order:

1. Keep route/page/API permission semantics unchanged.
2. Keep `/search` self-wrapped unless a separate PR can align its mixed public/authenticated shell behavior without changing `/api/search` hybrid visibility semantics. `search.ui` is a UI capability, not the API result gate.
3. Keep explicit redirect removal and authorization changes out of the same PR.
4. Document any intentional full-page navigation exceptions.
