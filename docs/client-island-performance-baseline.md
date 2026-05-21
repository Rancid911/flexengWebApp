# Client Island Performance Baseline

This note records the current post-migration client-heavy surfaces. It is a measurement baseline, not a mandate to split code immediately.

## Current Client Islands

| Surface | Current state | Next action |
| --- | --- | --- |
| Admin Console | Forms and drawers are lazy-mounted and code-split with `next/dynamic`; option catalogs load on user action. | Run bundle analysis before further splitting. |
| Schedule | Staff schedule state remains a justified interactive client island for filters, drawer state, catalog loading, and mutations. | Optimize only if route chunk or interaction profiling shows a bottleneck. |
| CRM | Board interactions and settings drawer remain client-side; background image state is bridged through React context and media API URLs. | Keep as-is unless board interactions regress. |
| Workspace Shell | Navigation, sidebar, overlays, logout, profile state, CRM badge, and CRM background glass mode are centralized in the shell. | Measure hydration cost before moving state out. |
| Settings Profile | Form validation, avatar crop/normalization, and cache sync remain client-side; persistence is backend-mediated. | Keep as-is unless avatar workflow becomes a bundle hotspot. |

## Measurement Procedure

Use the existing no-extra-dependency checks first:

```bash
npm run check:architecture
npm run build
```

Record the Next.js build route sizes for:

- `/admin`
- `/schedule`
- `/crm`
- `/settings/profile`
- `/dashboard`

If route sizes or runtime profiling identify a real problem, add a separate focused PR for that surface. Do not combine bundle work with authorization or RLS changes.

## CRM Polling Decision

`/api/crm/unread-summary` polling is already idle and visibility aware. Further route-specific pausing should be done only if production/request logs show material background API noise on non-CRM admin or manager routes.

Acceptance criteria for a future CRM polling PR:

- badge still updates through event-driven refresh;
- visible-tab refresh still works;
- background requests per minute drop on non-CRM routes;
- CRM page behavior does not change.
