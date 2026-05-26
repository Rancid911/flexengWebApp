# CRM And Leads

Status: current  
Audience: engineers, sales/operations maintainers, security reviewers  
Owner area: crm-leads  
Last reviewed: 2026-05-25  
Source of truth: feature summary; current code/tests remain implementation source  
Related code: `app/(workspace)/(staff-zone)/crm/page.tsx`, `app/api/leads/route.ts`, `app/api/crm/`, `app/api/media/crm-background/route.ts`, `features/crm/`, `features/marketing/`, `lib/crm/`, `lib/media/`  
Related tests: `tests/unit/crm-api-routes.test.ts`, `tests/unit/crm-leads-route.test.ts`, `tests/unit/crm.test.ts`, `tests/unit/crm-board-client.test.tsx`, `tests/unit/media-api-routes.test.ts`, `tests/unit/media-service.test.ts`, `tests/unit/hero-lead-modal.test.tsx`

## Overview

CRM/leads captures public marketing leads and gives staff a protected operational board for viewing, moving, commenting and tracking requests. Public lead intake is intentionally unauthenticated. CRM management is protected by staff permissions.

Global access rules are documented in `docs/access-control/README.md`, `docs/access-control/permissions.md`, `docs/access-control/guards.md`, `docs/access-control/request-context.md`, `docs/access-control/rls-rpc.md`, `docs/access-control/service-role.md`, `docs/access-control/storage-media.md` and `docs/access-control/verification-status.md`.

## User Flows

- Guest submits a lead form from the public site.
- Public API validates the payload and calls a narrow public lead intake RPC.
- Staff opens `/crm`, reviews leads grouped by stage and marks new leads viewed.
- Staff changes lead status, adds comments and updates CRM board background settings.
- Staff can upload and serve CRM background media through guarded media routes.

## Routes And UI

- `/crm` is a staff workspace page guarded by `crm.leads.view`.
- `features/crm/components/crm-board-client.tsx` renders the board and drawer interactions.
- `app/(workspace)/(staff-zone)/crm/loading.tsx` provides the route-level skeleton.
- Public lead forms live under `features/marketing/`.
- CRM media is served through `/api/media/crm-background` after a CRM read guard.

## APIs And Server Actions

| Endpoint | Method | Classification | Notes |
| --- | --- | --- | --- |
| `/api/leads` | POST | public | Validates public lead payload; calls `create_public_crm_lead` RPC. |
| `/api/crm/leads` | GET | protected | Requires `crm.leads.view`; returns board data. |
| `/api/crm/leads/[id]` | GET | protected | Requires `crm.leads.view`; loads detail and marks unviewed lead as viewed. |
| `/api/crm/leads/[id]` | DELETE | protected mutation | Requires `crm.leads.manage`; deletes lead. |
| `/api/crm/leads/[id]/status` | PATCH | protected mutation | Requires `crm.leads.manage`; validates status and writes history. |
| `/api/crm/leads/[id]/comments` | POST | protected mutation | Requires `crm.leads.manage`; validates comment. |
| `/api/crm/settings` | GET/PATCH | protected | GET requires `crm.leads.view`; PATCH requires `crm.leads.manage`. |
| `/api/crm/settings/background` | POST | protected mutation | Requires `crm.leads.manage`; validates image upload. |
| `/api/crm/unread-summary` | GET | protected | Requires `crm.leads.view`; returns unread new requests count. |
| `/api/media/crm-background` | GET | protected media | Requires `crm.leads.view`; serves CRM background media. |

## Data Model

Key tables/concepts:

- `crm_leads`: lead identity, contact fields, status, source, metadata and viewed state.
- `crm_lead_status_history`: status transitions with actor id.
- `crm_lead_comments`: staff comments.
- CRM settings row stores background image URL/path metadata.
- `crm-assets` storage bucket stores CRM background images.
- `create_public_crm_lead` RPC accepts public lead intake without exposing direct anonymous table writes.

Lead statuses are defined in `lib/crm/stages.ts`, including `new_request`, `not_reached`, `contact_established`, `not_fit`, `consultation_scheduled`, `consultation_no_show`, `consultation_done`, `thinking`, `contract_sent`, `contract_signed` and `awaiting_payment`.

## Access Control

- Public lead intake is open by route classification but validates input and writes through a narrow RPC.
- CRM board, detail, settings reads and media reads require `crm.leads.view`.
- CRM status/comment/delete/settings writes and background upload require `crm.leads.manage`.
- CRM storage behavior and public bucket risks are documented in `docs/storage-access-inventory.md`.
- Media proxy service-role behavior is an allowlisted exception in `docs/service-role-inventory.md`.
- RLS/live DB verification is separate from route guard tests.

## State And Lifecycle

- New leads start in `new_request`.
- Opening a lead detail can mark the lead as viewed.
- Status changes create history.
- Comments are append-style operational notes.
- Background settings point to uploaded media and can be cleared.

## Integrations

- Public marketing forms submit to `/api/leads`.
- Supabase RPC handles public intake.
- Supabase Storage stores CRM background assets.
- Workspace shell/navigation exposes CRM only to users with CRM permissions.

## Loading And Errors

- CRM page has a route-level skeleton.
- Board/drawer client states handle local interactions.
- Invalid public lead payloads return validation errors.
- Invalid status/comment/background payloads return admin validation errors before writes.

## Tests

Current focused coverage includes:

- Public lead route tests.
- CRM API route and service tests.
- CRM board client tests.
- Media route/service tests for CRM background.
- Architecture checks for service-role and route boundaries.

Coverage gaps:

- Live storage metadata smoke must be run separately on a target DB.
- End-to-end public form-to-board verification is useful as a manual release check.

## Operations

- If public lead intake fails, check the public RPC grant/policy state and validation payload.
- If board media fails, check `crm-assets` bucket metadata, stored path and `/api/media/crm-background` permission.
- If unread counts look wrong, inspect `viewed_at`, status and board detail open behavior.

## Known Limitations

- `crm-assets` is public today; direct public object URL risk is intentional and documented.
- Public lead intake avoids direct anonymous table insert policies by using a narrow RPC.
- Full storage/RLS confidence requires live smoke.
