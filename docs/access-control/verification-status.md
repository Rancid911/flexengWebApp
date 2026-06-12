# Access Verification Status

Status: current  
Audience: release owners, engineers, security reviewers  
Owner area: access-control  
Last reviewed: 2026-06-12
Source of truth: summary; individual commands and smoke scripts are verification sources  
Related code: `scripts/check-architecture.mjs`, `supabase/sql-editor/`, `tests/unit/`  
Related tests: `tests/unit/access-docs-consistency.test.ts`

This file separates static/local evidence from live Supabase verification. Static migrations and passing unit tests are not proof that a target database has the expected active policies, grants or storage metadata.

## Static And Local Checks

| Check | Purpose | Status meaning |
| --- | --- | --- |
| `npm run check:architecture` | Enforces architecture and service-role allowlist rules | Static repo check only |
| `npm run lint` | TypeScript/ESLint quality gate | Static repo check only |
| `npm run build` | Next.js build/type integration | Static repo check only |
| Unit tests | Guard, permission, search, media and service behavior | Local mocked or test-runtime evidence |
| `tests/unit/access-docs-consistency.test.ts` | Docs index/source-link consistency | Documentation discoverability only |

## Live DB Smoke Categories

| Smoke | Script/doc | Current interpretation |
| --- | --- | --- |
| RPC hardening smoke | `supabase/sql-editor/rpc_hardening_smoke_20260521.sql` | Verifies selected RPC grants and spoofing behavior when run on a target DB. A recorded pass covers this script only. |
| RLS metadata smoke | `supabase/sql-editor/rls_metadata_smoke_20260521.sql` | Production-safe catalog verification; does not prove row-level access. |
| Full RLS matrix | `supabase/sql-editor/rls_smoke_matrix_20260521.sql` | Best row-level policy confidence; should run on branch, clone, local or staging DB. |
| Practice attempt RLS cleanup | `supabase/sql-editor/practice_attempt_rls_cleanup_smoke.sql` | Verifies canonical attempt/answer policies, actor read/write boundaries, anon closure and atomic RPC continuity. |
| Storage metadata smoke | `supabase/sql-editor/storage_access_inventory_20260521.sql` | Verifies bucket/storage metadata posture on the target DB. |

## Manual / E2E Verification

- Workspace shell one-shell behavior requires browser/manual or e2e navigation verification.
- Loading/skeleton UX requires browser/manual or visual verification.
- Provider/payment flows require sandbox-provider verification, not only unit tests.

## Release Rule

Before calling access/security fully closed, record:

1. Static checks and focused unit tests.
2. Target database RLS/RPC/storage smoke status.
3. Any intentional exceptions that remain deferred.

If a check has not been run on the target environment, mark it as `needs live verification` rather than complete.
