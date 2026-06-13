# Service-Role Usage

Status: current  
Audience: engineers reviewing privileged Supabase access  
Owner area: access-control  
Last reviewed: 2026-05-25  
Source of truth: wrapper; `docs/service-role-inventory.md` is the authoritative inventory  
Related code: `lib/supabase/admin.ts`, `scripts/check-architecture.mjs`  
Related tests: `tests/unit/admin-client-access-markers.test.ts`

Service-role access bypasses user-scoped RLS and must remain rare, explicit and allowlisted.

## Current Rule

`docs/service-role-inventory.md` is the authoritative list of allowed `createAdminClient()` usage. `npm run check:architecture` enforces the baseline and should fail when a new call site appears or a listed count changes without review.

## Allowed Categories

- Provider/system callbacks that cannot run as a normal user.
- Supabase Auth admin operations.
- Audit writes that are intentionally privileged and failure-tolerant.
- Backend-mediated media proxy reads listed in the inventory.
- Narrow cross-user admin operations that are already guarded at the app layer and documented as final exceptions.

## Forbidden Usage

- Direct service-role calls in server pages or API routes unless explicitly allowlisted.
- New business/data access paths that could use a user-scoped client or hardened RPC.
- Service-role calls used to bypass missing RLS, missing guards or missing permissions.
- Uninventoried temporary exceptions.

## Adding An Exception

1. Prefer user-scoped access or a narrow RPC first.
2. Document why service-role is required.
3. Update `docs/service-role-inventory.md`.
4. Update the architecture checker allowlist.
5. Add tests proving app-level authorization happens before privileged side effects.

Static checker compliance is not live DB verification. RLS/RPC/storage behavior must still be verified separately where applicable.
