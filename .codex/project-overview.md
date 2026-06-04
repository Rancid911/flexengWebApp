# Краткая карта проекта

## Продукт

`English School` обслуживает публичный сайт онлайн-школы и рабочее пространство для обучения и операционной работы.

Основные роли:

- `student` — собственное расписание, задания, практика, прогресс, слова и оплаты;
- `teacher` — назначенные ученики, расписание, заметки, homework и lesson follow-up;
- `manager` и `admin` — staff-функции, пользователи, CRM, контент, расписание, billing и payments.

Роль задаёт бизнес-контекст, но protected authorization определяется DB-backed permissions и scopes. Текущую модель смотри в [access-control current state](../docs/access-control-current-state.md).

## Стек

- Next.js 16 App Router, React 19, TypeScript.
- Tailwind CSS 4, локальные shadcn-style primitives, Radix UI, Lucide.
- Supabase Auth/Postgres/Storage через `@supabase/ssr` и `@supabase/supabase-js`.
- Zod для validation.
- Vitest и Testing Library для unit/component/route tests.
- Playwright для smoke/e2e.

Точные версии и npm scripts определяются [package.json](../package.json). Запуск и environment setup описаны в [README.md](../README.md).

## Основные слои

- `app/` — routing-only: pages, layouts, route handlers, loading/error boundaries.
- `features/` — доменные UI/client/server модули и route composition.
- `shared/` — только cross-domain primitives, types и constants.
- `components/ui/` — существующие базовые UI primitives.
- `lib/` — auth, permissions, Supabase infrastructure, domain services, queries, repositories и DTO mapping.
- `supabase/` — migrations и SQL verification/support scripts.
- `tests/` — unit, smoke и e2e tests.

Детальные правила: [docs/architecture.md](../docs/architecture.md). Карта владения доменами: [docs/domain-map.md](../docs/domain-map.md).

## Основные домены

- Access/auth и workspace shell.
- Students, teachers и teacher workspace.
- Schedule, lessons и follow-up.
- Homework, practice/tests, progress и words/flashcards.
- Payments, YooKassa и billing ledger.
- CRM, admin, notifications, search, settings, blog/public website.

Начинай поиск документации с [docs/README.md](../docs/README.md). Для high-risk изменений обязательно прочитай соответствующие current-документы: [payments/billing](../docs/features/payments-billing.md), [schedule](../docs/features/schedule.md), [students/teachers](../docs/features/students-teachers.md) и [access-control index](../docs/access-control/README.md).

## Важные инварианты

- `profiles.role` — compatibility/display/default metadata, не authorization.
- Protected authorization использует `AppActor`, permissions/scopes и fail-closed поведение.
- `app` остаётся routing-only; UI не обращается к Supabase напрямую.
- RLS/RPC — финальная database boundary; static migrations не доказывают состояние live DB.
- Cross-domain dashboard/search loaders остаются read-only aggregators и не владеют mutations.
