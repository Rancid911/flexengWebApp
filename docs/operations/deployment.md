# Deployment

Status: partial  
Audience: release operators, maintainers, engineers  
Owner area: operations  
Last reviewed: 2026-05-25  
Source of truth: runbook; deployment pipeline details need confirmation  
Related code: `package.json`, `next.config.ts`, `.env.example`, `supabase/migrations/`, `supabase/sql-editor/`, `playwright.config.ts`  
Related tests: `tests/README.md`, `tests/unit/access-docs-consistency.test.ts`

## When To Use

Use this runbook when preparing a preview, staging or production deploy. The app is compatible with Vercel-style Next.js deployment, but the exact hosted pipeline and project settings are needs confirmation in this repo.

## Deployment Target Assumptions

- Framework: Next.js App Router.
- Node engine: 24.x.
- Build command: `npm run build`.
- Runtime start command for local production server: `npm run start`.
- Vercel is the expected deployment target from project context, but no `vercel.json` was found.
- Supabase migrations are stored in `supabase/migrations/`; applying them to a target DB is an operational step outside `next build`.

## Pre-Deploy Checks

Run before deploy:

```bash
npm run check:architecture
npm run lint
npm run build
npx vitest run tests/unit/access-docs-consistency.test.ts
```

For high-risk changes, also run focused tests from `docs/testing/test-strategy.md`.

## Environment Variables

Set environment variables in the hosting platform. See `docs/operations/env-vars.md`.

Required categories:

- Supabase public URL and publishable/anon key.
- Supabase service-role key for server-only allowlisted privileged boundaries.
- YooKassa provider credentials and webhook token for payment flows.
- Site/canonical URL if needed for payment return URLs and origin behavior.

Do not expose service-role or provider secret variables to client bundles.

## Supabase Migration Expectations

- Confirm migrations have been applied to the target Supabase project before declaring release complete.
- Static migration files are not proof of active DB state.
- Run production-safe metadata smoke if production is the only available target.
- Run full row-level smoke only on branch, clone, local or staging DB unless explicitly approved.

See `docs/rls-smoke-harness.md` and `docs/operations/smoke-tests.md`.

## Deployment Steps

1. Confirm working tree/PR scope.
2. Run pre-deploy checks.
3. Confirm environment variables for the target.
4. Apply required Supabase migrations using the team's approved process. This repo does not define that process; needs confirmation.
5. Deploy through the hosting provider.
6. Run post-deploy smoke checks.
7. Record smoke results and deferred risks.

## Post-Deploy Smoke Checklist

- Open public landing and `/login`.
- Check authenticated login/logout.
- Check workspace shell navigation.
- Check `/api/search` guest and authenticated behavior.
- Check key protected areas: dashboard, schedule, CRM, payments, admin.
- Run production-safe RLS metadata smoke if appropriate.
- Run storage metadata smoke if storage changed.
- Run provider/payment sandbox smoke if payment changed.

## Rollback Notes

- Application rollback depends on hosting provider deployment history; exact Vercel rollback procedure is needs confirmation.
- DB rollback is not automatic. Do not assume migrations can be rolled back safely without a dedicated DB rollback plan.
- Provider/payment side effects cannot always be undone; inspect YooKassa/provider state before retrying failed flows.

## Related Docs

- `docs/operations/release-verification.md`
- `docs/operations/smoke-tests.md`
- `docs/access-control/verification-status.md`
- `docs/rls-smoke-harness.md`
- `docs/operations/env-vars.md`
