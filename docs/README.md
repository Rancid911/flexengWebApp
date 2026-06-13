# Project Documentation Index

Status: current  
Audience: engineers, product maintainers, security reviewers, AI coding agents  
Owner area: documentation system  
Last reviewed: 2026-05-25  
Source of truth: yes  
Related code: `app/`, `features/`, `lib/`, `supabase/`, `scripts/check-architecture.mjs`  
Related tests: `tests/unit/access-docs-consistency.test.ts`

This is the central entrypoint for project documentation. Start here before using older audits, migration plans, or feature notes.

## Documentation Statuses

| Status | Meaning |
| --- | --- |
| `current` | Describes the current intended implementation or operating procedure. |
| `partial` | Useful and mostly relevant, but incomplete for its topic. |
| `draft` | Proposed or unfinished documentation that is not yet authoritative. |
| `historical` | Useful context or decision history, but not current runtime truth. |
| `deprecated` | Superseded documentation kept temporarily for reference. |
| `stale` | Known or likely to contradict current code or architecture. |
| `needs review` | Not yet verified against current code. |

Historical documents must include a visible warning:

```md
> Historical document. This is not current runtime truth.
```

## Current Source Of Truth

| Topic | Current doc | Notes |
| --- | --- | --- |
| Architecture and layering | `docs/architecture.md` | Root `ARCHITECTURE.md` is a short overview/pointer, not a second full source of truth. |
| Authentication and auth rate limiting | `docs/auth-flows.md` | Current Supabase Auth flows, Redis limiter configuration, `429` contract and client countdown persistence. |
| Current access-control model | `docs/access-control-current-state.md` | Start here for RBAC, AppActor, guards, compatibility layers, and source links. |
| Access/security navigation | `docs/access-control/README.md` | Start here for focused RBAC, AppActor, guards, service-role, storage, RLS/RPC and verification guides. |
| Foundational access/loading contract | `docs/foundations-access-and-loading.md` | Request-context and data-loading levels. |
| Service-role inventory | `docs/service-role-inventory.md` | Enforced baseline for `createAdminClient()` usage. |
| Storage/media access | `docs/storage-access-inventory.md` | Bucket posture, media proxy, and smoke target. |
| RLS/RPC verification | `docs/rls-smoke-harness.md` | Live verification guide; static migrations are not live proof. |
| Workspace shell/hard-refresh boundary | `docs/workspace-hard-refresh-audit.md` | Current boundary doc despite audit title; rename may happen later. |
| Workspace loading/skeleton contract | `docs/workspace-loading-skeleton-contract.md` | Current loading hierarchy after one-shell. |
| ScheduleActor boundary | `docs/schedule-actor-permission-boundary.md` | Current `accessMode` and role compatibility boundary. |
| Teacher preview write safety | `docs/teacher-preview-write-surface-audit.md` | Current identity-based real-student write boundary despite audit title. |
| Domain map | `docs/domain-map.md` | Current high-level domain/module map. |
| Self-hosted Supabase readiness | `docs/operations/self-hosted-supabase-readiness.md` | Non-active baseline cutoff strategy and clean rehearsal safety boundary. |

## Architecture

- `docs/architecture.md` is the detailed current architecture source.
- `ARCHITECTURE.md` should stay a short root overview and pointer.
- `docs/domain-map.md` maps current domains to code locations and status.
- `docs/client-island-performance-baseline.md` records current client-heavy surfaces.

Planned:

- `docs/architecture/layering.md`
- `docs/architecture/workspace-shell.md`
- `docs/architecture/data-loading.md`

## Access And Security

Start with `docs/access-control/README.md` for the navigable access/security map.

Current:

- `docs/access-control/README.md`
- `docs/access-control/permissions.md`
- `docs/access-control/request-context.md`
- `docs/access-control/guards.md`
- `docs/access-control/service-role.md`
- `docs/access-control/storage-media.md`
- `docs/access-control/rls-rpc.md`
- `docs/access-control/verification-status.md`
- `docs/access-control-current-state.md`
- `docs/service-role-inventory.md`
- `docs/storage-access-inventory.md`
- `docs/rls-smoke-harness.md`
- `docs/schedule-actor-permission-boundary.md`
- `docs/teacher-preview-write-surface-audit.md`

Planned:

- API route classification doc.

## Feature Documentation

Current P0 feature docs:

- `docs/features/dashboard.md`
- `docs/features/payments-billing.md`
- `docs/features/schedule.md`
- `docs/features/search.md`
- `docs/features/crm-leads.md`
- `docs/features/students-teachers.md`
- `docs/features/notifications.md`
- `docs/features/homework-practice-tests.md`
- `docs/features/admin-users-content.md`
- `docs/features/storage-media.md`
- `docs/features/settings-profile.md`
- `docs/features/words-flashcards.md`
- `docs/features/public-site-blog.md`

