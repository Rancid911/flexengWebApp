# Test Strategy

Status: current  
Audience: engineers, maintainers, reviewers, AI coding agents  
Owner area: testing  
Last reviewed: 2026-05-25  
Source of truth: testing guide; scripts and tests remain implementation sources  
Related code: `package.json`, `vitest.config.ts`, `playwright.config.ts`, `scripts/check-architecture.mjs`, `scripts/check-e2e-env.mjs`, `tests/`  
Related tests: `tests/README.md`, `tests/unit/access-docs-consistency.test.ts`

## Overview

The test strategy combines static architecture checks, Vitest unit/component/route tests, Playwright smoke/e2e tests, SQL smoke scripts and manual release checks. Do not overclaim full e2e coverage; many high-risk boundaries are covered by focused unit tests plus smoke/runbook verification.

## Test Categories

| Category | Command / Location | Purpose |
| --- | --- | --- |
| Architecture checker | `npm run check:architecture` | Enforces app boundaries, API guard patterns, service-role allowlist and blocked client Supabase usage. |
| Lint | `npm run lint` | ESLint quality gate. |
| Build | `npm run build` | Next.js build and TypeScript integration. |
| Unit/component/route tests | `npm run test:unit` or `npx vitest run ...` | Feature logic, route handlers, guards, components and docs consistency. |
| Docs consistency | `tests/unit/access-docs-consistency.test.ts` | Ensures current docs/index/source links remain discoverable. |
| E2E/smoke UI | `npm run test:smoke:ui` | Public/UI smoke without auth secrets. |
| Auth smoke | `npm run test:smoke` | Playwright smoke requiring `E2E_*` credentials. |
| Full e2e | `npm run test:e2e` | Playwright suite. |
| SQL smoke | `supabase/sql-editor/*smoke*.sql` | Live DB/RLS/RPC/storage verification. |

## Recommended Sets By Change Type

Documentation-only:

```bash
npx vitest run tests/unit/access-docs-consistency.test.ts
npm run check:architecture
npm run lint
npm run build
```

Access/RBAC/request-context:

```bash
npx vitest run tests/unit/permissions.test.ts tests/unit/permissions-vocabulary.test.ts tests/unit/auth-request-context.test.ts tests/unit/auth-request-context-rpc.test.ts tests/unit/admin-auth.test.ts tests/unit/workspace-read-route-rbac.test.tsx
npm run check:architecture
```

Search:

```bash
npx vitest run tests/unit/search-api-route.test.ts tests/unit/middleware-auth.test.ts tests/unit/search-service.test.ts tests/unit/search-documents-source.test.ts tests/unit/search-rpc-grants.test.ts tests/unit/search-page.test.tsx tests/unit/search-page-view.test.tsx
```

Payments/billing:

```bash
npx vitest run tests/unit/payments-api-route.test.ts tests/unit/payments-yookassa-routes.test.ts tests/unit/payments-server.test.ts tests/unit/payments-queries.test.ts tests/unit/billing-server.test.ts tests/unit/billing-adjustments-route.test.ts tests/unit/admin-payments-control-routes.test.ts
```

Storage/media:

```bash
npx vitest run tests/unit/media-api-routes.test.ts tests/unit/media-service.test.ts tests/unit/settings-profile-route.test.ts tests/unit/settings-profile-service.test.ts tests/unit/crm-api-routes.test.ts
```

Schedule:

```bash
npx vitest run tests/unit/schedule-routes.test.ts tests/unit/schedule-page.test.tsx tests/unit/schedule-client.test.tsx tests/unit/schedule-utils.test.ts tests/unit/teacher-workspace-routes.test.ts
```

UI/loading/workspace shell:

```bash
npx vitest run tests/unit/workspace-layouts.test.tsx tests/unit/dashboard-shell-client.test.tsx tests/unit/student-route-loading.test.tsx tests/unit/data-loading-catalog.test.ts
npm run test:smoke:ui
```

Admin/content:

```bash
npx vitest run tests/unit/admin-auth.test.ts tests/unit/admin-users-route.test.ts tests/unit/admin-tests-route.test.ts tests/unit/admin-blog-routes.test.ts tests/unit/admin-course-modules-route.test.ts tests/unit/admin-word-card-sets.test.ts
```

## SQL Smoke Strategy

SQL smoke is live environment verification, not a unit-test substitute:

- Run production-safe metadata smoke when production is the only available DB.
- Run full RLS matrix on branch, clone, local or staging DB.
- Run RPC hardening smoke after RPC/grant/search/dashboard changes.
- Run storage smoke after storage policy or bucket posture changes.

See `docs/operations/smoke-tests.md` and `docs/access-control/verification-status.md`.

## Manual / E2E Gaps

- Workspace one-shell and loading/skeleton UX still benefit from browser/manual route traversal.
- Provider/payment flows require sandbox-provider checks.
- Full row-level RLS matrix requires a target DB where fixture setup is safe.
- Not every feature has full Playwright coverage.

## Review Rules

- Tests should match the risk of the change.
- Do not weaken tests to fit stale behavior; update stale tests only when code source of truth has intentionally changed.
- Do not treat hidden navigation as security in tests.
- Do not treat mocked unit tests as proof of live DB RLS.

## Related Docs

- `tests/README.md`
- `docs/operations/release-verification.md`
- `docs/operations/smoke-tests.md`
- `docs/access-control/README.md`
- `docs/access-control/verification-status.md`
