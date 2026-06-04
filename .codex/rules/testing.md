# Практические правила тестирования

Текущая стратегия и команды: [docs/testing/test-strategy.md](../../docs/testing/test-strategy.md), [tests/README.md](../../tests/README.md), [smoke runbook](../../docs/operations/smoke-tests.md).

## Общий подход

- Выбирай проверки по risk level, blast radius и фактически затронутому поведению.
- Запускай минимальный достаточный набор проверок, начиная с relevant focused tests.
- Не запускай full unit suite, Playwright/e2e, smoke tests или `npm run build` автоматически для каждой задачи.
- Не удаляй и не ослабляй тесты, guards или assertions ради прохождения suite.
- Расширяй набор проверок только когда focused checks не покрывают риск изменения.

## Risk levels

### Low risk

Copy, documentation, локальные стили и изолированные UI-изменения без изменения contracts, access boundaries или shared behavior:

- Запусти relevant focused test, если он существует и полезен.
- Запусти `npm run lint`, только если изменены TS/TSX/JS/JSX файлы.
- Для docs-only изменений проверь локальные Markdown-ссылки и relevant docs consistency test, если он существует.
- Не запускай `npm run build`, full unit suite, Playwright/e2e или smoke по умолчанию.

### Medium risk

Изменения локальной business logic, components, route handlers или domain behavior с ограниченным blast radius:

- Запусти focused unit/component/route tests изменённого поведения.
- Запусти `npm run lint`.
- Запусти `npm run check:architecture`, только если затронуты architecture boundaries, imports, routes, services/repositories или access boundaries.
- Не запускай full suite, build или E2E без дополнительного основания.

### High risk

Изменения shared infrastructure, security/access boundaries, production-critical flows или поведения с широким blast radius:

- Запусти focused tests, `npm run lint`, `npm run check:architecture` и `npm run build`.
- Запусти SQL smoke или E2E только если изменение реально затрагивает live DB, auth, RLS/RPC или пользовательский flow и доступен подходящий environment/credentials.
- Не считай mocked tests доказательством корректности live RLS/RPC/Storage.

## Условия расширенных проверок

Запускай `npm run build` только для:

- high-risk runtime изменений;
- изменений auth, session handling или request context;
- RBAC, RLS, RPC, Supabase, database schema или migrations;
- API contracts или routing;
- production-critical flows;
- dependency или config changes;
- явного запроса пользователя.

Запускай full unit suite (`npm run test:unit`) только если затронута shared infrastructure, есть риск широкого regression, focused tests недостаточны или пользователь явно запросил полный прогон.

Запускай Playwright/e2e и smoke tests только если изменение затрагивает пользовательский flow, доступны нужные credentials/environment, пользователь явно запросил проверку либо выполняется release/pre-deploy verification.

## Documentation-only

Для изменения только документации:

1. Проверь существование внутренних Markdown-ссылок.
2. Запусти relevant docs consistency test, если изменение затрагивает проверяемую им документацию.
3. Не запускай lint, architecture check, build, full unit suite или E2E без конкретного риска либо явного запроса.
4. Убедись через `git diff --name-only`, что runtime-код не изменён в рамках задачи.

## Live database

- Unit tests и mocks проверяют application behavior, но не доказывают корректность активных RLS policies, RPC grants или Storage metadata.
- SQL smoke из `supabase/sql-editor/` запускай только в подходящем environment согласно runbook.
- Production-safe metadata smoke не равен полной row-level matrix.
- Не заявляй live DB verification без записи target environment и результата выполненного smoke.

## Финальный отчёт

- Перечисли запущенные проверки и объясни, почему выбран именно этот набор.
- Перечисли существенные проверки, которые не запускались, и объясни почему.
- Если проверка упала из-за существующей проблемы или отсутствующих credentials/environment, сообщи это явно.
