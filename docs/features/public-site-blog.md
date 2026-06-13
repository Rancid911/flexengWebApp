# Public Site And Blog

Status: current  
Audience: engineers, content maintainers, marketing, support, security reviewers  
Owner area: public-site-blog  
Last reviewed: 2026-06-13
Source of truth: feature summary; current code/tests remain implementation source  
Related code: `app/(public)/`, `app/api/blog/`, `app/api/leads/route.ts`, `features/blog/`, `features/marketing/`, `lib/blog/public.ts`, `lib/admin/blog.service.ts`, `lib/crm/public-leads.service.ts`
Related tests: `tests/unit/admin-blog-routes.test.ts`, `tests/unit/admin-blog-service.test.ts`, `tests/unit/admin-blog-repository-selects.test.ts`, `tests/unit/crm-leads-route.test.ts`, `tests/unit/lead-form.test.tsx`, `tests/unit/public-site-shell.test.tsx`, `tests/unit/search-page.test.tsx`, `tests/unit/search-service.test.ts`

## Overview

The public site/blog surface serves unauthenticated marketing and educational content, public articles and public lead intake. Admin content creation and CRM lead management are documented separately.

Global documentation lives in `docs/README.md`, `docs/access-control/README.md`, `docs/access-control/permissions.md`, `docs/access-control/guards.md`, `docs/access-control/request-context.md`, `docs/access-control/rls-rpc.md` and `docs/access-control/verification-status.md`. Related feature docs: `docs/features/crm-leads.md`, `docs/features/admin-users-content.md` and `docs/features/search.md`.

## User Flows

- Guest opens `/`; marketing subsections are addressed by anchors such as `/#how-it-works`, `/#faq` and `/#lead-form`.
- Guest opens `/lp/trial-lesson` to review the free introductory lesson offer and submit the focused lead form without authentication.
- Guest opens `/articles` and filters/searches published blog posts by query, category, tag and sort.
- Guest opens `/articles/[slug]` and sees a published article plus related posts.
- Guest submits a public lead form through `/api/leads`.
- Admin/content maintainer creates and publishes blog content through protected admin routes.
- Search can return public blog results to guests and authenticated users.

## Routes And UI

- Public marketing pages live under `app/(public)/`.
- `/lp/trial-lesson` is a public landing route with route metadata in `app` and its implementation under `features/marketing/landing-pages/`.
- `PublicSiteShell` owns the single public header and footer and selects route-specific presentation from the current pathname. The trial lesson route uses one shared gradient behind the hero and footer; `MainFooter` uses its transparent variant only on that route. Other public routes retain the default shell and footer backgrounds.
- The trial lesson hero and form share the same `max-w-6xl` container and horizontal padding contract as the public navbar and footer. Desktop uses two top-aligned columns with a constrained form column; smaller viewports fall back to one column without horizontal overflow.
- The landing renders the existing cookie consent banner once inside the page. The footer remains owned by the parent public layout and is not duplicated by the landing.
- `/articles` renders the blog index with editorial/popular sections and live search shell.
- `/articles/[slug]` renders a published article or not-found.
- Blog pages use `revalidate = 300`.
- Public blog cover images render through blog UI components and stored URLs.

## APIs And Server Actions

| Endpoint | Method | Classification | Notes |
| --- | --- | --- | --- |
| `/api/blog/posts` | GET | public | Returns published blog post cards with pagination/filtering. |
| `/api/blog/posts/[slug]` | GET | public | Returns one published post or 404. |
| `/api/blog/meta` | GET | public | Returns active categories, tags and popular posts. |
| `/api/leads` | POST | public intake | Validates lead payload and creates a CRM lead. |
| `/api/admin/blog/*` | GET/POST/PATCH/DELETE | protected admin | Requires `content.manage`; documented in `docs/features/admin-users-content.md`. |

## Data Model

Key tables:

- `blog_posts`: slug, title, excerpt/content, cover image URL, status, published timestamp, SEO fields and view metadata.
- `blog_categories`, `blog_tags`, `blog_post_tags`: public taxonomy.
- CRM lead tables used by public lead intake are documented in `docs/features/crm-leads.md`.
- Search documents may include public blog content for hybrid search.

## Access Control

- Public blog APIs use a publishable Supabase client with no persisted session and filter to published/active content.
- Public lead intake validates payload server-side and does not grant CRM management access.
- Protected blog management requires `content.manage`.
- Public route availability is not an authorization shortcut for admin routes.
- RLS/live verification of public published-content policies remains separate from static code review.

## State And Lifecycle

- Blog post lifecycle is owned by admin content management: draft/unpublished content should not appear in public routes.
- Public index query state includes `q`, `category`, `tag`, `sort` and `page`.
- Article metadata uses SEO title/description when present.
- Public lead submission creates a CRM lead for later protected management.
- The trial lesson form identifies submissions with `source = trial_lesson_landing` and `form_type = trial_lesson`. Campaign attribution and consent metadata are documented in `docs/features/crm-leads.md`.

## Integrations

- Supabase public client reads published blog content.
- CRM receives public lead intake.
- Trial lesson campaign attribution is collected in the browser immediately before form submission and sent through the existing `/api/leads` contract.
- Admin content tooling manages blog posts/categories/tags.
- Search indexes public blog content and exposes public-only results to guests.

## Loading And Errors

- Blog index loads editorial, posts and metadata in parallel.
- Unknown categories/tags return empty paginated results.
- Missing articles return Next.js not-found from page route or 404 from API.
- Public lead validation errors return typed validation failures.

## Tests

Current focused coverage includes:

- Trial lesson offer, form fields, responsive container contract and attribution payload tests.
- Public shell tests for the route-specific shared background and transparent footer while preserving default footer behavior.
- Admin blog route/service/repository tests.
- CRM lead route tests for public intake.
- Search tests that include blog/public sections.

Coverage gaps:

- Dedicated public blog page/component tests can be expanded.
- SEO metadata behavior is mostly covered by code inspection rather than targeted unit tests.
- Visual details of the landing remain subject to manual responsive review.
- Live DB/RLS verification for published-only reads is separate.

## Operations

- For missing public articles, check `blog_posts.status`, `published_at`, slug, category/tag relations and RLS policies.
- For public lead failures, inspect `/api/leads` validation and CRM public lead service.
- For trial lesson layout regressions, verify the pathname selected by `PublicSiteShell`, the transparent `MainFooter` variant and the shared `max-w-6xl` container contract.
- For search issues involving blog results, use `docs/features/search.md`.

## Known Limitations

- Public blog reads rely on published filters in code plus DB/RLS posture; static code review is not live DB proof.
- Lead intake anti-abuse/rate-limit posture is not documented here and should be reviewed separately if needed.
- Admin content workflows are intentionally linked rather than duplicated in this doc.
