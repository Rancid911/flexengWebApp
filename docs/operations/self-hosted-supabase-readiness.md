# Self-Hosted Supabase Readiness

Status: draft  
Audience: maintainers, database operators, release engineers  
Owner area: operations  
Last reviewed: 2026-06-13  
Source of truth: bootstrap preparation runbook  
Related code: `supabase/bootstrap/`, `supabase/migrations/`, `.env.example`  
Related tests: `tests/unit/access-docs-consistency.test.ts`

## Why A Baseline Is Required

The repository contains 76 incremental migrations through cutoff
`20260612203357`, but it does not contain the original definitions of all core
tables, the legacy dashboard view, or legacy public RLS helper functions. A
clean replay therefore cannot reconstruct the current database.

The bootstrap bundle uses a current-state snapshot at the cutoff. The raw
snapshot contains both application DDL and Supabase-managed platform DDL. It is
stored under `supabase/bootstrap`, outside `supabase/migrations`, and is a
reference artifact rather than an apply target.

## Safety Boundary

This bootstrap bundle is not an active migration.
Do not apply it to the existing Supabase Cloud project.
Use it only for clean self-hosted/local rehearsal.

`schema.candidate.sql` must never be applied directly. The future apply target
is `application-baseline.candidate.sql`, after it has been extracted by
comparison with an untouched platform schema from a pinned self-hosted
Supabase version.

The target self-hosted tag, PostgreSQL major, and apply-time psql version are
currently `TBD`. Production access, data migration, and the actual rehearsal
require separate approval.

## Future Clean Bootstrap

1. Pin the self-hosted Supabase tag, PostgreSQL major, and compatible tooling.
2. Start an untouched disposable Supabase platform using that tag.
3. Compare its schema-only dump with the raw cutoff snapshot.
4. Extract and review only application-owned DDL into
   `application-baseline.candidate.sql`.
5. On a fresh disposable platform, apply the application baseline.
6. Apply reviewed deterministic rows from `reference-data.candidate.sql`.
7. Mark migrations through the cutoff as covered/applied; do not replay them
   over the current-state snapshot.
8. Apply migrations newer than the cutoff normally.
9. Run the read-only `verification.sql`.
10. Connect the Next.js application only after schema, RLS, grants, Auth, and
   Storage checks pass.

The exact migration-history recording command must be selected from the
installed Supabase CLI help during the rehearsal. Do not run migration repair
against a remote project as part of preparation.

## Obtaining The Schema

Use a PostgreSQL connection string, preferably for a staging clone or a
read-only PostgreSQL user. A Supabase service-role JWT authorizes Data API/Auth
operations; it is not a PostgreSQL protocol credential and cannot be used by
`pg_dump`.

The connection string is available from the Supabase Dashboard database
connection settings. Never commit it. Write the dump to a temporary file:

```bash
pg_dump "$DATABASE_URL" \
  --schema-only \
  --no-owner \
  --file /tmp/supabase-schema-candidate.sql
```

Do not use `--no-privileges` by default. Runtime access depends on grants for
schemas, tables, sequences, and routines. If privileges are excluded, capture
them separately and verify them before accepting the candidate.

Do not dump or commit application data, `auth.users`, students, teachers,
payments, attempts, personal data, secrets, or uploaded files.

For a Supabase CLI dump, first run `supabase db dump --help` and verify the
syntax and privilege behavior for the installed version. Do not run the dump
without separate approval.

## Raw And Sanitized Artifacts

- `schema.candidate.sql`: full raw schema snapshot from PostgreSQL 17.6,
  produced by pg_dump 18.4. It contains psql 18
  `\restrict`/`\unrestrict`, managed schemas, publications, event triggers,
  platform ACLs, and application DDL. It is not directly replayable.
- `application-baseline.candidate.sql`: application-owned apply target for an
  already initialized platform. It is currently a non-executable extraction
  checklist pending platform comparison.
- `reference-data.candidate.sql`: deterministic application rows. Exact
  `avatars` and `crm-assets` bucket rows are recorded; RBAC and singleton rows
  remain under review.
- `verification.sql`: read-only checks for the combined initialized platform,
  application baseline, reference data, and post-cutoff migrations.

Managed platform schemas must be created by the pinned self-hosted Supabase
stack. Application triggers attached to `auth.users`, policies on
`storage.objects`, app-required extensions, and grants on managed objects
remain cross-managed review items.

## Configuration Outside The Baseline

Self-hosting also requires environment-specific configuration that is not
fully represented by application DDL:

- Auth Site URL and redirect allowlist;
- SMTP host, credentials, sender, confirmation behavior, and templates;
- JWT secret and token lifetime;
- Data API exposed schemas;
- Storage backend, public URLs, file limits, and object migration;
- application, payment-provider, and Redis environment variables.

Store only placeholders in `.env.example`; use the deployment secret store for
real values.

## Development Rule After Cutoff

After baseline cutoff, every database change must be represented by a normal
migration. No manual-only database changes in Supabase Studio.

This includes:

- tables and columns;
- indexes, constraints, and foreign keys;
- functions/RPCs and triggers;
- RLS enablement and policies;
- grants and revokes;
- Storage buckets and policies;
- Auth-related application SQL.

## Acceptance

The project becomes ready for an actual rehearsal only after the target
platform is pinned, a platform comparison is completed, executable
application DDL is reviewed, and required reference rows are complete. Static
files in this repository are not proof that a self-hosted instance matches the
current Supabase Cloud database.
