# Architecture

This project uses Next.js App Router, TypeScript, Supabase, and Tailwind. The current goal is architectural stabilization without changing public page URLs or API endpoints.

## Layer Rules

### `app/`

`app/` is the routing layer. It should describe URL structure, layouts, route handlers, loading/error states, and thin page composition.

Allowed in `app/`:

- `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`
- `route.ts` handlers that parse requests, authorize, call a domain service, and return a response
- standard Next.js route convention files such as `template.tsx`, `default.tsx`, and `global-error.tsx` when needed

Do not add arbitrary implementation files to `app/`, even if they are small. New feature/client/server files should go to `features/*`, cross-domain primitives to `shared/*`, and infrastructure or server utilities to `lib/*`.

Avoid putting in route files:

- large reusable components
- business rules
- complex forms and state machines
- Supabase queries, except explicitly documented auth/client exceptions
- domain hooks that can live in `features/<domain>/client`

### `features/`

`features/` is for product and business domains. New domain code should be placed here instead of deep inside `app/`.

Preferred shape:

```txt
features/<domain>/
  components/
  client/
  server/
  validation.ts
  types.ts
```

Use `features/<domain>/server` for use-cases, services, repositories, and domain-specific server logic. During migration, existing `lib/<domain>` modules can remain in place and be migrated only when touched.

### `shared/`

`shared/` is for truly cross-domain primitives only.

Allowed:

- generic UI primitives
- shared types
- constants with no product-domain ownership

Do not put CRM, admin, learning, billing, or other domain-specific logic in `shared/`.

### `lib/`

`lib/` remains the infrastructure layer and the temporary home for existing domain server code.

Stable infrastructure areas:

- `lib/supabase`
- `lib/auth`
- `lib/permissions`
- `lib/server`
- `lib/dates`
- common utilities

Existing `lib/<domain>` folders should not be moved in bulk. Move them gradually when a feature is actively being changed.

## Routing Rules

- Do not change public page URLs as part of architecture cleanup.
- Do not change API endpoints without a separate migration plan.
- Route Groups are for organization only and must not change URLs.
- Do not rename Route Groups just for cosmetic consistency.
- Review `(shared-zone)` route-by-route before moving anything out of it.

## API Rules

`app/api/**/route.ts` files should be thin adapters:

1. parse request params/body
2. authenticate and authorize
3. validate input
4. call a service/use-case
5. return a response

Do not put raw Supabase access in route handlers. `scripts/check-architecture.mjs` enforces this for `app/api`.

Protected API route handlers must call `requirePermission()` after authentication and before domain service side effects. Public, provider-authenticated, or internal utility endpoints are allowed only when they are explicitly listed in the architecture guard allowlist with a reason.

## Authorization Rules

The access model uses DB-backed RBAC metadata for protected authorization:

- role: business context
- permission: allowed function
- scope: allowed data boundary
- RLS: final row-level database guard

`profiles.role` remains a legacy compatibility/display/default metadata field, but it must not grant protected access.

Current legacy roles:

- `student`
- `teacher`
- `manager`
- `admin`

Authorization checks use permissions:

```ts
requirePermission(actor, "crm.leads.read");
```

The current permissions layer uses DB-backed RBAC metadata loaded into `AppActor`, with `can()` and permission-aware page/API guards as the application boundary. `profiles.role` remains a compatibility/default/display field only; it must not grant access, including when RBAC metadata is empty or fails to load. New DB-backed permissions must stay additive and be registered in the permission vocabulary before use.

Teacher preview must not create or mutate real student records. If persistent teacher demo progress becomes a product requirement later, use separate demo tables rather than shared `student_*` tables.

RLS should be rolled out by domain. Do not rewrite all policies in one PR, and do not reduce service-role usage until matching RLS policies and tests are proven.

Feature flags are separate from permissions:

- permission: whether a user may perform an action
- feature flag: whether a feature is enabled

Do not mix feature rollout checks into permission checks.

## Naming Conventions

- `billing`: balances, lesson credits, debts, adjustments, account settings
- `payments`: transactions and payment providers such as YooKassa
- `words`: vocabulary domain
- `flashcards`: training mode inside the words domain
- `staff_admin`: capability for `manager` and `admin`
