# Storage And Media Access

Status: current  
Audience: engineers working on uploads, media routes or storage policy verification  
Owner area: access-control  
Last reviewed: 2026-05-25  
Source of truth: wrapper; `docs/storage-access-inventory.md` is the authoritative storage inventory  
Related code: `lib/media/service.ts`, `app/api/media/`, `lib/settings/profile.service.ts`, `lib/crm/`  
Related tests: `tests/unit/media-api-routes.test.ts`, `tests/unit/media-service.test.ts`

Storage/media access is documented separately because bucket public/private posture, app route guards and backend media proxy behavior interact.

## Current Posture

- `avatars` and `crm-assets` are public buckets today.
- Avatar writes are scoped to the authenticated user's own path.
- CRM asset writes require CRM management permission before upload.
- App rendering prefers backend media routes.
- `lib/media/service.ts` remains an intentional service-role exception for media proxy reads.
- Direct public object URLs may be readable when object paths are known; this is documented risk, not hidden security.

See `docs/storage-access-inventory.md` for bucket details, runtime boundaries and current risks.

## Verification

The storage smoke script is:

```text
supabase/sql-editor/storage_access_inventory_20260521.sql
```

Run it against a target Supabase database after migrations are applied. Static code review and migration text are not live DB verification.

## Change Rules

- Do not make a bucket private or public as part of an unrelated feature PR.
- Do not add direct client storage access without documenting bucket policies and tests.
- Do not add service-role media access without updating `docs/service-role-inventory.md`.
- Do not rely on hidden UI to protect media access.
