# Workspace Loading Skeleton Contract

Status date: 2026-05-25

This document defines the current loading and skeleton boundary for the authenticated workspace after the one-shell migration.

For the broader access and loading model, start with `docs/foundations-access-and-loading.md` and `docs/access-control-current-state.md`.

## Loading Levels

| Level | Owner | Purpose | Rules |
| --- | --- | --- | --- |
| Workspace fallback | `app/(workspace)/loading.tsx` | Neutral content fallback when a route-specific fallback is unavailable | Must not render sidebar/header chrome, must not imitate a specific page, and must not import page-specific route skeletons |
| Page fallback | Route-local `loading.tsx` | Initial loading for a specific workspace page | Should match the final page structure closely enough to avoid layout surprise |
| Section fallback | Local `Suspense` or section component | Independent async block inside an already loaded page | Must stay local and must not duplicate a full-page skeleton |
| Client interaction | Client state, transitions, forms, drawers, dropdowns | Filters, mutations, inline refreshes, and utility panels | Must stay small and local |

## Current Page Fallbacks

The high-traffic workspace routes have route-local skeletons:

- `/dashboard`
- `/schedule`
- `/students`
- `/students/[studentId]`
- `/admin`
- `/crm`
- `/settings/profile`
- `/settings/payments`

Less-used workspace routes may use the neutral workspace fallback until a later visual polish pass.

## Screen-accurate Skeleton Rule

A route-level skeleton must match the final page structure at the layout level. It does not need pixel-perfect spacing, but it should show the same kind of page: dashboard cards for dashboards, filter/list rows for directory pages, kanban columns for CRM, form sections for settings, article blocks for article pages, and trainer cards for flashcard training.

Do not use one generic skeleton for incompatible pages. In particular:

- broad workspace fallback must stay neutral and must not become a page-specific skeleton;
- route-specific skeletons should be used only when they can represent the actual final screen;
- section/client loading must stay local and must not duplicate a full-page fallback;
- adding a skeleton is not always the correct fix. Static, redirect-only, or simple pages can remain neutral or have no dedicated skeleton when a route skeleton would be misleading.

Before adding or changing route skeletons, update `docs/loading-screen-inventory.md` with the route's final component, loading source, current problem, and intended action.

## Route Group Rule

Workspace route groups remain organizational after the one-shell migration. Do not add route-group-level `loading.tsx` files under:

- `(shared-zone)`
- `(staff-zone)`
- `(student-zone)`
- `(teacher-zone)`
- `(search-zone)`

Route-group loading would reintroduce broad, zone-shaped fallbacks and make it easier to duplicate page-level skeletons.

## Section and Client Loading

Keep these local loading states:

- dashboard deferred sections;
- practice card-level fallbacks;
- schedule filter transition status;
- admin console list and metric skeletons;
- notification and search dropdown skeletons;
- settings profile client runtime loading while the form has no runtime snapshot.

These states are not page fallbacks. They should appear only inside an already rendered page or utility surface.

## Known Exceptions

- `/search` remains a mixed public/authenticated route with its own shell boundary. Its loading behavior should be reviewed separately from the workspace route tree.
- Settings profile still has transitional client runtime loading. Do not move that form runtime state into the workspace layout.

## Future Rules

- Add route-local `loading.tsx` for a page only when the skeleton can match the final page structure.
- Use the shared presentational skeleton primitives; do not add auth, RBAC, API calls, or data loading to skeleton components.
- Do not use navigation visibility, shell mode, or route group ownership as a loading boundary.
- Do not show two full-page skeletons for one route load.
