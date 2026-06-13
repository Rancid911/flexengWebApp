# Live RLS Smoke Harness

`supabase/sql-editor/rls_smoke_matrix_20260521.sql` is a verification-only smoke script for an already migrated Supabase database.

If production is the only available database, run `supabase/sql-editor/rls_metadata_smoke_20260521.sql` first. It is catalog-only and uses `begin read only`, so it does not create fixture users or rows.

Run it after all migrations through PR11D are applied. The script checks active database state, not migration text:

- `pg_class.relrowsecurity` for critical tables.
- `pg_policies` for replaced raw-role policies.
- Live row access under simulated `authenticated` JWT contexts for student, teacher, manager and admin actors.
- Service-only table closure for `payment_webhook_events`.
- Direct table closure for `search_documents`.

The full matrix script creates deterministic `rls-smoke-*` fixtures inside a single transaction and ends with `rollback`, so successful runs do not leave test users or rows behind. If it raises an exception, roll back the SQL Editor transaction before rerunning.

## Production-Safe Metadata Smoke

Use this script when you cannot create a database branch or staging clone:

```text
supabase/sql-editor/rls_metadata_smoke_20260521.sql
```

It checks:

- required table presence;
- RLS enabled on critical tables;
- no active replaced-domain raw-role policies;
- CRM, notification and payment reminder policies use RBAC helpers;
- `search_documents` and `payment_webhook_events` have no direct public/anon/authenticated table policies;
- `storage.objects` has RLS enabled when present.

It does not check real row-by-row access because it intentionally creates no data and switches no roles.

## Supabase SQL Editor

1. Open the target project in Supabase.
2. Confirm the database has all migrations applied.
3. For production-only verification, paste and run `supabase/sql-editor/rls_metadata_smoke_20260521.sql`.
4. For a branch, clone, local DB, or staging DB, paste and run `supabase/sql-editor/rls_smoke_matrix_20260521.sql`.
5. Expected final result:

```text
status: rls metadata smoke checks passed
```

The full matrix script instead returns `status: rls smoke checks passed`.

Any `RLS smoke failed: ...` exception means either migration drift or a real policy regression. Fix that in a focused DB PR; do not loosen the smoke script to make a failing policy pass.

## psql

From the repository root, use a privileged database URL.

Production-safe metadata smoke:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/sql-editor/rls_metadata_smoke_20260521.sql
```

Full row-access matrix:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/sql-editor/rls_smoke_matrix_20260521.sql
```

The full matrix script must run with a privileged SQL role because it creates fixture users/rows before switching to `authenticated` with `set local role authenticated`.

## What It Covers

- Student own-row access versus other-student denial.
- Teacher assigned-student access versus unassigned denial.
- Manager/admin RBAC-helper access even when fixture `profiles.role` is intentionally set to `student`.
- Raw-role policy cleanup for migrated domains.
- RBAC-helper policy presence for CRM, notifications and payment reminders.
- Service-only and search direct-table closure.

This harness does not add policies, permissions, app code, route guards or service-role changes. It is a pre-release live DB confidence check.
