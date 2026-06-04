# Обязательные ограничения

Эти красные линии действуют по умолчанию. Менять их можно только по явному запросу пользователя с отдельным анализом рисков, миграции и проверки.

## Не менять без явного запроса

- Auth flows, session handling, request context и формирование `AppActor`.
- DB-backed RBAC/RLS/RPC semantics, permission scopes и fail-closed поведение.
- `lib/permissions/registry.ts`, permission aliases и service-role inventory/allowlist.
- Database schema, migrations, grants, policies, functions, RPC и Storage posture.
- Публичные URL, route groups с влиянием на URL, API endpoints, request/response contracts и status/error semantics.
- Runtime-поведение, бизнес-правила и существующие domain ownership boundaries.

## High-risk бизнес-правила

- Не менять payment lifecycle, YooKassa checkout/status/webhook, provider idempotency или privileged provider-state writes без отдельной задачи.
- Не менять billing ledger, lesson charges, adjustments, balances или reminder lifecycle без отдельной задачи.
- Не менять правила создания, обновления, отмены и завершения уроков, scope расписания или lesson follow-up без отдельной задачи.
- Teacher preview/demo не должен создавать или изменять реальные student-owned records.
- Student-owned writes должны сохранять real-student identity, permission/scope guards и database boundaries.

Перед high-risk изменениями читай [payments/billing](../docs/features/payments-billing.md), [schedule](../docs/features/schedule.md), [students/teachers](../docs/features/students-teachers.md) и [access-control docs](../docs/access-control/README.md).

## Запрещённые обходы

- Не выдавай protected access через `profiles.role`, UI visibility или client-supplied role/scope.
- Не добавляй service-role usage для обхода отсутствующих RLS policies, guards или permissions.
- Не ослабляй RLS, RPC grants, tests, architecture checker или service-role allowlist ради прохождения проверки.
- Не добавляй прямой Supabase/raw DB access в client UI, API routes или server pages.
- Не заменяй Tailwind/shadcn/Radix/Lucide UI stack и не вводи параллельную design system без явного запроса.
- Не делай массовые архитектурные переносы, переименования и unrelated refactors.

## Совместимость и scope

- Сохраняй обратную совместимость и минимальный diff.
- Не меняй код, конфигурацию, тесты или документацию вне scope задачи.
- Если задача требует нарушения красной линии, сначала явно зафиксируй необходимость, риски, migration/rollback plan и требуемую verification.
