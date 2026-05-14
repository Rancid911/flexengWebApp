## Summary

- 

## Runtime / API Impact

- [ ] No public URLs changed
- [ ] No API paths, request payloads, or response contracts changed
- [ ] Runtime behavior changes are described above, or this is documentation/test-only

## Architecture Checklist

- [ ] New feature/client/server implementation files are not added under `app`
- [ ] Protected `app/api/**/route.ts` handlers call `requirePermission()`
- [ ] Public, provider-authenticated, or internal API exceptions are intentionally listed in `scripts/check-architecture.mjs`
- [ ] UI does not call Supabase directly except explicit auth/logout browser flows
- [ ] Storage and persistence writes go through API/service boundaries

## Verification

- [ ] `npm run check:architecture`
- [ ] `npm run lint`
- [ ] `npx tsc --noEmit`
- [ ] `npm run build`
- [ ] Targeted tests or `npm run test:unit`
