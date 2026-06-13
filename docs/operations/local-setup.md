# Local Setup

Status: current  
Audience: engineers, maintainers, AI coding agents  
Owner area: operations  
Last reviewed: 2026-05-25  
Source of truth: runbook; package scripts and README remain implementation sources  
Related code: `package.json`, `.env.example`, `README.md`, `lib/supabase/config.ts`, `playwright.config.ts`  
Related tests: `tests/README.md`, `tests/unit/access-docs-consistency.test.ts`

## When To Use

Use this runbook to start the app locally, run static checks, or prepare a local environment for focused development.

## Prerequisites

- Node.js 24.x, matching `package.json` engines.
- npm.
- Access to a Supabase project or a local Supabase-compatible environment with the required schema.
- Local environment variables in `.env.local`.

The repository root for this app is `dashboard-next-next16`. The parent `dashboard-next` directory may also contain git metadata, but this app's commands should run from `dashboard-next-next16`.

## Steps

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create local env file:

   ```bash
   cp .env.example .env.local
   ```

3. Fill `.env.local` with local/dev values. Use placeholders from `docs/operations/env-vars.md`; do not commit secrets.

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.

## Required Local Env Categories

- Supabase URL and publishable/anon key.
- Supabase service-role key only when exercising documented privileged server boundaries.
- Site/base URL if payment return URLs or canonical origin behavior are being tested.
- YooKassa variables only when testing checkout/webhook behavior.
- E2E credentials only when running Playwright auth smoke.

See `docs/operations/env-vars.md`.

## Supabase Assumptions

- The repo contains migrations and SQL Editor smoke scripts, but no `supabase/config.toml` was found in the current tree.
- Local Supabase CLI workflow is therefore needs confirmation for this project.
- The non-active bootstrap preparation and current migration limitations are documented in `docs/operations/self-hosted-supabase-readiness.md`.
- Cloud/staging Supabase is currently the safer assumed target for app integration unless a maintainer confirms local DB setup.

## Safe Local Commands

```bash
npm run check:architecture
npm run lint
npm run build
npx vitest run tests/unit/access-docs-consistency.test.ts
npm run test:unit
npm run test:smoke:ui
```

`npm run test:smoke` requires E2E auth variables. It starts or uses the Playwright web server defined in `playwright.config.ts`.

## Common Startup Failures

- Missing `NEXT_PUBLIC_SUPABASE_URL` or publishable key: Supabase config throws during server/client setup.
- Missing `SUPABASE_SERVICE_ROLE_KEY`: only privileged server boundaries fail; normal public/client code must not need it.
- Missing YooKassa variables: checkout/provider calls fail with configuration errors.
- Wrong working directory: commands may run against the parent wrapper instead of this app.
- Missing E2E credentials: `npm run test:check` fails before auth smoke.

## What Not To Do Locally

- Do not commit `.env.local` or real secrets.
- Do not use production service-role keys for casual local testing.
- Do not run live DB smoke against production unless the smoke script is explicitly production-safe.
- Do not invent local migration state; verify target DB state with the documented smoke scripts.

## Verification

For a clean local setup, run:

```bash
npm run check:architecture
npm run lint
npm run build
```

For documentation-only changes, also run:

```bash
npx vitest run tests/unit/access-docs-consistency.test.ts
```

## Related Docs

- `docs/README.md`
- `docs/operations/env-vars.md`
- `docs/operations/release-verification.md`
- `tests/README.md`
