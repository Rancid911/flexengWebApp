# Environment Variables

Status: current  
Audience: engineers, maintainers, release operators  
Owner area: operations  
Last reviewed: 2026-05-25  
Source of truth: operational guide; code and env examples define actual keys  
Related code: `.env.example`, `tests/e2e/.env.example`, `lib/supabase/config.ts`, `lib/supabase/admin.ts`, `lib/payments/yookassa.ts`, `lib/payments/server.ts`, `lib/server-origin.ts`, `playwright.config.ts`, `scripts/check-e2e-env.mjs`  
Related tests: `tests/README.md`, `tests/unit/payments-yookassa.test.ts`, `tests/unit/access-docs-consistency.test.ts`

This document lists env variable categories and safety rules. It must not contain real secret values.

## Supabase Public Client Variables

Use placeholders only:

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<legacy-anon-key-if-needed>
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is accepted as a compatibility fallback in
code. `.env.example` lists both names so each environment can populate the
publishable key and leave the legacy fallback empty unless it is required.

These variables are intentionally public and can be sent to browser bundles. They are not service-role secrets.

## Supabase Service-Role Variable

```text
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>
DATABASE_URL=<postgresql-connection-string-for-approved-operations>
```

Safety rules:

- Never expose this key through `NEXT_PUBLIC_*`.
- Never commit this key.
- Keep usage limited to allowlisted service-role boundaries in `docs/service-role-inventory.md`.
- New usage must update `docs/access-control/service-role.md`, `docs/service-role-inventory.md` and architecture checker rules.
- `DATABASE_URL` is an operational PostgreSQL connection string, not an app
  client key. Do not expose or commit it, and do not use it for unapproved
  production operations.

## Auth Recovery / Self-Hosted Auth Variables

```text
AUTH_RECOVERY_MARKER_SECRET=<dedicated-recovery-marker-secret>
SUPABASE_JWT_SECRET=<self-hosted-jwt-secret-or-compatibility-fallback>
SMTP_HOST=<smtp-host>
SMTP_PORT=<smtp-port>
SMTP_USER=<smtp-user>
SMTP_PASSWORD=<smtp-password>
SMTP_FROM=<smtp-sender>
```

`AUTH_RECOVERY_MARKER_SECRET` is the preferred secret for application recovery
markers. `SUPABASE_JWT_SECRET` is a compatibility fallback in code and is also
required when configuring a self-hosted Supabase Auth deployment.

SMTP values are operational self-hosted Auth placeholders; the Next.js runtime
does not read them directly.

## App / URL Variables

```text
SITE_URL=https://<canonical-domain>
NEXT_PUBLIC_SITE_URL=https://<canonical-domain>
```

`lib/server-origin.ts` reads `NEXT_PUBLIC_SITE_URL` first, then `SITE_URL`, then request headers/local fallback. These values affect canonical origin behavior and payment return URLs.

## YooKassa / Payment Variables

```text
YOOKASSA_SHOP_ID=<provider-shop-id>
YOOKASSA_SECRET_KEY=<provider-secret-key>
YOOKASSA_WEBHOOK_SECRET=<webhook-token>
```

`YOOKASSA_SHOP_ID` and `YOOKASSA_SECRET_KEY` are required for checkout/provider status calls. `YOOKASSA_WEBHOOK_SECRET` is used to validate webhook token input when configured.

Do not use production payment credentials in local experiments unless explicitly approved.

## Upstash Redis Variables

```text
UPSTASH_REDIS_REST_URL=<upstash-redis-rest-url>
UPSTASH_REDIS_REST_TOKEN=<server-only-upstash-redis-rest-token>
```

These variables are required for Redis-backed auth rate limiting. Keep the REST token server-only and never expose it through `NEXT_PUBLIC_*`.

## Playwright / E2E Variables

Required for `npm run test:smoke`:

```text
E2E_STUDENT_EMAIL=<student-email>
E2E_STUDENT_PASSWORD=<student-password>
E2E_ADMIN_EMAIL=<admin-email>
E2E_ADMIN_PASSWORD=<admin-password>
```

Optional:

```text
E2E_TEACHER_EMAIL=<teacher-email>
E2E_TEACHER_PASSWORD=<teacher-password>
E2E_MANAGER_EMAIL=<manager-email>
E2E_MANAGER_PASSWORD=<manager-password>
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100
PLAYWRIGHT_EXTERNAL_SERVER=1
```

`PLAYWRIGHT_EXTERNAL_SERVER=1` tells Playwright not to start its configured web server.

## Generic Runtime Variables

- `NODE_ENV` controls framework/test behavior and a small number of test-only branches.
- `CI` affects Playwright retries, workers and reporter.

## Environment Differences

- Local: `.env.local`, local/staging Supabase credentials, no production secrets by default.
- Preview/staging: Vercel or host-managed env vars; use staging Supabase and payment sandbox credentials where available.
- Production: production Supabase and provider credentials; service-role and provider secrets must remain server-only.

Deployment target details are needs confirmation unless a maintainer has documented the actual Vercel project settings.

## Handling Rules

- Never commit real secrets.
- Never paste production secrets into docs, tickets or prompts.
- Treat public env variables as intentionally public but still environment-specific.
- Rotate service-role/provider secrets if accidental exposure is suspected.
- Do not add new env vars without updating this doc and relevant feature docs.

## Related Docs

- `docs/README.md`
- `docs/access-control/README.md`
- `docs/access-control/service-role.md`
- `docs/features/payments-billing.md`
- `tests/README.md`
