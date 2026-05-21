# Storage Access Inventory

Status date: 2026-05-21

This document records the current Supabase Storage access model after the RBAC/RLS cleanup. It is an inventory and smoke target, not a policy redesign.

## Buckets

| Bucket | Public | Writes | Reads | Runtime usage |
| --- | --- | --- | --- | --- |
| `avatars` | Yes | Own authenticated user path: `{auth.uid()}/avatar` | Own authenticated user policy plus backend media proxy | Profile settings upload/delete and `/api/media/avatar/[userId]` |
| `crm-assets` | Yes | Authenticated users with `crm.leads.manage:all` through `app_private.has_permission(...)` | Public select policy plus backend media proxy | CRM background upload and `/api/media/crm-background` |

## Runtime Boundaries

- Avatar uploads and deletes go through the user-scoped settings profile service and the `avatars` bucket own-user policies.
- CRM background upload uses the user-scoped server client after the CRM API permission guard and writes to `crm-assets`.
- Media rendering is backend-mediated through `lib/media/service.ts`, which intentionally remains a final service-role exception so avatar and CRM background downloads can be served through stable app routes.
- CRM background route access is still guarded by the app before loading the media file.

## Current Risks

- Both app buckets are public buckets today. The app commonly serves media through `/api/media/...`, but direct public object URLs may still be readable when callers know the object path.
- `crm-assets` has an explicit public select policy. Making CRM backgrounds private would require a separate product/security PR with storage policy and URL behavior changes.
- `avatars` is public at the bucket level but has own-user object policies. The backend media proxy is the preferred read path for app rendering.

## Verification

Run `supabase/sql-editor/storage_access_inventory_20260521.sql` in Supabase SQL Editor or with `psql` after migrations are applied.

Expected final result:

```text
storage metadata smoke checks passed
```

The script is read-only. Any exception means migration drift or a focused storage policy regression that should be fixed separately.
