# Tests

## Unit

- Run: `npm run test:unit`
- Stack: Vitest + Testing Library

## E2E / Smoke

- Run all E2E: `npm run test:e2e`
- Run auth smoke: `npm run test:smoke` (requires `E2E_*`)
- Run smoke without secrets: `npm run test:smoke:ui`
- Stack: Playwright

### Required env for auth scenarios

Set in `.env.local` (or shell):

- `E2E_STUDENT_EMAIL`
- `E2E_STUDENT_PASSWORD`
- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`

Optional:

- `PLAYWRIGHT_BASE_URL` (if not set, Playwright starts local dev server automatically).
- `E2E_TEACHER_EMAIL` / `E2E_TEACHER_PASSWORD` (for teacher-specific access checks)
- `E2E_MANAGER_EMAIL` / `E2E_MANAGER_PASSWORD` (for manager-specific access checks)

### Notes

- `npm run test:check` validates required `E2E_*` envs for auth smoke.
- Auth-dependent specs are marked `@requiresAuth`.
- Use `scripts/e2e-seed.sql` to prepare minimal repeatable DB state.