Existing feature READMEs are partial placeholders unless they explicitly say otherwise:

- `features/admin/README.md`
- `features/billing/README.md`
- `features/crm/README.md`
- `features/schedule/README.md`
- `features/settings/README.md`
- `features/workspace-shell/README.md`

Planned P1/P2 feature docs:

- none currently listed; add future supporting features here as they are identified.

Feature docs must link to global access-control docs and document only feature-specific permissions, scopes, routes, data, tests, and operational notes.

## API And Data

Current:

- `docs/screen-data-map-by-role.md` is useful but needs review before treating it as current.
- `supabase/migrations/*` and `supabase/sql-editor/*` are implementation and verification artifacts, not documentation by themselves.

Planned:

- `docs/api/route-classification.md`;
- `docs/data/schema-overview.md`;
- `docs/data/rpc-catalog.md`;
- `docs/data/storage-buckets.md`.

## Operations And Testing

Current:

- `tests/README.md`
- `docs/operations/local-setup.md`
- `docs/operations/env-vars.md`
- `docs/operations/deployment.md`
- `docs/operations/self-hosted-supabase-readiness.md`
- `docs/operations/release-verification.md`
- `docs/operations/smoke-tests.md`
- `docs/testing/test-strategy.md`
- `docs/rls-smoke-harness.md`
- `docs/storage-access-inventory.md`
- `docs/test-drill-sql-agent-prompt.md`

Planned:

- payment-provider runbook.

## Decisions And Historical Documents

Current:

- `docs/decisions/README.md`
- `docs/decisions/historical/README.md`

These documents are useful context but must not be used as current runtime truth without checking current docs and code:

- `docs/decisions/historical/architecture-migration.md`
- `docs/decisions/historical/rbac-rls-implementation-plan.md`
- `docs/decisions/historical/refactor-backlog.md`
- `docs/decisions/historical/performance-db-audit-phase2-2026-04-01.md`
- `docs/decisions/historical/online-school-product-audit-2026-03.md`
- `docs/decisions/historical/online-school-delivery-plan-2026-q2.md`

The previous paths are retained as compatibility stubs only.

## Templates

Use templates for new documentation:

- `docs/templates/feature-template.md`
- `docs/templates/architecture-template.md`
- `docs/templates/access-control-template.md`
- `docs/templates/api-contract-template.md`
- `docs/templates/runbook-template.md`
- `docs/templates/adr-template.md`

## Documentation Roadmap

### Phase 1: Index and status standard

Goal: establish this index, templates, and source-of-truth mapping.  
Deliverables: central docs index, status definitions, templates, docs consistency test.  
Acceptance: current and historical docs are discoverable and clearly separated.

### Phase 2: Access/security cleanup

Goal: make security docs navigable without reading historical plans.  
Deliverables: RBAC/permissions guide, current RLS/RPC catalog, API route classification.  
Acceptance: engineers can identify current authorization and live-verification boundaries from current docs only.

### Phase 3: High-risk feature docs

Goal: document the features with security, payment, or data-safety risk.  
Deliverables: payments/billing, schedule, students/teachers, CRM, search, notifications.  
Acceptance: each doc has routes, APIs, data model, access control, tests, and operational notes.

### Phase 4: Remaining feature docs

Goal: cover remaining product modules.  
Deliverables: dashboard, homework, practice/tests, words/flashcards, admin content, settings, public site/blog.  
Acceptance: every major `features/*` and domain `lib/*` area has a feature doc or an explicit owner doc.

### Phase 5: Operations/testing docs

Goal: make release and incident work repeatable.  
Deliverables: env/deployment docs, smoke-test runbooks, CI/check matrix, rollback/debug notes.  
Acceptance: a new maintainer can run local checks and release verification without tribal knowledge.

### Phase 6: Enforcement

Goal: keep docs current with lightweight checks.  
Deliverables: PR checklist, docs consistency tests, optional architecture checker doc rules, ADR process.  
Acceptance: new features require docs updates or an explicit "docs not needed" rationale.

## Contributor Rules

- Update docs in the same PR when a feature route, API contract, permission, data model, or operational procedure changes.
- If docs are not needed, say why in the PR description.
- Do not copy global RBAC/RLS/service-role rules into feature docs; link to the source-of-truth docs and list feature-specific details.
- Do not treat hidden navigation as security in documentation.
- Do not claim live DB verification unless a live smoke run is recorded.
