# Authentication Flows

Status: current

Audience: engineers, maintainers, security reviewers, AI coding agents

Owner area: authentication

Last reviewed: 2026-06-13

Source of truth: auth flow and auth rate-limit guide; code remains the runtime source

Related code: `app/api/auth/`, `features/auth/`, `lib/auth/`, `lib/redis/`

Related tests: `tests/unit/auth-api-routes.test.ts`, `tests/unit/redis-rate-limit.test.ts`, `tests/unit/auth-rate-limit-countdown.test.tsx`, `tests/unit/login-page-client.test.tsx`, `tests/unit/register-page-client.test.tsx`, `tests/unit/forgot-password-page-client.test.tsx`, `tests/unit/reset-password-page-client.test.tsx`, `tests/unit/settings-form-state.test.tsx`

## Current Flows

- Public self-registration uses Supabase Auth email/password signup. Caller-provided role or metadata is not accepted; the database provisioning trigger defaults public users to `student`.
- Login, signup, password reset request, recovery password reset and account-settings password change go through `/api/auth/*`. Client forms do not call Supabase Auth directly.
- Account-settings password changes use `/api/auth/password/change` and delegate current password verification to Supabase Auth with `current_password`.
- Recovery password resets use `/api/auth/password/reset` only after a Supabase recovery link has been confirmed and a short-lived signed recovery marker cookie is present.
- Admin-created users are created through Supabase Admin Auth. Passwords are sent only to Supabase Auth and must not be stored, hashed, logged or shared through insecure channels.

## Redis Auth Rate Limiting

Auth rate limiting uses Upstash Redis and `@upstash/ratelimit` sliding windows. Redis clients and credentials remain server-only.

| Route / flow | Limit | Window | Identifier | Internal flow | Public flow |
| --- | ---: | ---: | --- | --- | --- |
| `POST /api/auth/login` | 25 attempts | 15 min | IP | `login-ip` | `login` |
| `POST /api/auth/login` | 5 attempts | 15 min | IP + normalized email | `login` | `login` |
| `POST /api/auth/signup` | 3 attempts | 1 hour | IP | `signup` | `signup` |
| `POST /api/auth/password/reset-request` | 10 requests | 1 hour | IP | `forgot-password-ip` | `forgot-password` |
| `POST /api/auth/password/reset-request` | 3 requests | 1 hour | IP + normalized email | `forgot-password` | `forgot-password` |
| `POST /api/auth/password/reset` | 5 attempts | 15 min | IP | `reset-password` | `reset-password` |
| `POST /api/auth/password/change` | 5 attempts | 15 min | user ID + IP | `change-password` | `change-password` |

Internal flows provide separate Redis namespaces under `app:auth:rl:<flow>`. Internal names such as `login-ip` and `forgot-password-ip` are never exposed in API JSON.

### Login Threshold Behavior

Login performs read-only prechecks for both login limiters before calling Supabase. If either key is already exhausted, the route returns `429` without calling Supabase or consuming another attempt.

After a failed Supabase login, both limiters consume an attempt. The failed request that exhausts either quota returns `429` immediately; for example, the fifth failed IP+email attempt is the threshold response rather than a normal invalid-credentials response. If both limiters are exhausted, the response uses the larger `retryAfter`.

After a successful login, only the IP+email `login` key is reset. The broader IP-only `login-ip` counter is intentionally retained because one valid account must not clear cross-email abuse protection. Redis reset failures are logged and do not turn a successful login into an authentication failure.

### Forgot-Password Behavior

Password reset requests check the IP-only limiter first and then the IP+email limiter. Either limiter may block the request, but both return the same public `forgot-password` flow and message so the response does not reveal which protection triggered.

### Failure Policy

If Redis credentials are absent, Redis is unavailable or a limiter operation fails, auth rate limiting fails open:

- the auth request continues;
- the Redis error is logged server-side;
- Redis or Upstash implementation details are not exposed to the user.

## Rate-Limit API Contract

A blocked auth request returns HTTP `429` with a JSON body:

```json
{
  "error": "Слишком много попыток входа. Попробуйте снова через 05 мин 00 сек.",
  "code": "RATE_LIMITED",
  "flow": "login",
  "retryAfter": 300
}
```

The response also includes:

```text
Retry-After: 300
```

`retryAfter` and `Retry-After` are derived from the same rounded-up number of seconds. The message is formatted from the public flow and uses `xx мин xx сек`.

## Client Countdown State

Each auth form owns an independent `useAuthRateLimitCountdown(defaultFlow)` instance. The hook persists an absolute timestamp in the current tab's `sessionStorage`:

```text
authRateLimit:<public-flow>:blockedUntil
```

Examples:

```text
authRateLimit:login:blockedUntil
authRateLimit:signup:blockedUntil
authRateLimit:forgot-password:blockedUntil
authRateLimit:reset-password:blockedUntil
authRateLimit:change-password:blockedUntil
```

On a `RATE_LIMITED` response, the hook calculates:

```text
blockedUntil = Date.now() + retryAfter * 1000
```

Remaining time is always recalculated from `blockedUntil - Date.now()` rather than decrementing a stale relative counter. The hook restores an unexpired timestamp after remount or refresh, synchronizes immediately on `document.visibilitychange` and `window.focus`, and removes local state and storage after expiry.

While a form's countdown is active:

- its flow-specific Russian rate-limit message remains visible;
- its submit path is guarded and its submit button is disabled;
- form input is retained;
- other auth forms do not inherit the countdown.

Successful completion clears the relevant local countdown. Validation errors and normal authentication errors do not clear an active countdown.

## Sliding-Window Reset Times

Upstash sliding windows return a reset timestamp aligned to the next boundary of the configured window. Consequently, independent one-hour flows such as signup and forgot-password can display exactly the same remaining time when they are blocked within the same aligned hour window.

Matching countdown values alone do not mean that frontend state or Redis keys are shared. Verify independence through:

- the public `flow` and `retryAfter` in each route's `429` response;
- the flow-specific `sessionStorage` keys;
- the separate Redis prefixes described above.

## Configuration

Required server-side environment variables:

```text
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

See `docs/operations/env-vars.md`. Never expose the token through a `NEXT_PUBLIC_*` variable.

## Future Supabase Invite Flow

Invite Flow is not implemented yet. Future invite onboarding should preserve these rules:

- Use trusted Auth app metadata such as `raw_app_meta_data.provision_role`; never trust client-controlled user metadata for roles.
- Keep provisioning idempotent for `profiles`, `user_roles`, `students`, `teachers`, teacher assignment and billing setup.
- Do not assume every user is only self-registered or fully admin-created with a password.
- Avoid duplicate profile/student records when an invited user accepts an invitation.
- Future lifecycle states may include `invited`, `pending`, `invitation_accepted`, `provisioned` and `active`.
