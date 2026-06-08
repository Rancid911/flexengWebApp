# Loading Screen Inventory

Status: current  
Audience: engineers, product maintainers, design reviewers, AI coding agents  
Owner area: workspace loading UX  
Last reviewed: 2026-05-26  
Source of truth: audit inventory; current code remains implementation source  
Related code: `app/`, `features/workspace-shell/components/loading/workspace-loading-skeletons.tsx`, `docs/workspace-loading-skeleton-contract.md`  
Related tests: `tests/unit/workspace-loading-skeletons.test.tsx`, `tests/unit/workspace-layouts.test.tsx`

This inventory records the current loading/skeleton state across the screen-accurate skeleton implementation passes. It intentionally does not claim every route is fixed. Use this file to decide which route skeletons to add, replace, keep neutral, or leave absent.

The root fallback at `app/loading.tsx` and the parent workspace fallback at `app/(workspace)/loading.tsx` are bootstrap placeholders, not page skeletons. Both intentionally use the same minimal light spinner loader so sequential parent-child loading states after login redirects or hard refreshes do not feel like different screens. Keep both light, minimal and non-page-like; page routes such as `/dashboard` own their actual page skeletons.

Status values:

- `accurate`: existing skeleton structurally matches the final screen.
- `updated`: skeleton was changed in the implementation pass.
- `neutral fallback`: route currently falls back to a broad neutral loading state.
- `no dedicated skeleton needed`: route is static/simple enough that a dedicated skeleton would add noise.
- `documented exception`: route has mixed shell/public behavior or another explicit reason to avoid normal workspace skeleton rules.
- `requires manual verification`: route needs browser validation before marking accurate.

## App Bootstrap Loading

| Route/screen | Final layout type | Final component inspected | Existing loading source | Current skeleton type | Problem | Action/status |
| --- | --- | --- | --- | --- | --- | --- |
| Root app bootstrap | Any route before a more specific loading boundary resolves | `app/layout.tsx` | `app/loading.tsx` | Minimal light segmented spinner shared with workspace loading | Previously used dark root tokens and a dashboard-like grid; root loading must not become dashboard-like | `updated` |
| Workspace bootstrap | Protected workspace shell before route-level content resolves | `features/workspace-shell/server/workspace-shell.server.tsx` | `app/(workspace)/loading.tsx` | Minimal light segmented spinner shared with root loading | May appear before `/dashboard/loading.tsx`; must stay minimal to avoid competing with dashboard page skeleton | `updated` |

## Workspace Routes

