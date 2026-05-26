# English School Dashboard (Next.js + shadcn/ui + Tailwind + Supabase Auth)

Проект сгенерирован на основе `Dasnboard.pen` и использует Supabase для email/password авторизации.

## Запуск

```bash
npm install
npm run dev
```

Откройте `http://localhost:3000`.

## GitHub workflow

Рабочий git-репозиторий проекта находится в директории `dashboard-next-next16`.
Внешняя директория `dashboard-next` содержит отдельный `.git`, но не должна использоваться для commit/push этого приложения.

Используйте один из двух вариантов:

```bash
cd /Users/anton/Desktop/Флексенг/6.\ Инфра-ра/Pencil/dashboard-next/dashboard-next-next16
git status
git push origin main
```

или запускайте команды явно через `-C`:

```bash
git -C /Users/anton/Desktop/Флексенг/6.\ Инфра-ра/Pencil/dashboard-next/dashboard-next-next16 status
git -C /Users/anton/Desktop/Флексенг/6.\ Инфра-ра/Pencil/dashboard-next/dashboard-next-next16 push origin main
```

Проверка remote без отправки изменений:

```bash
git -C /Users/anton/Desktop/Флексенг/6.\ Инфра-ра/Pencil/dashboard-next/dashboard-next-next16 push --dry-run origin main
```

## Настройка Supabase

1. Создайте проект в Supabase и включите Email/Password провайдер в Authentication.
2. Скопируйте `.env.example` в `.env.local`.
3. Заполните:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (нужен только для документированных privileged server boundaries из service-role inventory)

## Стек

- Next.js (App Router)
- Tailwind CSS
- shadcn/ui (локальные компоненты)
- Lucide Icons
- Supabase Auth/Postgres (`@supabase/supabase-js`, `@supabase/ssr`)

## Структура

- `app/(public)` — публичные route pages, layout и metadata
- `app/(auth)` — auth route pages, loading/error boundaries
- `app/(workspace)` — workspace route groups и тонкие route entrypoints
- `app/api` — API route handlers как transport boundary
- `app/auth/confirm/route.ts` — подтверждение токена из email-ссылки
- `features/*` — доменные UI/client/server модули
- `shared/*` — cross-domain primitives, shared UI and client helpers
- `lib/*` — auth, permissions, Supabase infrastructure, services, queries, repositories and DTO mapping
- `components/ui/*` — базовые UI-компоненты в стиле shadcn
- `app/globals.css` — токены темы из `.pen`

## Architecture baseline

- `app` остаётся routing-only: новые feature/client/server implementation files идут в `features/*`, `shared/*` или `lib/*`.
- Protected API routes должны вызывать `requirePermission()`; public/provider/internal exceptions явно перечислены в `scripts/check-architecture.mjs`.
- UI не обращается к Supabase напрямую; auth, storage and persistence flows go through same-origin API/server boundaries.
- Browser Supabase clients are blocked by `npm run check:architecture`.
- Актуальные правила описаны в `ARCHITECTURE.md`, `docs/README.md` и `docs/architecture.md`.

## Product docs

- `docs/decisions/historical/online-school-product-audit-2026-03.md` — historical audit and roadmap context, not current runtime truth
- `docs/decisions/historical/online-school-delivery-plan-2026-q2.md` — historical engineering delivery plan, not current runtime truth

## Next 16 migration status

- Статус: завершено
- Целевая версия: `next@16.2.0`
- React: `react@19.2.x`, `react-dom@19.2.x`
- Proxy-конвенция: `middleware.ts` заменён на `proxy.ts`
- Lint: ESLint CLI (`eslint . --max-warnings=0`) через `eslint.config.mjs`
- Turbopack build: подтверждён успешным `npm run build`

Команды верификации:

```bash
npm run lint
npm run check:architecture
npx tsc --noEmit
npm run build
npm run test:unit
```
