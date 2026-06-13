# Release Verification

Status: current  
Audience: release owners, maintainers, security reviewers  
Owner area: operations  
Last reviewed: 2026-05-25  
Source of truth: runbook; live results must be recorded per release  
Related code: `package.json`, `scripts/check-architecture.mjs`, `supabase/sql-editor/`, `tests/unit/`, `tests/e2e/`  
Related tests: `tests/README.md`, `tests/unit/access-docs-consistency.test.ts`

## Purpose

This checklist separates static/local checks from live Supabase, provider and browser verification. Static checks are required, but they are not live DB proof.

## Static / Local Checks

Run for most release candidates:

```bash
npm run check:architecture
npm run lint
npm run build
npx vitest run tests/unit/access-docs-consistency.test.ts
```

Recommended focused suites by high-risk area:

```bash
npx vitest run tests/unit/permissions.test.ts tests/unit/auth-request-context.test.ts tests/unit/admin-auth.test.ts
npx vitest run tests/unit/search-api-route.test.ts tests/unit/search-service.test.ts tests/unit/search-documents-source.test.ts
npx vitest run tests/unit/media-api-routes.test.ts tests/unit/media-service.test.ts
npx vitest run tests/unit/payments-api-route.test.ts tests/unit/payments-yookassa-routes.test.ts tests/unit/billing-server.test.ts
npx vitest run tests/unit/schedule-routes.test.ts tests/unit/schedule-page.test.tsx
```

Use `npm run test:unit` for the full unit suite when time allows.

## Live / Manual Checks

- RLS metadata smoke: production-safe catalog check.
- RPC hardening smoke: validates search/dashboard-style RPC grant/spoofing behavior when run on target DB.
- Storage metadata smoke: verifies bucket/storage metadata posture.
- Full RLS matrix: run only on branch, clone, local or staging DB unless explicitly approved.
- Provider/payment sandbox verification: required for payment/provider changes.
- Workspace shell navigation: manually/e2e verify no hard-refresh regression.
- Loading/skeleton UX: manually verify main workspace routes.
- Search guest/auth: verify public-only guest and RBAC-scoped authenticated results.
- Media/avatar/CRM background: verify guarded app routes and expected cache/media behavior.

## Suggested Browser Sequence

- Public: `/`, `/articles`, `/search`.
- Auth: `/login`, `/dashboard`, `/schedule`, `/students`, `/crm`, `/admin`, `/settings/profile`, `/settings/payments`.
- User provisioning: run `supabase/sql-editor/user_provisioning_metadata_smoke.sql` and expect its passing status, then run `supabase/sql-editor/user_provisioning_repair_report.sql` and expect no rows. Verify public signup produces matching `profiles`, `user_roles` and `students` rows, and guarded admin creation produces the requested linked identity.
- Search: guest `/api/search?q=english`, authenticated workspace search and `/search`.
- Media: own avatar route and CRM background route with authorized account.

## Recording Results

Record:

- date/time;
- target environment;
- commit/build/deployment id;
- commands run;
- smoke scripts run;
- pass/fail output;
- deferred checks and risk owner.

If no non-production DB exists, record the full RLS matrix as deferred risk. Do not mark it complete based on metadata smoke.

## Failure Handling

- Static check failure: fix before release unless clearly unrelated and approved.
- RLS/RPC/storage smoke failure: treat as DB drift or policy regression; fix in a focused DB PR.
- Provider smoke failure: check env/provider credentials, webhook token and transaction state.
- Browser smoke failure: classify as routing, auth/session, data, or UI regression before broad changes.

## Related Docs

- `docs/access-control/verification-status.md`
- `docs/operations/smoke-tests.md`
- `docs/rls-smoke-harness.md`
- `docs/testing/test-strategy.md`
