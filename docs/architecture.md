# Architecture Guidelines

This document defines the current layering rules for the dashboard-next project. It is intentionally conservative: it documents the architecture we want future changes to follow without requiring a rewrite of existing modules.

## Current Layers

- `app/*`: Next.js routing, layouts, pages, route handlers, and API transport boundaries.
- `app/(workspace)/*`: workspace shell, role-based route groups, route-level UI, and feature entrypoints for authenticated users.
- `app/(public)/*` and `app/main/*`: public website pages and public marketing UI.
- `app/(auth)/*`: authentication pages and Supabase auth UI flows.
- `components/ui/*`: reusable UI primitives only. These components should not know business domains.
- `components/search/*`: shared search UI and global search behavior.
- `hooks/*`: generic reusable React hooks. Domain-specific hooks should stay near the feature/domain.
- `lib/supabase/*`: Supabase client helpers and auth/session infrastructure.
- `lib/<domain>/*`: domain server logic, read queries, validation, DTO mapping, domain types, and service orchestration.
- `tests/*`: unit, smoke, and e2e coverage grouped by behavior rather than implementation layer.
- `supabase/*`: schema migrations, seeds, and SQL support files.

## Current Architecture State

- The preferred runtime path is `route/api -> auth/validation -> service/query -> repository -> mapper/DTO`.
- Practice and teacher workspace legacy files have been removed; new work should use the focused modules under `lib/practice/*` and `lib/teacher-workspace/*`.
- CRM, admin users, admin tests, admin word-card sets, teacher dossier, billing ledger and homework assignments have service/repository boundaries for the main workflows.
- Student dashboard aggregation is split into a read-only facade/orchestrator plus focused `types`, `descriptors`, `mappers` and `repository` modules.
- Admin blog, admin notifications, schedule queries, schedule UI, settings profile UI and the largest client-component shells have completed their planned cleanup passes.
- Cross-domain read models are allowed for dashboard and search, but they must stay read-only aggregators and must not own mutations for the domains they read from.
- The active architecture backlog is empty. New cleanup candidates should be added only when tied to a concrete feature, bug, performance issue, or review finding.

## Core Boundary Rules

- Pages and layouts may compose UI and call domain queries, but should not contain multi-table business workflows.
- API routes are transport adapters. They should parse, authorize, validate, call a domain service/query, and return a response.
- API routes should not directly own complex Supabase persistence flows across multiple tables.
- UI components should not directly call Supabase except for explicit auth/client SDK flows where Supabase requires browser interaction.
- Domain modules should expose use-case oriented functions, not table-shaped helpers for UI to orchestrate.
- Shared UI must stay domain-neutral. If a component contains CRM, student, teacher, payment, or learning rules, it belongs to that feature/domain.
- Privileged Supabase admin access must stay behind server-side authorization and domain services.

## File Naming Conventions For New Code

- `*.repository.ts`: raw persistence access only, usually Supabase selects/inserts/updates/deletes and raw row shapes.
- `*.service.ts`: business operations, orchestration, permissions-aware use cases, and multi-step workflows.
- `*.mapper.ts`: row-to-DTO and DTO-to-row transformations.
- `*.validation.ts`: Zod schemas and input normalization for a domain.
- `*.types.ts`: public domain types, DTOs, and shared internal types.
- `*.queries.ts`: read-only page/query use cases when the module is small and cohesive.
- `*.constants.ts`: stable domain constants without behavior.
- `*.utils.ts`: narrow helper functions for one domain. Avoid broad, cross-domain dumping grounds.

Existing files do not need to be renamed immediately. Apply these conventions to new files and when touching a module for a planned refactor.

## API Route Template

New API route handlers should follow this order:

1. Parse request URL/body.
2. Authorize the actor or confirm public access.
3. Validate input with the domain schema.
4. Call a domain service or query.
5. Map expected domain errors to HTTP errors.
6. Return a typed JSON response.

Do not put direct multi-table business workflows inside a route handler. If the handler starts coordinating several tables or domains, move that flow into a `*.service.ts` module first.

## Data Access Rules

- Supabase table names, select strings, and insert/update payloads should live in domain repositories or small query modules.
- Business logic should work with domain DTOs or normalized row types, not arbitrary `Record<string, unknown>` outside mapper boundaries.
- Cross-domain reads are allowed for dashboard/search/read-model use cases, but the module should be labeled as an aggregator and should not own mutations for those domains.
- Prefer explicit domain services over importing repositories from another domain in UI or API code.

## React Component Rules

- Keep route-level client components as orchestration shells when necessary, but push reusable sections into smaller components.
- Domain state hooks should live near the feature when they are not generic.
- Components should not combine UI rendering, server persistence, complex filtering, and business decisions if the logic can be split safely.
- Large client components should be refactored opportunistically when a related bug or feature is already being touched.

## Refactor Policy

- Avoid radical rewrites and mass moves.
- Prefer small PRs that preserve public API contracts and runtime behavior.
- Every refactor PR should state which boundary it improves: API transport, service orchestration, repository/data-access, mapper, validation, or UI decomposition.
- Minimum verification for documentation-only architecture changes: `npm run lint` and `npm run build`.
- Runtime refactors should add or update focused unit tests for the changed domain.
