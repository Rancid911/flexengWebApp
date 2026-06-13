# Student Experience Loading

## Critical-first contract
- `page` loads only critical-above-the-fold summary, primary CTA and initial list shell.
- `section` loads secondary detail blocks that can later move into async boundaries.
- `client_interaction` remains reserved for filters, query-param follow-up and mutation refresh.

## Canonical student patterns
- `dashboard`: shared route assembly via `renderStudentDashboardRoute()`, with `core summary` plus separate `payment reminder` section.
- `settings/payments`: narrow-loader `Promise.all` assembly for billing summary, payments list, plans and payment status context.
- `progress`: reference implementation for summary-first student loading.

## User-scoped companion paths
- `settings/payments`: billing summary uses the actor-scoped `get_accessible_student_billing_summary(...)` RPC through the user-scoped server client.
- `dashboard`: payment reminder state is isolated from the core dashboard payload and loads through an actor-scoped reminder RPC.

## Future RPC/view candidates
- `student dashboard`: `student_words` counts and consolidated progress/test/mistakes aggregates
- `practice`: topic progress summary and recommendation feed aggregate
- `progress`: overview aggregate and weak-points aggregate
- `homework`: summary counts if overview calculations continue to grow
