# Storage And Media

Status: current  
Audience: engineers, operations, security reviewers  
Owner area: storage-media  
Last reviewed: 2026-05-25  
Source of truth: feature summary; `docs/storage-access-inventory.md` remains the authoritative storage inventory  
Related code: `app/api/media/avatar/[userId]/route.ts`, `app/api/media/crm-background/route.ts`, `app/api/crm/settings/background/route.ts`, `lib/media/`, `lib/settings/profile-avatar.gateway.ts`, `lib/settings/profile.repository.ts`, `lib/settings/profile.service.ts`, `lib/crm/queries.ts`<br>
Related tests: `tests/unit/media-api-routes.test.ts`, `tests/unit/media-service.test.ts`, `tests/unit/settings-profile-route.test.ts`, `tests/unit/settings-profile-service.test.ts`, `tests/unit/crm-api-routes.test.ts`

## Overview

Storage/media covers avatar uploads and reads, CRM background uploads and reads, Supabase Storage bucket posture and backend media proxy behavior. The app uses stable backend routes for rendering media, while current buckets remain public and carry documented direct URL risk.

Global storage/access rules are documented in `docs/access-control/README.md`, `docs/access-control/permissions.md`, `docs/access-control/guards.md`, `docs/access-control/request-context.md`, `docs/access-control/rls-rpc.md`, `docs/access-control/service-role.md`, `docs/access-control/storage-media.md`, `docs/access-control/verification-status.md`, `docs/storage-access-inventory.md` and `docs/service-role-inventory.md`.

## User Flows

- User updates profile avatar from settings.
- App renders avatar through `/api/media/avatar/[userId]`.
- Staff uploads CRM board background through `/api/crm/settings/background`.
- Staff/app renders CRM background through `/api/media/crm-background`.
- Support/security reviewers run storage metadata smoke after migrations.

## Routes And UI

- Avatar upload/delete is part of settings profile update flow.
- `/api/media/avatar/[userId]` serves avatar media after permission checks.
- `/api/crm/settings/background` uploads CRM background media after CRM manage guard.
- `/api/media/crm-background` serves CRM background media after CRM view guard.
- CRM and settings UI build internal media URLs through `lib/media/urls.ts`.

## APIs And Server Actions

| Endpoint | Method | Classification | Notes |
| --- | --- | --- | --- |
| `/api/media/avatar/[userId]` | GET | protected media | Requires authentication; own avatar requires `settings.profile.read`; cross-user avatar requires admin/teacher read capability. |
| `/api/media/crm-background` | GET | protected media | Requires `crm.leads.view`; optional `p` path must match stored CRM background path. |
| `/api/crm/settings/background` | POST | protected mutation | Requires `crm.leads.manage`; validates image type and size before upload. |
| `/api/settings/profile` | GET/PATCH | protected | Profile route owns avatar upload/delete as part of settings profile update. |

## Data Model

Buckets and storage:

- `avatars`: public bucket; own authenticated path pattern is `{auth.uid()}/avatar`.
- `crm-assets`: public bucket; CRM background paths under `background/`.
- `profiles.avatar_url` stores avatar media/internal URL state.
- `crm_settings.background_image_url` stores CRM background URL/path state.

See `docs/storage-access-inventory.md` for bucket policy posture and current risks.

## Access Control

- Avatar reads use `canReadProfileAvatar(...)`:
  - own user requires `settings.profile.read`;
  - cross-user read requires admin users/teachers read permission.
- Avatar Storage writes happen through the user-scoped settings avatar gateway; profile URL persistence goes through the profile repository.
- CRM background upload requires `crm.leads.manage`.
- CRM background read requires `crm.leads.view`.
- Backend media proxy downloads from Supabase Storage using service-role and is an allowlisted exception in `docs/service-role-inventory.md`.
- Public bucket posture is not a security boundary; direct public URL risk is documented.

## State And Lifecycle

- Avatar upload writes to `{userId}/avatar`, updates profile avatar URL and uses versioned app media URLs.
- Avatar delete removes storage object and clears profile avatar URL.
- CRM background upload stores a timestamped path and returns an internal media URL.
- Media responses include private cache headers and ETags derived from profile/settings update state.

## Integrations

- Supabase Storage stores avatar and CRM background objects.
- Settings profile service orchestrates avatar changes, while the avatar gateway owns Storage access and the profile repository owns `avatar_url`.
- CRM settings service owns background upload path.
- Media service owns backend proxy downloads.

## Loading And Errors

- Missing media returns `MEDIA_NOT_FOUND`.
- Unauthorized avatar/CRM media access returns authentication or permission errors before storage download.
- Invalid CRM upload returns validation errors for missing file, non-image file or file too large.
- Storage upload/download errors are surfaced as typed route/service errors.

## Tests

Current focused coverage includes:

- Media API route tests.
- Media service tests.
- Settings profile route/service tests for avatar behavior.
- CRM API route tests for background upload.
- Architecture check for service-role media exceptions.

Coverage gaps:

- Live storage metadata smoke must be run on a target Supabase project.
- Browser visual verification of cached media URLs can be added when media UX changes.

## Operations

- Run `supabase/sql-editor/storage_access_inventory_20260521.sql` after migrations on the target DB when verifying storage posture.
- For avatar failures, inspect profile `avatar_url`, storage path and `settings.profile.read`.
- For CRM background failures, inspect stored path, `crm-assets` object existence and CRM permissions.
- Do not make buckets private or public as part of unrelated feature work.

## Known Limitations

- `avatars` and `crm-assets` are public buckets today.
- Direct public object URLs may be readable when object paths are known.
- Backend media proxy service-role usage remains a final documented exception.
- Private bucket migration is a separate product/security PR, not part of this doc.
