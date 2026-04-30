# Student Experience Loading

## Critical-first contract
- `page` loads only critical-above-the-fold summary, primary CTA and initial list shell.
- `section` loads secondary detail blocks that can later move into async boundaries.
- `client_interaction` remains reserved for filters, query-param follow-up and mutation refresh.

## Canonical student patterns
- `dashboard` and `student-dashboard`: shared route assembly via `renderStudentDashboardRoute()`, with `core summary` plus separate `payment reminder` section.
- `settings/payments`: narrow-loader `Promise.all` assembly for billing summary, payments list, plans and payment status context.
- `progress`: reference implementation for summary-first student loading.

## Current privileged exception
- Student billing summary and reminder-state remain a documented privileged exception until a user-scoped DB summary path exists.

## Future RPC/view candidates
- `student dashboard`: `student_words` counts and consolidated progress/test/mistakes aggregates
- `practice`: topic progress summary and recommendation feed aggregate
- `progress`: overview aggregate and weak-points aggregate
- `payments`: user-scoped billing summary and reminder-state summary
- `homework`: summary counts if overview calculations continue to grow
