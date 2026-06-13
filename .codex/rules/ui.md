# Практические правила UI

## Компоненты и стиль

- Сначала переиспользуй существующие primitives из `components/ui/`, cross-domain элементы из `shared/ui/` и компоненты изменяемого `features/<domain>`.
- Сохраняй текущий Tailwind CSS, shadcn-style, Radix UI и Lucide стек.
- Используй существующие CSS variables, theme tokens и utilities из `app/globals.css`; не создавай параллельную design system.
- Сохраняй визуальные и interaction patterns соседних экранов, включая responsive behavior, focus states, errors, empty states и disabled states.

## Ownership

- Shared UI должен оставаться domain-neutral. Компонент с правилами CRM, student, teacher, billing, payments или learning принадлежит соответствующему feature/domain.
- Route-level client component может оркестрировать экран, но reusable sections и domain hooks должны жить рядом с feature.
- Не смешивай rendering, persistence, сложные business decisions и data loading в одном shared component.

## Responsive design

- Соблюдай единый [responsive system](../../docs/responsive-system.md): base для mobile, `md:` для tablet, `desktop:` для full desktop с 1100px и `xl:` для дополнительного пространства или явно закреплённого 1280px component contract.
- Для новых компонентов не считай `lg:` основным desktop breakpoint, не добавляй device-specific breakpoint names и избегай случайных `min-[...]`/`max-[...]`.
- Все новые и изменяемые UI-экраны должны корректно работать на desktop, tablet и mobile.
- Не используй фиксированные ширины, которые вызывают горизонтальный overflow или делают экран непригодным на малых viewport; предпочитай fluid sizing, `max-width`, responsive grid/flex и существующие breakpoints.
- Проверяй mobile, tablet и desktop breakpoints для изменяемого экрана, включая content overflow, touch targets, typography, spacing и порядок элементов.
- Адаптируй таблицы, фильтры, формы, модалки, навигацию и dashboard-секции для малых экранов: используй stacking, wrapping, horizontal scroll, drawers/sheets или компактные представления там, где это соответствует существующим patterns.
- Не скрывай критичные действия или данные на малых экранах без доступной альтернативы.

## Loading и data access

- Соблюдай текущий [workspace loading/skeleton contract](../../docs/workspace-loading-skeleton-contract.md).
- Route skeleton должен соответствовать layout экрана; user-triggered loads должны иметь локальный loading/error state.
- Не обращайся к Supabase, Storage или raw DB напрямую из client UI. Используй существующие same-origin API/service boundaries.
