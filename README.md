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
   - `SUPABASE_SERVICE_ROLE_KEY` (нужен для server-side admin CRUD в `/admin`)

## Стек

- Next.js (App Router)
- Tailwind CSS
- shadcn/ui (локальные компоненты)
- Lucide Icons
- Supabase Auth (`@supabase/supabase-js`, `@supabase/ssr`)

## Структура

- `app/page.tsx` — основной экран дашборда (защищён сессией)
- `app/login/page.tsx` — вход по email и паролю
- `app/register/page.tsx` — регистрация по email и паролю
- `app/forgot-password/page.tsx` — запрос ссылки восстановления
- `app/reset-password/page.tsx` — установка нового пароля
- `app/auth/confirm/route.ts` — подтверждение токена из email-ссылки
- `components/ui/*` — базовые UI-компоненты в стиле shadcn
- `app/globals.css` — токены темы из `.pen`

## Product docs

- `docs/online-school-product-audit-2026-03.md` — аудит текущего функционала онлайн-школы и roadmap дальнейшего развития
- `docs/online-school-delivery-plan-2026-q2.md` — инженерный delivery-plan по спринтам: schema, API, UI, роли и тестирование

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
npm run build
npx tsc --noEmit
```