| Route/screen | Final layout type | Final component inspected | Existing loading source | Current skeleton type | Problem | Action/status |
| --- | --- | --- | --- | --- | --- | --- |
| `/dashboard` | Shared dashboard aggregator for student, teacher, admin and manager workspaces | `features/dashboard/server/dashboard-route.tsx` | `app/(workspace)/(shared-zone)/dashboard/loading.tsx` | Role-neutral dashboard overview, status card, action card, widget grid and stat cards | Shared fallback is intentionally layout-compatible with the student dashboard because it is currently the most layout-sensitive dashboard; `loading.tsx` must not add role/auth/data logic | `updated` |
| `/schedule` | Schedule filters plus agenda/list | `features/schedule/server/schedule-route.tsx` | `app/(workspace)/(shared-zone)/schedule/loading.tsx` | Schedule header, filter row and lesson rows | Structurally close; verify against current agenda/table layout | `requires manual verification` |
| `/students` | Teacher student directory | `features/teacher-workspace/server/teacher-students-route.tsx` | `app/(workspace)/(teacher-zone)/students/loading.tsx` | Directory header, search row and list rows | Structurally close for teacher directory | `requires manual verification` |
| `/students/[studentId]` | Teacher student profile/detail | `features/teacher-workspace/server/teacher-student-profile-route.tsx` | `app/(workspace)/(teacher-zone)/students/[studentId]/loading.tsx` | Profile header and detail sections | Structurally close; nested detail tabs need validation | `requires manual verification` |
| `/admin` | Admin console with tabs/lists | `app/(workspace)/(staff-zone)/admin/page.tsx`, `features/admin/components/admin-console/` | `app/(workspace)/(staff-zone)/admin/loading.tsx` | Admin header, tab row and list area | Structurally close for admin console | `requires manual verification` |
| `/admin/students` | Admin student directory | `features/admin/server/admin-directory-routes.tsx` | `app/(workspace)/(staff-zone)/admin/students/loading.tsx` | Admin directory hero, search row, list rows and pagination | Implemented route-local directory fallback; browser validation still required | `updated` |
| `/admin/students/[studentId]` | Admin student profile/detail | `features/students/server/admin-student-profile-route.tsx` | `app/(workspace)/(staff-zone)/admin/students/[studentId]/loading.tsx` | Admin profile hero, tabs/sections and detail cards | Implemented route-local profile fallback; browser validation still required | `updated` |
| `/admin/teachers` | Admin teacher directory | `features/admin/server/admin-directory-routes.tsx` | `app/(workspace)/(staff-zone)/admin/teachers/loading.tsx` | Admin directory hero, search row, list rows and pagination | Implemented route-local directory fallback; browser validation still required | `updated` |
| `/admin/teachers/[teacherId]` | Admin teacher profile/detail | `features/admin/components/teacher-dossier/` | `app/(workspace)/(staff-zone)/admin/teachers/[teacherId]/loading.tsx` | Admin profile hero, dossier sections and detail cards | Implemented route-local profile fallback; browser validation still required | `updated` |
| `/admin/payments` | Admin payments control | `features/billing/components/admin-payments-control-client.tsx` | `app/(workspace)/(staff-zone)/admin/payments/loading.tsx` | Admin payment hero, metrics, filters, payment rows and settings panel | Implemented route-local payments fallback; browser validation still required | `updated` |
| `/crm` | CRM kanban board | `features/crm/components/crm-board-client.tsx` | `app/(workspace)/(staff-zone)/crm/loading.tsx` | CRM board columns and lead cards | Structurally close | `requires manual verification` |
| `/settings/profile` | Settings profile form | `features/settings/components/settings-client.tsx` | `app/(workspace)/(shared-zone)/settings/profile/loading.tsx` | Settings form skeleton | Structurally close; client runtime loading remains local | `requires manual verification` |
| `/settings/payments` | Student payments summary/cards/history | `features/payments/server/payments-route.tsx` | `app/(workspace)/(student-zone)/settings/payments/loading.tsx` | Student payments summary, plan cards and history rows | Fixed: no longer uses `WorkspaceSettingsLoadingSkeleton`; browser validation still required | `updated` |
| `/homework` | Homework overview/list | `features/homework/server/homework-routes.tsx` | `app/(workspace)/(shared-zone)/homework/loading.tsx` | Homework tabs/status filters and assignment rows | Implemented route-local homework list fallback; browser validation still required | `updated` |
| `/homework/[id]` | Homework detail | `features/homework/server/homework-routes.tsx` | `app/(workspace)/(shared-zone)/homework/[id]/loading.tsx` | Homework title/meta, progress and task sections | Implemented detail fallback separate from list fallback; browser validation still required | `updated` |
| `/homework/active` | Homework filtered list | `features/homework/server/homework-routes.tsx` | `app/(workspace)/(shared-zone)/homework/active/loading.tsx` | Homework tabs/status filters and assignment rows | Implemented route-local filtered-list fallback; browser validation still required | `updated` |
| `/homework/completed` | Homework filtered list | `features/homework/server/homework-routes.tsx` | `app/(workspace)/(shared-zone)/homework/completed/loading.tsx` | Homework tabs/status filters and assignment rows | Implemented route-local filtered-list fallback; browser validation still required | `updated` |
| `/homework/overdue` | Homework filtered list | `features/homework/server/homework-routes.tsx` | `app/(workspace)/(shared-zone)/homework/overdue/loading.tsx` | Homework tabs/status filters and assignment rows | Implemented route-local filtered-list fallback; browser validation still required | `updated` |
| `/practice` | Practice overview cards | `features/practice/server/practice-overview-route.tsx` | `app/(workspace)/(shared-zone)/practice/loading.tsx` plus section Suspense | Practice overview header, subnav and three action cards | Implemented route-local overview fallback; existing section Suspense fallbacks remain local; browser validation still required | `updated` |
| `/practice/catalog` | Practice catalog/filter grid | `features/practice/server/practice-library-routes.tsx` | `app/(workspace)/(shared-zone)/practice/catalog/loading.tsx` | Practice library header, filters and activity cards | Implemented route-local library fallback; browser validation still required | `updated` |
| `/practice/recommended` | Recommended practice cards | `features/practice/server/practice-library-routes.tsx` | `app/(workspace)/(shared-zone)/practice/recommended/loading.tsx` | Practice library header, subnav and recommendation cards | Implemented route-local library fallback; browser validation still required | `updated` |
| `/practice/favorites` | Favorite practice items | `features/practice/server/practice-library-routes.tsx` | `app/(workspace)/(shared-zone)/practice/favorites/loading.tsx` | Practice library header, subnav and card grid | Implemented route-local library fallback; browser validation still required | `updated` |
| `/practice/mistakes` | Practice mistakes list | `features/practice/server/practice-library-routes.tsx` | `app/(workspace)/(shared-zone)/practice/mistakes/loading.tsx` | Practice library header, subnav and card grid | Implemented route-local library fallback; browser validation still required | `updated` |
| `/practice/topics` | Practice topic grid | `features/practice/server/practice-library-routes.tsx` | `app/(workspace)/(shared-zone)/practice/topics/loading.tsx` | Practice topic header, subnav and topic cards | Implemented route-local topic fallback; browser validation still required | `updated` |
| `/practice/topics/[topic]` | Practice topic detail | `features/practice/server/practice-library-routes.tsx` | `app/(workspace)/(shared-zone)/practice/topics/[topic]/loading.tsx` | Practice topic header, subnav and subtopic cards | Implemented route-local topic fallback; browser validation still required | `updated` |
| `/practice/topics/[topic]/[subtopic]` | Practice subtopic detail | `features/practice/server/practice-library-routes.tsx` | `app/(workspace)/(shared-zone)/practice/topics/[topic]/[subtopic]/loading.tsx` | Practice topic breadcrumb/header and activity cards | Implemented route-local topic/detail fallback; browser validation still required | `updated` |
| `/practice/activity/[activityId]` | Activity/test runner | `features/practice/server/practice-activity-route.tsx` | `app/(workspace)/(shared-zone)/practice/activity/[activityId]/loading.tsx` | Practice activity header, content area and answer/action controls | Implemented activity-specific fallback; browser validation still required | `updated` |
| `/words` | Words overview/topics | `features/words/server/words-overview-routes.tsx` | `app/(workspace)/(shared-zone)/words/loading.tsx` | Vocabulary library filters, counters and word rows | Implemented route-local vocabulary library fallback; browser validation still required | `updated` |
| `/words/review` | Words list | `features/words/server/words-list-routes.tsx` | `app/(workspace)/(shared-zone)/words/review/loading.tsx` | Vocabulary library filters, counters and word rows | Implemented route-local vocabulary list fallback; browser validation still required | `updated` |
| `/words/new` | Words list | `features/words/server/words-list-routes.tsx` | `app/(workspace)/(shared-zone)/words/new/loading.tsx` | Vocabulary library filters, counters and word rows | Implemented route-local vocabulary list fallback; browser validation still required | `updated` |
| `/words/difficult` | Words list | `features/words/server/words-list-routes.tsx` | `app/(workspace)/(shared-zone)/words/difficult/loading.tsx` | Vocabulary library filters, counters and word rows | Implemented route-local vocabulary list fallback; browser validation still required | `updated` |
| `/words/topics/[topicSlug]` | Word topic detail | `features/words/server/words-overview-routes.tsx` | `app/(workspace)/(shared-zone)/words/topics/[topicSlug]/loading.tsx` | Vocabulary library/topic filters, counters and word rows | Implemented route-local topic fallback; browser validation still required | `updated` |
| `/words/train` | Flashcard trainer | `features/words/server/words-train-route.tsx` | `app/(workspace)/(shared-zone)/words/train/loading.tsx` | Flashcard trainer card, progress and action controls | Implemented trainer-specific fallback; browser validation still required | `updated` |
| `/search` | Mixed public/auth search page | `features/search/server/search-route.tsx` | `app/search/loading.tsx` plus shell-preserving inner Suspense fallback | Search hero/input/chips and result rows | Implemented search-shaped fallback without changing public/auth shell selection; browser validation still required | `updated` |

