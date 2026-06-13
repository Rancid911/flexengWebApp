# Supabase Bootstrap Bundle

This bootstrap bundle is not an active migration.
Do not apply it to the existing Supabase Cloud project.
Use it only for clean self-hosted/local rehearsal.

The bundle records the preparation work for a current-state schema baseline at
cutoff `20260612203357`. Files under this directory are deliberately outside
`supabase/migrations`, so the Supabase migration runner does not discover them
as normal migrations.

## Current Status

`20260612203357/schema.candidate.sql` is the verified schema-only raw snapshot.
It is a reference artifact and is not directly replayable because it contains
both application objects and Supabase-managed platform schemas.

`20260612203357/application-baseline.candidate.sql` is the sanitized
application baseline target. It remains a detailed extraction placeholder
until a clean platform dump from a pinned self-hosted Supabase version is
available for comparison.

Target Supabase self-hosted tag, PostgreSQL major, and apply-time `psql`
version are currently `TBD`. They must be pinned before extraction or
rehearsal.

A service-role JWT is an API credential, not a PostgreSQL connection string,
and cannot be used by `pg_dump`.

## Manual Schema Dump

Prefer a read-only PostgreSQL user or a disposable database clone. In the
Supabase Dashboard, obtain a PostgreSQL connection string from the database
connection settings. Do not commit the connection string or password.

Write the raw dump to a temporary file so it cannot overwrite the safety
warning in the tracked placeholder:

```bash
pg_dump "$DATABASE_URL" \
  --schema-only \
  --no-owner \
  --file /tmp/supabase-schema-candidate.sql
```

Do not add `--no-privileges` by default. Table, schema, sequence, and routine
grants for `anon`, `authenticated`, and `service_role` are part of the runtime
access model. If privileges are excluded, capture them separately and verify
them before accepting the baseline.

For Supabase CLI, first inspect the installed version:

```bash
supabase db dump --help
```

Only after reviewing that output and obtaining explicit approval may a
schema-only CLI dump be taken. Confirm whether that CLI version preserves
grants.

## Raw Snapshot Review

Never apply the raw dump directly. Review it for:

- application-owned schemas and objects;
- Supabase-managed schemas and ownership statements;
- extensions and their target schemas;
- grants and revokes;
- absence of table data, user records, secrets, and object payloads;
- required Auth and Storage integration objects.

Compare it with a schema-only dump from an untouched disposable platform using
the pinned self-hosted tag. Move only reviewed application-owned DDL into
`application-baseline.candidate.sql`. Do not edit or delete objects from the
raw snapshot.

Managed `auth`, `storage`, `realtime`, `vault`, `supabase_migrations`, platform
extensions, publications, event triggers, and platform role grants come from
the initialized self-hosted stack. Application Auth triggers and Storage
policies are cross-managed additions and require explicit review.

The raw snapshot was produced by `pg_dump` 18.4 from PostgreSQL 17.6 and
contains psql 18 `\restrict`/`\unrestrict` commands. The sanitized application
baseline must not inherit those raw dump commands.

## Clean Rehearsal

1. Start a disposable initialized self-hosted Supabase using the pinned tag.
2. Apply the reviewed `application-baseline.candidate.sql`.
3. Apply the reviewed `reference-data.candidate.sql`.
4. Record migrations through `20260612203357` as covered by the baseline; do
   not replay them over the snapshot.
5. Apply only migrations newer than the cutoff.
6. Run `verification.sql`.
7. Connect the Next.js application only after verification passes.

Do not run these steps against the existing Supabase Cloud project.

## Manual Checklist

- [ ] I used a schema-only dump, not a full data dump.
- [ ] I did not include user data, payments, attempts, personal data, or files.
- [ ] I did not commit credentials or secrets.
- [ ] I reviewed grants and privileges.
- [ ] I pinned the self-hosted Supabase, PostgreSQL, and psql versions.
- [ ] I compared the raw snapshot with an untouched initialized platform.
- [ ] I applied the application baseline, not the raw snapshot.
- [ ] I kept the candidate outside `supabase/migrations`.
- [ ] I did not apply the candidate to the existing Supabase Cloud project.
- [ ] I tested only on an empty local/self-hosted instance.
