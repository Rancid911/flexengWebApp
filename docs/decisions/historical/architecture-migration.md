# Architecture Migration

> Historical document. This is not current runtime truth. Use `docs/README.md` to find current source-of-truth documentation.

This checklist records the completed baseline migration toward a routing-only `app/`, explicit permissions, and domain-oriented `features/`.

Do not use this migration to change page URLs or API endpoints.

Current guardrails: `app/` is routing-only, API routes cannot use raw Supabase access, and protected API routes must call `requirePermission()` unless they are explicitly allowlisted as public/provider/internal endpoints in `scripts/check-architecture.mjs`.

The active mass-migration backlog is complete. Future cleanup should be driven by a concrete feature, bug, performance issue, or review finding rather than another broad relocation pass.

## Domain Checklist

| domain | app thin | API thin | permissions migrated | in features | tests/smoke checked | status | notes |
|---|---|---|---|---|---|---|---|
| auth | yes | yes | intentional auth/session endpoints | yes | yes | complete | Auth UI/forms live in `features/auth`; auth route pages are thin, `/auth/confirm` remains a Next callback route, and login/signup/logout/password flows go through `/api/auth/*` + `lib/auth/auth-api.service.ts` instead of browser Supabase. |
| workspace shell | yes | n/a | n/a | yes | yes | complete | Workspace layouts remain as route conventions in `app`; shell/navigation/notification implementation lives in `features/workspace-shell`; shared student page primitives live in `shared/ui`. |
| dashboard | yes | n/a | n/a | yes | yes | complete | Shared route assembly, role views and payment reminder UI/hooks live in `features/dashboard`; server loaders remain unchanged. |
| admin | yes | yes | yes | yes | yes | complete | Admin console, teacher dossier, directory adapters and directory route assembly live in `features/admin`; protected admin APIs use permissions and delegate to service/query/repository boundaries. |
| crm | yes | yes | yes | yes | yes | complete | CRM route delegates to `features/crm`; CRM API checks permissions for leads, settings, comments, unread summary and background upload. CRM UI no longer calls Supabase Storage directly. |
| students | yes | yes | yes | yes | yes | complete | Shared admin/teacher profile detail UI, notes panel, directory/search UI and profile route assembly live in `features/students`; teacher notes mutations use `students.notes.write`. |
| teachers | yes | yes | yes | yes | yes | complete | Teacher-facing profile UI/hooks, profile route assembly and `/students` directory route assembly live in `features/teacher-workspace`; service-level teacher scope remains in `lib/teacher-workspace`. |
| learning | yes | yes | yes | intentional none | yes | complete | Learning permissions are covered by course/module, tests and placement assignment APIs. A separate `features/learning` split is not planned without a concrete feature or boundary problem. |
| practice | yes | yes | yes | yes | yes | complete | Activity runner, placement flow, overview/library UI and server route assembly live in `features/practice`; attempt submission uses `practice.attempts.submit`. |
| words/flashcards | yes | yes | yes | yes | yes | complete | Trainer, subnav, overview/list/topic UI and server route assembly live in `features/words`; admin card-set and student session APIs use permissions. |
| homework | yes | yes | yes | yes | yes | complete | Student homework UI and route assembly live in `features/homework`; assignment APIs use `homework.assign`; teacher/admin assignment flows remain in their owning route contexts. |
| progress | yes | n/a | n/a | yes | yes | complete | Progress overview/topics/history/weak-points UI and route assembly live in `features/progress`; route pages remain thin wrappers. |
| schedule | yes | yes | yes | yes | yes | complete | Schedule UI/state and route assembly live in `features/schedule`; read/write APIs authorize through schedule lesson/follow-up permissions while scope stays in `lib/schedule` and `lib/teacher-workspace`. |
| billing | yes | yes | yes | yes | yes | complete | Admin billing UI/state lives in `features/billing`; admin payments-control, reminder, student billing and adjustment APIs use billing permissions. |
| payments | yes | yes | yes | yes | yes | complete | Student payments UI and `/settings/payments` route assembly live in `features/payments`; student payment APIs use runtime permissions and YooKassa webhook remains provider-token authenticated. |
| notifications | yes | yes | yes | yes | yes | complete | Workspace notification UI lives in `features/workspace-shell`; admin and user notification APIs use notification permissions. |
| blog | yes | yes | yes | yes | yes | complete | Public blog UI and route assembly live in `features/blog`; public route pages keep metadata/revalidate and admin blog API uses `content.posts.manage`. |
| public website | yes | intentional public | intentional public | yes | yes | complete | Public marketing UI and home page render/content live in `features/marketing`; `/api/leads` remains an explicit public lead-intake exception. |
| search | yes | intentional public | intentional public | yes | yes | complete | Search UI/client and public/workspace shell route assembly live in `features/search`; `/api/search` remains an explicit public/workspace read-model exception. |
| settings | yes | yes | yes | yes | yes | complete | Settings route delegates to `features/settings`; profile persistence/auth mutations go through `/api/settings/profile`, and direct client Supabase usage was removed. Browser Supabase Auth usage is also removed from auth/logout UI. |

## Shared Zone Inventory

| route | likely zone | business domain | why shared/current note | action |
|---|---|---|---|---|
| `/dashboard` | shared workspace | dashboard | Role-specific dashboard variants are rendered from one route. | Keep route; shared route assembly, role views and reminder UI live in `features/dashboard`. |
| `/practice/**` | shared/student | practice | Student-facing, but may be reachable through workspace shell. | Do not move until access requirements are confirmed. |
| `/words/**` | shared/student | words | Vocabulary and flashcard flows. | Keep URL; clarify naming before moving. |
| `/homework/**` | shared/student/teacher | homework | Homework appears in student and teacher/admin contexts. | Keep route; student-facing UI lives in `features/homework`. |
| `/progress/**` | shared/student | learning/progress | Progress views are mostly student-facing. | UI moved to `features/progress`; keep URL and route group unchanged. |
| `/schedule` | shared/teacher/staff | schedule | Staff and teacher schedule workflows share one route. | Keep route; move client state/forms first. |
| `/settings/**` | shared workspace | settings | Profile/settings apply to workspace actors. | Feature logic moved to `features/settings`; route group cleanup remains deferred. |

## Migration Rules

- Prefer small domain-scoped PRs for future changes; the broad migration backlog is closed.
- `scripts/check-architecture.mjs` now enforces `app/` as routing-only: new implementation files belong in `features/*`, `shared/*`, or `lib/*`.
- Keep existing `lib/<domain>` code until a domain is actively touched by a concrete feature, bug, performance issue, or review finding.
- Use compatibility exports during future moves only when tests or imports would churn heavily.
- Run `npm run check:architecture` after each migration PR.
- For access-sensitive changes, add deny/allow tests before replacing existing role checks.
