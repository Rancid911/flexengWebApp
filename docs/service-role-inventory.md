# Service Role Inventory

This inventory is the enforced baseline for `createAdminClient()` usage. `npm run check:architecture` fails when a new call site appears or when an existing file's call count changes without updating this inventory and the checker allowlist.

## Rules

- API routes and server pages must not call `createAdminClient()` directly.
- New service-role usage must be classified before merge.
- Prefer user-scoped server clients for own-user paths once RLS is proven.
- Prefer RPCs for aggregate/search/billing/dashboard read models.
- Keep provider callbacks, system jobs, media proxy, and cross-user admin operations privileged until a dedicated replacement PR exists.
- New business/data access paths must be user-scoped or RPC-backed by default; adding a service-role call site requires a separate security/RLS plan.

## Low-Risk Pilot Status

The first low-risk cleanup pilot is intentionally conservative:

- `/api/settings/profile` already uses a user-scoped server client in `lib/settings/profile.service.ts`.
- User notifications already use a user-scoped server client in `lib/notifications/server.ts` and `lib/notifications/repository.ts`.
- `lib/students/current-student.ts` now uses a user-scoped server client for own-student `english_level` resolution.
- `lib/teacher-workspace/student-roster.repository.ts` now uses an injected user-scoped server client and the limited `get_teacher_student_profile_summaries(...)` RPC for roster labels.
- `lib/teacher-workspace/student-roster.queries.ts` now uses user-scoped reads plus `get_teacher_roster_active_homework_counts(...)`; it no longer creates a service-role client.
- `lib/teacher-workspace/dashboard-agenda.repository.ts` now uses an injected user-scoped server client for teacher dashboard schedule/attendance/outcome reads.
- `lib/teacher-workspace/notes.repository.ts` now uses an injected user-scoped server client and the limited `get_accessible_profile_labels(...)` RPC for note author labels.
- `lib/teacher-workspace/student-profile.repository.ts` now uses an injected user-scoped server client and the limited `get_accessible_profile_labels(...)` RPC for assigned student profile labels.
- `lib/teacher-workspace/lesson-followup.repository.ts` now requires an injected client; follow-up read paths use a user-scoped server client while write side effects remain explicitly privileged in `lesson-followup.service.ts`.
- `lib/schedule/schedule.repository.ts` now requires an injected client; schedule page reads, filter catalogs, labels and previews use a user-scoped server client while create/update/cancel remain explicitly privileged in `schedule/queries.ts`.
- `lib/dashboard/student-dashboard.ts` now resolves the payment reminder popup through `get_student_dashboard_payment_reminder_inputs(...)` with a user-scoped server client.
- `lib/homework/assignments.repository.ts` now requires an injected client; only homework progress sync after practice attempts remains explicitly privileged in `assignments.service.ts`.
- `lib/admin/dashboard-metrics.ts` now uses the user-scoped server client to call the `admin_dashboard_metrics(...)` security-definer RPC after the API permission guard.
- `lib/admin/teacher-profile.ts` now uses the user-scoped server client for staff teacher profile/dossier page reads; dossier mutation repository remains privileged.
- `lib/admin/notifications.repository.ts` now requires an injected user-scoped server client for admin notification management; audit writes remain privileged.
- `lib/admin/word-card-sets.repository.ts` now requires an injected user-scoped server client for admin word-card catalog management; audit writes remain privileged.
- `lib/admin/blog.repository.ts` now requires an injected user-scoped server client for admin blog/content management; audit writes remain privileged.
- `lib/admin/course-modules.ts` now uses the user-scoped server client for course/module option reads and module creation.
- `lib/admin/tests.repository.ts` now requires an injected user-scoped server client for admin test/question/option management; audit writes remain privileged.
- `lib/admin/teacher-dossier.repository.ts` now requires an injected user-scoped server client for teacher dossier table reads/writes; auth email updates remain explicitly privileged in `teacher-dossier.service.ts`.
- Teacher dossier auth email updates now go through the central admin user repository privileged boundary; `teacher-dossier.service.ts` no longer creates a service-role client directly.
- `lib/admin/user-directory.ts` now uses the user-scoped server client for admin user, student, teacher directory reads and teacher option reads.
- Protected CRM board/detail/settings operations now use user-scoped server clients through injected repositories.
- Public CRM lead intake now uses the narrow `create_public_crm_lead(...)` RPC through a publishable-key server client; CRM tables still do not expose anon insert policies.
- Practice attempt writes now use the user-scoped server client for attempts, answers, mistakes and homework progress sync after the real-student write guard.
- Schedule reads and create/update/cancel mutations now use user-scoped server clients through the schedule repository.
- Teacher lesson follow-up read/write paths now use user-scoped server clients; payment/provider/admin billing flows remain privileged elsewhere.
- Request context profile identity, RBAC metadata and linked actor scope now use the user-scoped server client/RPC path.
- Billing summary reads now use `get_accessible_student_billing_summary(...)` through a user-scoped server client; billing settings, adjustments, payment sync and lesson charges remain privileged in `lib/billing/server.ts`.
- Admin payment-control summary list, reminder settings, manual reminder send, and automatic sync now use user-scoped access.
- Current-student YooKassa checkout/status paths now use user-scoped RPCs; provider webhook processing remains privileged.
- Search now uses the user-scoped server client to call `search_documents_query_for_actor(...)`; the RPC remains actor-scoped and server-mediated.

PR10A removes one low-risk service-role read and adds enforcement so future service-role growth is blocked unless explicitly classified.

## Enforced Baseline

| File | Count | Classification | Follow-up |
| --- | ---: | --- | --- |
| `lib/admin/audit.ts` | 1 | final keep | Admin audit writes remain privileged and failure-tolerant. |
| `lib/admin/user.repository.ts` | 1 | final keep | Supabase Auth admin create/update/delete remains privileged; admin user table writes are user-scoped. |
| `lib/media/service.ts` | 2 | final keep | Backend-mediated media proxy uses one explicit service-role client per media loader. |
| `lib/payments/server.ts` | 1 | provider/system keep | YooKassa webhook processing remains privileged for provider event storage, transaction sync and billing side effects. |
| `lib/supabase/admin.ts` | 1 | factory | Service-role client factory definition. |

## Final PR10 Boundary

The service-role reduction phase is complete at this boundary. Remaining call sites are intentional privileged exceptions and are not cleanup targets without a dedicated product/security design, such as an audit RPC/job strategy, media signed URL redesign, provider webhook isolation, or a Supabase-supported Auth admin alternative.
