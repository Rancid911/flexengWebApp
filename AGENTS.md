# Инструкции для Codex

## Проект

`English School` — веб-приложение онлайн-школы с публичным сайтом и рабочими кабинетами `student`, `teacher`, `manager` и `admin`. Приложение построено на Next.js App Router, React, TypeScript, Tailwind CSS и Supabase.

Фактический git-корень приложения — текущая директория `dashboard-next-next16`. Все команды, проверки и изменения выполняй из неё.

## Обязательный порядок чтения

Перед любыми изменениями:

1. Прочитай [краткую карту проекта](.codex/project-overview.md).
2. Прочитай [обязательные ограничения](.codex/requirements.md).
3. Выбери относящиеся к задаче практические правила:
   - [архитектура](.codex/rules/architecture.md);
   - [Supabase, RBAC и RLS](.codex/rules/supabase.md);
   - [UI](.codex/rules/ui.md);
   - [тестирование](.codex/rules/testing.md);
   - [git](.codex/rules/git.md).
4. Открой актуальные документы по изменяемому домену через [центральный индекс документации](docs/README.md).
5. Перед реализацией проверь текущий код, тесты и git status. Документация описывает намерения, но код и проверки остаются важными источниками фактического поведения.

## Обязательные правила

- Соблюдай [красные линии проекта](.codex/requirements.md). Не расширяй scope задачи без явного запроса.
- Сохраняй публичные URL, API contracts, authorization boundaries и runtime-поведение, если задача явно не требует обратного.
- Для protected access используй DB-backed RBAC, `AppActor`, permissions/scopes и RLS/RPC defense in depth.
- Не используй `profiles.role` как источник authorization.
- Не добавляй прямой доступ к Supabase из client UI или API route handlers.
- Не ослабляй тесты, architecture checks, RLS policies или service-role ограничения ради прохождения проверки.
- Обновляй документацию вместе с изменением route, API contract, permission, data model или operating procedure.

## Текущие источники истины

- Архитектура: [ARCHITECTURE.md](ARCHITECTURE.md), [docs/architecture.md](docs/architecture.md), [docs/domain-map.md](docs/domain-map.md).
- Access control: [docs/access-control-current-state.md](docs/access-control-current-state.md), [docs/access-control/README.md](docs/access-control/README.md).
- Service role и RLS verification: [docs/service-role-inventory.md](docs/service-role-inventory.md), [docs/rls-smoke-harness.md](docs/rls-smoke-harness.md).
- Loading/skeleton contract: [docs/workspace-loading-skeleton-contract.md](docs/workspace-loading-skeleton-contract.md).
- High-risk domains: [payments/billing](docs/features/payments-billing.md), [schedule](docs/features/schedule.md), [students/teachers](docs/features/students-teachers.md).
- Проверки: [docs/testing/test-strategy.md](docs/testing/test-strategy.md), [docs/operations/smoke-tests.md](docs/operations/smoke-tests.md).

Документы со статусом `historical`, `stub`, `deprecated`, `stale` или `needs review` нельзя считать текущей runtime-истиной. Используй их только как контекст и сверяй выводы с current-документами, кодом и тестами.
