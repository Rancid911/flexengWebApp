# Практические правила Supabase, RBAC и RLS

Перед изменениями читай [access-control current state](../../docs/access-control-current-state.md), [access-control index](../../docs/access-control/README.md), [service-role inventory](../../docs/service-role-inventory.md) и [RLS smoke harness](../../docs/rls-smoke-harness.md).

## Authorization

- DB-backed RBAC metadata — единственный источник protected authorization.
- Используй `AppActor`, canonical permissions, scopes и существующие page/API guards.
- Пустой или ошибочный RBAC должен fail closed.
- `profiles.role`/`profileRole` разрешены только как compatibility, display, form-default и diagnostic metadata. Они не должны выдавать доступ.
- Navigation visibility не является security boundary; защищай direct URL, API и database access.

## Data access

- По умолчанию используй user-scoped server Supabase client и RLS либо narrow actor-scoped RPC.
- UI и client components не должны обращаться к Supabase напрямую.
- API routes и server pages не должны содержать raw DB access; передавай работу domain query/service/repository.
- Никогда не доверяй caller-supplied role, capability или scope для privileged visibility.

## Service role

- `createAdminClient()` допустим только в текущем inventory/architecture allowlist.
- Новый service-role call site требует отдельного security/RLS плана, документации, allowlist update и тестов guard-before-side-effect.
- Service role нельзя использовать для обхода отсутствующей policy, permission или app guard.
- Не раскрывай service-role secret в browser/client environment.

## RLS, RPC и verification

- RLS/RPC/Storage policies — финальная database security boundary, а app guards — defense in depth.
- Security-definer RPC должны иметь узкую задачу, безопасный `search_path`, намеренные grants и внутреннюю проверку actor visibility.
- Static migration review, architecture check и mocked unit tests не доказывают состояние live DB.
- Не заявляй live RLS/RPC/Storage verification без фактически выполненного и записанного SQL smoke на целевой environment.
