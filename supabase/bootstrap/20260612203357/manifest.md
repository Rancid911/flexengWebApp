# Bootstrap Manifest: 20260612203357

Status: needs curation before rehearsal  
Cutoff: `20260612203357`  
Baseline model: current-state snapshot

## Target Platform

| Item | Target |
| --- | --- |
| Supabase self-hosted tag | `TBD` |
| PostgreSQL major | `TBD` |
| Apply-time psql | `TBD`; raw snapshot requires psql 18 for `\restrict` |
| Raw source PostgreSQL | `17.6` |
| Raw pg_dump | `18.4` |

No self-hosted version or Docker image tag is currently defined in repository
configuration. Do not infer one.

## Artifact Roles

- `schema.candidate.sql`: immutable raw full-schema reference; never apply it
  directly to an initialized Supabase platform.
- `application-baseline.candidate.sql`: sanitized application-owned apply
  target. It is currently a non-executable extraction contract pending
  platform comparison.
- `reference-data.candidate.sql`: deterministic application rows outside the
  schema-only dump.
- `verification.sql`: read-only validation of the combined bootstrap result.

## Static Classification

### Managed Platform: Exclude From Application Baseline

- full `auth`, `storage`, `realtime`, `vault`, `extensions`, `pgbouncer`,
  `graphql`, `graphql_public`, and `supabase_migrations` schemas;
- Supabase platform tables, functions, triggers, policies, default privileges,
  and platform roles;
- `supabase_realtime` publication and platform subscriptions;
- platform event triggers;
- raw pg_dump session settings and psql meta-commands.

### Application-Owned Candidates

- application `public` tables, sequences, constraints, foreign keys, indexes,
  view, functions/RPCs, triggers, RLS, policies, and reviewed ACLs;
- `app_private` schema and its functions/grants;
- app-required `pgcrypto` and `pg_trgm`, after confirming target platform
  extension placement;
- legacy helper functions retained by current policies.

### Cross-Managed: Explicit Review Required

- application provisioning functions and four triggers attached to
  `auth.users`;
- seven application policies on `storage.objects`;
- grants/revokes involving managed schemas or objects;
- storage bucket rows, handled in reference data;
- extension creation/schema placement.

## Snapshot Verification: 2026-06-13

The schema-only dump is present and covers the application schema at the
cutoff. Static verification found:

- no `COPY`, `INSERT`, `UPDATE`, or `DELETE` data statements;
- no email addresses, credentials, JWTs, API keys, or other secret literals;
- all 13 previously missing core tables;
- `student_dashboard_view` with `security_invoker`;
- all five legacy public helper functions;
- all 45 tables referenced by runtime `.from()` calls;
- all 18 functions referenced by runtime `.rpc()` calls;
- RLS enabled on all 51 public tables in the snapshot;
- 191 policies and ACL statements for `anon`, `authenticated`, and
  `service_role`;
- current Auth provisioning functions/triggers and the atomic practice-attempt
  RPC.

The snapshot is not yet accepted for direct replay. It is a full Supabase
platform schema dump, not an application-only dump. It includes managed
schemas and objects such as `auth`, `storage`, `realtime`, `vault`,
`supabase_migrations`, platform extensions, publications, and event triggers.
These objects must be reconciled with the exact self-hosted Supabase version;
blindly applying them over a normally initialized self-hosted stack can create
duplicate or incompatible platform objects.

The dump was produced from PostgreSQL 17.6 with `pg_dump` 18.4 and contains
psql 18 `\restrict`/`\unrestrict` meta-commands. The rehearsal toolchain must
support those commands, or a compatible reviewed dump must be produced.

## Migration Boundary

The snapshot must represent the complete application-owned database state after
`20260612203357_cleanup_practice_attempt_legacy_rls.sql`.

All 76 migrations from `20260320195000` through `20260612203357` are considered
covered by this current-state baseline. They must not be replayed over the
snapshot. Migrations newer than the cutoff must be applied normally and remain
the source of truth for all subsequent database changes.

This bundle is not an active migration and must never be moved into
`supabase/migrations`.

## Required Coverage

The accepted snapshot must cover:

- extensions and schemas;
- types, tables, sequences, constraints, foreign keys, and indexes;
- views;
- functions/RPCs and triggers;
- RLS enablement and policies;
- grants and revokes;
- Auth-related application SQL;
- Storage policies and deterministic bucket rows;
- required deterministic RBAC/reference rows.

## Objects Missing From Incremental History

These objects are used or altered by current code/migrations but their original
definitions are not present in the migration history.

### Identity

- `public.profiles`
- `public.students`
- `public.teachers`

### Learning Content

- `public.courses`
- `public.course_modules`
- `public.lessons`
- `public.tests`
- `public.test_questions`
- `public.test_question_options`

### Student State

- `public.student_course_enrollments`
- `public.student_lesson_progress`
- `public.student_test_attempts`
- `public.student_test_answers`

### Legacy Objects

- `public.student_dashboard_view`
- `public.current_student_id`
- `public.current_teacher_id`
- `public.get_my_role`
- `public.is_admin_or_manager`
- `public.is_teacher`

The baseline must use definitions from a trusted schema snapshot. Do not infer
columns, constraints, signatures, ownership, security mode, or grants.

## Acceptance Requirements

- The schema candidate was obtained schema-only and reviewed.
- No user/application data or secrets are present.
- Grants and revokes are preserved or captured separately.
- Required reference rows were reviewed separately from DDL. The schema-only
  dump does not contain the `avatars` or `crm-assets` bucket rows, RBAC seed
  rows, or required singleton configuration rows.
- `verification.sql` reports every required object and access check as present.
- A clean local/self-hosted rehearsal succeeds without replaying pre-cutoff
  migrations.

## Remaining Curation

- Choose the exact self-hosted Supabase/PostgreSQL/psql versions.
- Dump an untouched disposable platform and perform the object-level diff.
- Extract reviewed application-owned DDL into
  `application-baseline.candidate.sql`.
- Decide which managed objects come from the self-hosted stack and which
  application integrations must be retained from this snapshot.
- Complete RBAC and singleton reference rows.
- Run the candidate only on an empty disposable rehearsal environment.
