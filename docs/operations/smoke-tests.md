# Smoke Tests

Status: current  
Audience: release owners, engineers, security reviewers  
Owner area: operations  
Last reviewed: 2026-05-25  
Source of truth: runbook; scripts are implementation sources  
Related code: `supabase/sql-editor/`, `tests/e2e/`, `scripts/check-e2e-env.mjs`, `playwright.config.ts`  
Related tests: `tests/README.md`, `tests/e2e/*.spec.ts`, `tests/unit/access-docs-consistency.test.ts`

## Purpose

Smoke tests provide confidence that the active environment matches the expected app, DB, storage and provider posture. They are not a replacement for unit tests or code review.

## SQL Smoke Scripts

| Smoke | Script | Environment | Notes |
| --- | --- | --- | --- |
| RLS metadata smoke | `supabase/sql-editor/rls_metadata_smoke_20260521.sql` | Production-safe | Catalog-only, read-only style metadata check. Does not prove row-level access. |
| Full RLS matrix | `supabase/sql-editor/rls_smoke_matrix_20260521.sql` | Branch/staging/local preferred | Creates deterministic fixtures inside a rollback transaction and simulates actors. Do not run on production without explicit approval. |
| RPC hardening smoke | `supabase/sql-editor/rpc_hardening_smoke_20260521.sql` | Target DB | Verifies selected RPC grants and spoofing protections. |
| Storage inventory smoke | `supabase/sql-editor/storage_access_inventory_20260521.sql` | Target DB | Read-only storage metadata posture check. |

See `docs/rls-smoke-harness.md`, `docs/access-control/verification-status.md`, `docs/features/search.md` and `docs/features/storage-media.md`.

## Browser / Playwright Smoke

Scripts:

```bash
npm run test:smoke:ui
npm run test:smoke
npm run test:e2e
```

- `test:smoke:ui` runs smoke UI tests without auth secrets.
- `test:smoke` runs `npm run test:check` first and requires `E2E_*` auth env variables.
- `test:e2e` runs the Playwright suite.

Playwright defaults to `http://127.0.0.1:3100` and starts `npm run build && npm run start -- --hostname <host> --port <port>` unless `PLAYWRIGHT_EXTERNAL_SERVER=1`.

## Provider / Payment Smoke

Payment smoke is not fully represented by unit tests. For payment changes:

- use provider sandbox credentials where possible;
- create a checkout for a current student;
- verify return/status polling;
- verify webhook token behavior in a safe environment;
- confirm billing ledger sync after succeeded payment.

See `docs/features/payments-billing.md`.

## How To Record Results

Record the final status line or command output, target environment, date/time and commit/deployment id.

Expected examples:

```text
status: rls metadata smoke checks passed
status: rls smoke checks passed
rpc hardening smoke checks passed
storage metadata smoke checks passed
```

## If Smoke Fails

- Do not loosen the smoke script to pass a failing policy.
- Confirm the target DB has expected migrations.
- Identify whether failure is app code, migration drift, active DB policy/grant drift or missing fixture/setup.
- Fix in the smallest focused PR.
- Re-run only the failed smoke and any related focused tests.

## Related Docs

- `docs/operations/release-verification.md`
- `docs/access-control/verification-status.md`
- `docs/rls-smoke-harness.md`
- `docs/storage-access-inventory.md`
- `docs/features/search.md`
- `docs/features/payments-billing.md`
