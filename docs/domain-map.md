# Domain Map

Status legend:

- `healthy`: current separation is good enough; only incremental cleanup is needed.
- `watch`: workable now, but growth could create coupling.
- `needs_split`: known module or route has mixed responsibilities and should be split in a planned refactor.

| Domain | Current Locations | Status | Main Dependencies | Notes |
| --- | --- | --- | --- | --- |
| CRM | `app/(workspace)/(staff-zone)/crm`, `app/api/crm`, `app/api/leads`, `lib/crm` | `watch` | Admin auth, Supabase admin, profiles, public lead forms | CRM internals are isolated behind services/repositories; keep public leads, board operations, and settings as separate CRM use cases. |
| Students | `app/(workspace)/_components/students-directory`, `app/(workspace)/(staff-zone)/admin/students`, `app/(workspace)/(teacher-zone)/students`, `lib/students`, parts of `lib/admin/users` | `watch` | Admin, teacher workspace, schedule, billing, profile/request context | Directory and profile UI are separated; admin user creation/update now belongs to admin user service/repository orchestration. |
| Teachers | `app/(workspace)/(staff-zone)/admin/teachers`, `app/(workspace)/(teacher-zone)`, `lib/teacher-workspace` | `watch` | Students, schedule actor, teacher notes, admin dossier | Teacher workspace legacy split is complete; focused modules now own roster, dashboard, profile sections, notes, lesson follow-up, placement and homework mutations. |
| Payments | `app/api/payments`, `app/(workspace)/(student-zone)/settings/payments`, `lib/payments` | `healthy` | Current student, YooKassa, billing, Supabase admin | Provider integration is reasonably separated from UI and billing. |
| Billing | `lib/billing`, `app/api/admin/payments-control`, admin payments UI | `watch` | Payments, student accounts, lessons, reminders, notifications | Server logic is centralized but large; keep provider payments separate from ledger/reminders. |
| Learning / Practice | `app/(workspace)/(shared-zone)/practice`, `lib/practice` | `watch` | Tests, lessons, modules, homework assignments, attempts, progress | Practice legacy split is complete; focused modules own activity detail, catalog, topics, overview, recommendations, mistakes and favorites. |
| Homework | `app/(workspace)/(shared-zone)/homework`, `lib/homework`, homework API routes | `watch` | Practice/tests, student progress, teacher/admin assignment flows | Read models exist, but homework and practice/test concepts are tightly related. |
| Tests / Quizzes | `lib/admin/tests`, `lib/practice/attempts`, practice activity routes, admin test UI | `watch` | Practice, placement, homework, mistakes | Tests are spread between admin management and practice runtime; future split into a tests domain is recommended. |
| Flashcards / Words | `app/(workspace)/(shared-zone)/words`, `lib/words` | `healthy` | Student profile, word sessions, trainer UI | Domain is fairly self-contained. Keep trainer state separate from data queries. |
| Progress | `app/(workspace)/(shared-zone)/progress`, `lib/progress`, parts of dashboard/practice | `watch` | Lessons, tests, mistakes, courses | Query module is manageable, but dashboard aggregation can create coupling. |
| Schedule | `app/(workspace)/(shared-zone)/schedule`, `app/api/schedule`, `lib/schedule` | `watch` | Students, teachers, billing, lesson outcomes | Query raw access is behind repository/mapper/descriptors modules and staff UI is split into focused sections. Keep watching this domain because it coordinates several roles and billing side effects. |
| Blog / CMS | `app/(public)/articles`, `components/blog`, `app/api/blog`, `app/api/admin/blog`, `lib/blog`, `lib/admin/blog` | `healthy` | Public site, admin auth, Supabase admin | Public and admin surfaces are separated; admin blog routes delegate to service/repository boundaries. |
| Admin | `app/(workspace)/(staff-zone)/admin`, `app/api/admin`, `lib/admin` | `watch` | Users, blog, tests, notifications, payments, word sets | Admin shell is expected to touch many domains; users, tests, word-card sets, blog, notifications and teacher dossier workflows now have service/repository boundaries. |
| Public Website | `app/(public)`, `app/main`, `app/api/leads` | `watch` | CRM leads, blog, consent, search | Marketing UI is isolated; lead creation delegates to CRM public lead service. |
| Auth | `app/(auth)`, `app/auth/confirm`, `lib/auth`, `lib/supabase` | `healthy` | Supabase auth, request context, profiles | Client Supabase use in auth pages is acceptable for auth flows. |
| API | `app/api/*`, `lib/server/http`, `lib/admin/http` | `watch` | Domain services, auth/request context | Generic and admin error wrappers exist; keep routes as transport layers that delegate to domain services. |
| Search | `components/search`, `app/search`, `app/api/search`, `lib/search` | `watch` | Blog, practice, homework, words, admin, request context | Search is intentionally cross-domain; keep it as a read-model aggregator only. |
| Notifications | `app/api/notifications`, workspace notification UI, `lib/notifications` | `healthy` | Profiles, notification state, workspace shell | Admin and user notification flows use service/repository boundaries; workspace UI consumes notification DTOs through the existing API layer. |
| Dashboard Aggregation | `lib/dashboard/student-dashboard`, dashboard pages | `watch` | Words, lessons, tests, homework, progress, roles | This remains a cross-domain read model, but the facade now delegates to focused types, descriptors, mappers and repository modules. It should not grow into mutation/business ownership. |
| Large UI Areas | Admin console, admin test drawer, schedule client, teacher student profile, settings profile, payments client | `watch` | Feature hooks, API routes, presentational sections | Planned large-client cleanup is complete. Keep future splits opportunistic and tied to concrete bugs, features, or measurable complexity. |

## Current `needs_split` Targets

- None currently tracked as active domain-level `needs_split`.
- The active architecture backlog is empty. Future `needs_split` targets should be added only when a concrete issue or feature exposes a real boundary problem.

## Ownership Rule

When adding a feature, first decide its domain. If it is a read-only aggregate across domains, label it as an aggregator. If it mutates data, the mutation should live in the owning domain service.