## Public Routes

| Route/screen | Final layout type | Final component inspected | Existing loading source | Current skeleton type | Problem | Action/status |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | Public marketing homepage | `app/(public)/page.tsx` | `app/(public)/loading.tsx` | Generic public hero/cards | Acceptable generic fallback for static/marketing route | `neutral fallback` |
| `/articles` | Blog index/search/filter/cards | `features/blog/server/blog-routes.tsx` | `app/(public)/articles/loading.tsx` | Public article list/search/filter cards | Implemented blog-owned public fallback; browser validation still required | `updated` |
| `/articles/[slug]` | Blog article detail | `features/blog/server/blog-routes.tsx` | `app/(public)/articles/[slug]/loading.tsx` | Public article title/meta/cover/content blocks | Implemented blog-owned detail fallback; browser validation still required | `updated` |

## Auth Routes

| Route/screen | Final layout type | Final component inspected | Existing loading source | Current skeleton type | Problem | Action/status |
| --- | --- | --- | --- | --- | --- | --- |
| `/login` | Centered auth form | `features/auth/components/login-page-client.tsx` | `app/(auth)/loading.tsx` | Centered card block | Acceptable generic auth-card fallback; button pending remains local | `requires manual verification` |
| `/register` | Centered auth form | `features/auth/components/register-page-client.tsx` | `app/(auth)/loading.tsx` | Centered card block | Acceptable generic auth-card fallback; button pending remains local | `requires manual verification` |
| `/forgot-password` | Centered auth form | `app/(auth)/forgot-password/page.tsx` | `app/(auth)/loading.tsx` | Centered card block | Acceptable generic auth-card fallback | `requires manual verification` |
| `/reset-password` | Centered auth form | `app/(auth)/reset-password/page.tsx` | `app/(auth)/loading.tsx` | Centered card block | Acceptable generic auth-card fallback | `requires manual verification` |

