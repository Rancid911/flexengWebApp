# Architecture Refactor Backlog

This backlog records remaining architecture cleanup after the April architecture audit and the completed service/repository, legacy-exit, schedule and large client component cleanup work. Keep each item as a focused PR unless explicitly grouped.

## Active Backlog

None. New cleanup work should be added here only when a concrete pain point is identified during feature work, bug fixing, or review.

## Completed Architecture Refactors

- Admin users flow: create/update/delete orchestration moved behind `lib/admin/user-service.ts` and `lib/admin/user.repository.ts` while route contracts stayed stable.
- Public leads: `/api/leads` delegates to CRM public lead service; CRM lead persistence lives behind CRM boundaries.
- Practice split: activity detail, catalog, topics/subtopic and overview/recommendations now live in focused modules; the old practice legacy facade has been removed.
- Teacher workspace split: roster, dashboard agenda, dashboard aggregate, profile sections, notes, lesson follow-up and placement/homework mutations now live in focused modules; the old teacher workspace legacy facade has been removed.
- Student dashboard aggregation boundary: `lib/dashboard/student-dashboard.ts` is now a read-only facade/orchestrator with focused `types`, `descriptors`, `mappers` and `repository` modules.
- Schedule query/client cleanup: schedule query raw access lives behind repository/mapper/descriptors modules, and staff schedule UI sections are split into focused presentational files.
- Large client components cleanup: admin console, admin test drawer, teacher student profile components, student payments client and settings profile UI are split into focused hooks/helpers/sections while preserving behavior.
- Settings profile API/service boundary: settings profile UI uses focused presentational sections and `use-settings-form-state.ts` keeps the public hook contract, while profile persistence, avatar storage, email update and password update go through `/api/settings/profile` and `lib/settings/profile.service.ts`.
- CRM background upload boundary: CRM settings background upload now goes through protected `/api/crm/settings/background`; the CRM client no longer calls Supabase Storage directly.
- Admin blog API cleanup: `app/api/admin/blog/*` routes are transport-only; blog persistence and orchestration live in `lib/admin/blog.repository.ts` and `lib/admin/blog.service.ts`.
- Admin notifications API cleanup: admin and user notification routes delegate to notification service/repository boundaries instead of owning direct Supabase access.
- API error handling: generic `lib/server/http.ts` exists; public search/blog/leads and YooKassa payment API routes use the generic wrapper where appropriate.
- Repository layer: CRM leads/settings, admin users, admin tests, admin word card sets, teacher dossier routes, billing ledger, homework assignments and practice use cases now have repository/service or focused query modules.

## Future Cleanup Candidates

- Treat future cleanup as opportunistic and tied to concrete feature or bug work.
- Avoid creating broad refactor epics unless a new audit identifies specific runtime or maintainability risk.

## Final Architecture Verification Checklist

- Legacy query facades are absent from runtime source.
- Active backlog is `None`.
- CI and local hardening include `npm run check:architecture`.
- `createAdminClient`, raw `.from()` and raw `.rpc()` are blocked in API route handlers by the architecture check.
- `createAdminClient` is blocked in server pages by the architecture check.
- Repository files are checked for route/UI/audit imports.
- Future refactor work must be tied to a concrete issue, feature, performance bottleneck, or review finding.
- Required final checks: `npm run check:architecture`, `npm run lint`, `npx tsc --noEmit`, `npm run build` and relevant targeted tests.
- Targeted smoke/tests should cover the main stabilized surfaces when touched: CRM, admin, schedule, settings and payments.

## Non-Runtime Cleanup

- `.DS_Store` files may exist locally and should not be included in commits.
- If `.DS_Store` files appear in git status in the future, delete them in a separate cleanup commit and ensure ignore rules cover them.
- Verification: `git status --short`.
