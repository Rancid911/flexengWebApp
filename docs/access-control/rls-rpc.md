# RLS And RPC Boundary

Status: current  
Audience: engineers reviewing database access, SQL functions and release verification  
Owner area: access-control  
Last reviewed: 2026-05-25  
Source of truth: summary; migrations and smoke scripts are implementation/verification sources  
Related code: `supabase/migrations/`, `supabase/sql-editor/`, `lib/search/`, `lib/admin/dashboard-metrics.ts`  
Related tests: `tests/unit/search-rpc-grants.test.ts`, `tests/unit/search-documents-source.test.ts`, `tests/unit/admin-dashboard-metrics-server.test.ts`

Application guards decide whether a request should reach a service. RLS and RPCs are the database boundary that must still enforce safe data access when the database is called.

## RLS Expectations

- Critical user data tables should have RLS enabled in the active database.
- Policies should use RBAC helpers where domain access depends on roles, permissions or scopes.
- Raw `profiles.role` policies are historical unless explicitly documented as non-authoritative.
- Own, assigned and all-scope access should be represented by policy/helper logic or narrow RPCs.
- Service-only tables, payment webhook data and direct search documents table access should stay closed to normal clients.

## RPC Expectations

- Security-definer functions must set a safe `search_path`.
- Grants must be intentional for `anon`, `authenticated` and service roles.
- Privileged visibility must be derived from `auth.uid()` and DB RBAC, not caller-supplied role/capability/scope parameters.
- RPCs that bypass table RLS must be narrow and independently guarded.

## Search RPC

`/api/search` is optional-auth hybrid. The search RPC can be executable by `anon` for public search, but unauthenticated execution must return public-only rows. Authenticated private expansion is derived from `auth.uid()` plus DB RBAC/linked scope. Client-supplied privileged parameters must not upgrade visibility.

## Verification

Use `docs/rls-smoke-harness.md` for live verification instructions:

- `supabase/sql-editor/rls_metadata_smoke_20260521.sql` is production-safe metadata smoke.
- `supabase/sql-editor/rls_smoke_matrix_20260521.sql` is the full row-access matrix for branch, clone, local or staging databases.
- RPC hardening smoke is separate from full RLS and storage verification.

Static migrations are not proof of live DB state. Do not claim RLS is production-verified unless a target database smoke run is recorded.
