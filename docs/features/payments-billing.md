# Payments And Billing

Status: current  
Audience: engineers, product maintainers, support/admin operators, security reviewers  
Owner area: payments-billing  
Last reviewed: 2026-05-25  
Source of truth: feature summary; current code/tests remain implementation source  
Related code: `app/(workspace)/(student-zone)/settings/payments/page.tsx`, `app/(workspace)/(staff-zone)/admin/payments/page.tsx`, `app/api/payments/`, `app/api/admin/payments-control/`, `app/api/students/[id]/billing/`, `features/payments/`, `features/billing/`, `lib/payments/`, `lib/billing/`, `lib/admin/payments-control.ts`  
Related tests: `tests/unit/payments-api-route.test.ts`, `tests/unit/payments-yookassa-routes.test.ts`, `tests/unit/payments-server.test.ts`, `tests/unit/payments-queries.test.ts`, `tests/unit/billing-server.test.ts`, `tests/unit/billing-adjustments-route.test.ts`, `tests/unit/admin-payments-control-routes.test.ts`

## Overview

Payments and billing cover student self-service payment plans, YooKassa checkout/status synchronization, staff payment control, billing settings, manual adjustments and payment reminders. Students use it to pay and view their balance. Staff/admin users use it to monitor balances, configure reminders and adjust billing state.

Global access rules are documented in `docs/access-control/README.md`, `docs/access-control/permissions.md`, `docs/access-control/guards.md`, `docs/access-control/request-context.md`, `docs/access-control/rls-rpc.md`, `docs/access-control/service-role.md`, `docs/access-control/storage-media.md` and `docs/access-control/verification-status.md`.

## User Flows

- Student opens `/settings/payments`, sees active payment plans, recent transactions and a billing summary.
- Student creates YooKassa checkout through `/api/payments/yookassa/create` and is redirected to the provider confirmation URL.
- Student returns to `/settings/payments?payment=...`; the client can poll `/api/payments/yookassa/status`.
- Staff opens `/admin/payments` to review balances, debt, reminder state and settings.
- Staff can send a manual payment reminder and manage student billing settings/adjustments through student profile billing APIs.
- YooKassa posts payment events to the provider webhook route, which stores a webhook event and synchronizes transaction/billing side effects.

## Routes And UI

- `/settings/payments` is the student-facing payments page and requires workspace route access for `payments`.
- `/admin/payments` is the staff/admin payment control page and requires `payments.manage`.
- Route-specific loading exists at `app/(workspace)/(student-zone)/settings/payments/loading.tsx`.
- Admin payment control is a client-heavy operational screen under `features/billing/components/admin-payments-control-client.tsx`.
- Payment UI should not expose provider secrets or service-role behavior.

## APIs And Server Actions

| Endpoint | Method | Classification | Notes |
| --- | --- | --- | --- |
| `/api/payments` | GET | protected | Requires `payments.view`; returns current student payments and optional billing summary. |
| `/api/payments/yookassa/create` | POST | protected | Requires `payments.checkout.create`; validates `planId`; creates current-student payment transaction and provider checkout. |
| `/api/payments/yookassa/status` | GET | protected | Requires `payments.status.read`; validates `transactionId`; syncs current student transaction if needed. |
| `/api/payments/yookassa/webhook` | POST | provider/internal public exception | Validates optional `YOOKASSA_WEBHOOK_SECRET` token; processes provider event with privileged backend access. |
| `/api/admin/payments-control` | GET | protected | Requires `payments.view`; returns staff payment-control list. |
| `/api/admin/payments-control/reminders` | POST | protected mutation | Requires `payments.manage`; validates `studentId`; sends payment reminder. |
| `/api/admin/payment-reminder-settings` | GET/POST | protected mutation | Requires `payments.manage`; reads or updates reminder settings and syncs automatic reminders. |
| `/api/students/[id]/billing` | GET/PATCH | protected | GET requires `billing.view` scoped to `studentId`; PATCH requires `billing.adjust`. |
| `/api/students/[id]/billing/adjustments` | POST | protected mutation | Requires `billing.adjust`; validates adjustment payload before ledger write. |

## Data Model

Key tables and RPCs:

- `payment_plans`: active plans shown to students.
- `payment_transactions`: YooKassa transaction records and provider state.
- `payment_webhook_events`: provider event idempotency and audit storage.
- `student_billing_accounts`: billing mode and lesson price configuration.
- `student_billing_ledger`: credits, debits, payment credits and lesson charges.
- `student_payment_reminder_state` and `admin_payment_reminder_settings`: reminder lifecycle.
- RPCs include `create_current_student_payment_transaction`, `update_current_student_payment_transaction_provider_state`, `load_current_student_payment_transaction_status`, `get_accessible_student_billing_summary` and `get_student_dashboard_payment_reminder_inputs`.

## Access Control

- Student self-service uses `payments.view`, `payments.checkout.create` and `payments.status.read`, which alias to canonical payment view behavior.
- Admin payment control uses `payments.view` for reads and `payments.manage` for management/reminders.
- Student billing reads use `billing.view` scoped to own/assigned/all student context.
- Billing settings and manual ledger adjustments use `billing.adjust`.
- Page/API guards run before payment and billing services.
- Webhook processing is the intentional provider/internal exception and uses privileged access listed in `docs/service-role-inventory.md`.
- RLS/RPC behavior requires target DB verification; see `docs/access-control/rls-rpc.md` and `docs/access-control/verification-status.md`.

## State And Lifecycle

- Payment transaction statuses are normalized from YooKassa status metadata, with pending, succeeded and failed-style outcomes represented in the app.
- Checkout records provider confirmation URL and idempotence key.
- Status sync refreshes stale/expired provider state and syncs billing when a transaction succeeds.
- Webhook events are idempotent by provider event id and payload hash.
- Billing ledger entries represent payment credits, lesson charges and manual adjustments.

## Integrations

- Supabase Auth/request context identifies the current student or staff actor.
- Supabase RPCs mediate current-student transaction creation/status and billing summaries.
- YooKassa is the payment provider.
- Service-role is used only for provider webhook processing as an allowlisted privileged exception.
- Notifications/reminders are adjacent but owned by payment reminder services.

## Loading And Errors

- Student payments page has route-level loading plus local client status polling for payment status.
- Admin payment control has list/filter client loading and empty states.
- Provider creation/update errors return typed API errors such as missing plan id, transaction not found, invalid webhook token or provider failure.
- Billing settings/adjustments return validation errors before service writes.

## Tests

Current focused coverage includes:

- Payments API and YooKassa route tests.
- Payment server/query tests.
- Billing server, adjustment route and student billing route tests.
- Admin payment-control service, state and route tests.
- Architecture/service-role inventory checks.

Coverage gaps:

- Live YooKassa sandbox verification is operational and not proven by unit tests.
- Target DB RLS/RPC smoke must be recorded separately.

## Operations

- Check webhook failures around `YOOKASSA_WEBHOOK_SECRET`, provider payment id and duplicate event behavior.
- For support, inspect app transaction status and YooKassa provider status before manual correction.
- For billing issues, inspect billing account mode, ledger entries and transaction sync status together.
- Do not manually mark release readiness from migration text alone; run target DB smoke where required.

## Known Limitations

- Provider webhook remains a final privileged exception.
- Some payment/billing flows are split between current-student RPCs, admin controls and schedule/student profile APIs.
- Full live provider and DB smoke are separate release operations.
