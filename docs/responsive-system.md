# Responsive System

Status: current
Audience: engineers, product maintainers, UI designers, AI coding agents
Owner area: frontend architecture
Last reviewed: 2026-06-13
Source of truth: yes
Related code: `app/globals.css`, `app/`, `features/`, `shared/`, `components/`
Related tests: `tests/unit/main-header.test.tsx`

This document defines the responsive architecture for public pages, workspace screens, admin, teacher, student, shared UI, and future components.

## Breakpoints

| Layout state | Tailwind usage | Viewport | Purpose |
| --- | --- | --- | --- |
| Mobile | base classes | `< 768px` | Default stacked and touch-friendly layout |
| Tablet | `md:` | `768px+` | Tablet layout and intermediate component composition |
| Full desktop | `desktop:` | `1100px+` | Full desktop navigation and multi-column application layout |
| Wide | `xl:` | `1280px+` | Additional spacing, container width, and visual breathing room |

The project-specific full desktop breakpoint is defined in `app/globals.css`:

```css
@theme inline {
  --breakpoint-desktop: 1100px;
}
```

Do not duplicate this token in another Tailwind configuration.

## Implementation Rules

- Build mobile-first. Base classes describe the mobile state.
- Use `md:` for tablet adjustments.
- Use `desktop:` when a component switches to its full desktop composition.
- Use `xl:` for extra spacing, container width, wider gaps, or an established component contract that intentionally starts at 1280px.
- Do not treat `lg:` at 1024px as the default full desktop breakpoint for new components.
- Avoid `max-*` variants for mobile behavior when the same behavior can be expressed with base styles and a min-width variant.
- Do not introduce device-specific names such as `ipad`, `iphone`, `tablet-lg`, or `desktop-sm`.
- Avoid arbitrary `min-[...]` and `max-[...]` responsive variants. Use them only for a documented local layout failure that cannot be solved with `md`, `desktop`, or `xl`.
- Keep critical actions and information available at every supported layout state.

Preferred pattern:

```tsx
<section className="px-4 py-10 md:px-6 md:py-14 desktop:px-8 desktop:py-20 xl:px-0">
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 desktop:grid-cols-3 desktop:gap-6">
    {/* content */}
  </div>
</section>
```

Avoid for new components:

```tsx
<div className="grid min-[900px]:grid-cols-2 min-[1170px]:grid-cols-3" />
<div className="grid md:grid-cols-2 lg:grid-cols-3" />
```

## Existing Code Policy

Existing responsive behavior is migrated gradually when a page or component is already being changed for a concrete product or engineering reason. Do not mass-replace `lg:` or `xl:` without checking the rendered layout and the component contract.

- Legacy `lg:` usage exists across public/marketing, dashboard, admin, teacher, student, and shared/workspace UI.
- Existing `xl:` usage in the workspace shell controls the sidebar and related shell layout. It remains an intentional component contract until a dedicated workspace-shell change proves otherwise.
- The current audit found no device-specific breakpoint names and no responsive `min-[...]` or `max-[...]` variants.
- When touching legacy code, decide whether an existing `lg:` is a small tablet adjustment or a true full desktop switch. Move only the latter to `desktop:`.

## Review Checklist

- Mobile is represented by base styles rather than a reverse `max-*` override.
- Tablet behavior begins at `md:` where needed.
- Full desktop composition begins at `desktop:`.
- `xl:` adds space or preserves an explicitly documented 1280px component contract.
- No horizontal overflow, inaccessible controls, or hidden critical data is introduced.
- New custom or device-specific breakpoints are not added.
