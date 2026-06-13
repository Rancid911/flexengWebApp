# Практические правила архитектуры

Подробные источники истины: [docs/architecture.md](../../docs/architecture.md), [ARCHITECTURE.md](../../ARCHITECTURE.md), [domain map](../../docs/domain-map.md). Автоматические границы проверяет [scripts/check-architecture.mjs](../../scripts/check-architecture.mjs).

## Размещение кода

- Держи `app/` routing-only. В нём допустимы route convention files, thin pages/layouts и transport route handlers.
- Новую доменную реализацию помещай в `features/<domain>` или существующий `lib/<domain>`.
- Cross-domain primitives помещай в `shared/` только если они действительно не принадлежат домену.
- Не делай массовые переносы существующих `lib/<domain>` модулей; мигрируй границы только в рамках конкретной задачи.

## Runtime path

- Предпочитай путь `route/api -> auth/validation -> service/query -> repository -> mapper/DTO`.
- API route должен только разобрать input, авторизовать actor/scope, валидировать данные, вызвать domain service/query и вернуть response.
- Не размещай raw `.from()`, `.rpc()`, `createAdminClient()` или multi-table workflow в API route.
- Repository отвечает за persistence и raw rows; service — за бизнес-операцию и orchestration; mapper — за DTO conversion.
- Cross-domain dashboard/search modules могут агрегировать reads, но не должны владеть mutations других доменов.

## Изменения

- Сохраняй публичные URL и API contracts, если отдельная migration task не требует обратного.
- Применяй существующие naming и ownership patterns; не создавай generic utilities без конкретной необходимости.
- Для protected API используй permission-aware guards. Public/provider/internal exceptions должны оставаться явными.
- После архитектурных изменений запускай `npm run check:architecture` и проверки из [testing rules](testing.md).