## Follow-up Implementation Targets

1. Browser-verify the PR-SKEL-2A, PR-SKEL-2B, PR-SKEL-2C and PR-SKEL-2D routes before changing `updated` rows to `accurate`.
2. Keep `/search` shell behavior under manual verification for both guest and authenticated users.
3. Keep simple redirects and static marketing routes as no-skeleton or neutral-fallback decisions.
4. Keep all local Suspense/client pending states scoped to their section or interaction.

PR-SKEL-2A note: `/settings/payments` no longer uses the generic `WorkspaceSettingsLoadingSkeleton`; it uses `WorkspaceStudentPaymentsLoadingSkeleton`.
PR-SKEL-2B note: practice overview, library, topic and activity routes now use separate skeleton families; activity pages do not use the generic practice library skeleton.
PR-SKEL-2C note: admin directories, admin profiles and admin payments no longer inherit the generic `WorkspaceAdminLoadingSkeleton`; they use route-local directory/profile/payments skeletons.
PR-SKEL-2D note: `/search` uses a search-shaped route fallback plus an inner Suspense fallback inside the existing public/auth shell decision; search authorization and result visibility remain unchanged.
Dashboard note: `/dashboard/loading.tsx` is shared across student, teacher, admin and manager dashboard branches, so it intentionally stays role-neutral and presentational-only. It follows the student dashboard's proportions to reduce layout shift on the most layout-specific branch, but shared loading must not read auth, roles, RBAC, cookies, headers or data. If dashboard routing is split into role-specific routes later, those routes may own dedicated loading skeletons.
Workspace bootstrap note: `app/(workspace)/loading.tsx` may render before `/dashboard/loading.tsx` while the workspace shell resolves. Its `WorkspaceNeutralLoadingSkeleton` is intentionally compact, light and non-page-like to avoid two visually competing full-page skeleton states in sequence.
