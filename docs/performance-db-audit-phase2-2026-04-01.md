# Performance DB Audit: Phase 2

## Goal
Подтвердить, где именно остаётся latency после phase 2:
- в базе;
- в loader orchestration;
- во внешних API;
- в request-context / scope resolution.

## Current App-Level Timing Snapshot
Источник: `.next/dev/logs/next-development.log`

Наблюдения по уже снятым логам:

| label | observed range | note |
| --- | --- | --- |
| `request-context` | `1005ms` -> `8531ms` | самый нестабильный и дорогой участок |
| `schedule-list` | `307ms` -> `4873ms` | DB path явно нестабилен |
| `schedule-filter-students` | `673ms` -> `4822ms` | candidate на lookup/index/RLS cost |
| `schedule-filter-teachers` | `624ms` -> `4821ms` | candidate на lookup/index/RLS cost |
| `schedule-page-data` | `677ms` -> `4874ms` | итоговая latency собирается из lookup/list |
| `schedule-enrichment` | `0.1ms` -> `0.17ms` | не текущий bottleneck на этих прогонах |

Предварительный вывод:
- основной remaining hotspot сейчас выглядит как `request-context` и staff schedule lookup/list path;
- schedule enrichment на этих прогонах не выглядит проблемой;
- без `EXPLAIN ANALYZE` ещё нельзя сказать, это index miss, RLS-heavy path или просто cold/stressed environment.
- preferred optimization path for `request-context` is now: `auth -> profile -> get_linked_actor_scope(...) RPC`, with app-level chained resolution retained only as fallback.

## Index Verification
После применения `supabase/sql-editor/performance_phase2_indexes_20260401.sql` вставить сюда результат:

```sql
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'students_profile_id_idx',
    'teachers_profile_id_idx',
    'student_course_enrollments_teacher_status_student_idx',
    'student_schedule_lessons_student_status_starts_idx'
  )
order by tablename, indexname;
```

### Result
```
PASTE RESULT HERE
```

## EXPLAIN ANALYZE Results

### 1. Student Dashboard Preview
Query source:
- `getStudentSchedulePreviewByStudentId()`

Expected index:
- `student_schedule_lessons_student_status_starts_idx`

Summary:
- total execution time:
- scan type:
- index used:
- rows estimate vs actual:
- sort/hash/materialize:
- conclusion:

Plan:
```sql
PASTE FULL PLAN HERE
```

### 2. Staff Schedule Base Query
Query source:
- `listScheduleLessonRows()` for staff/teacher path

Expected index:
- `student_schedule_lessons_student_status_starts_idx`
- existing teacher/student schedule indexes if planner prefers them

Summary:
- total execution time:
- scan type:
- index used:
- rows estimate vs actual:
- sort/hash/materialize:
- conclusion:

Plan:
```sql
PASTE FULL PLAN HERE
```

### 3. Teacher-Scope Join Path
Query source:
- request-context teacher scope
- schedule/RLS-style student access path

Expected index:
- `student_course_enrollments_teacher_status_student_idx`

Summary:
- total execution time:
- scan type:
- index used:
- rows estimate vs actual:
- nested loop/hash join behavior:
- conclusion:

Plan:
```sql
PASTE FULL PLAN HERE
```

### 4. Practice Topic/Subtopic Path
Query source:
- `getPracticeTopicDetail()`
- `getPracticeSubtopicDetail()`

Expected focus:
- progress scan cost
- module/lesson/test lookup cost

Summary:
- total execution time:
- scan type:
- index used:
- rows estimate vs actual:
- repeated query risk:
- conclusion:

Plan:
```sql
PASTE FULL PLAN HERE
```

### 5. Student Payments DB Path
Query source:
- `getStudentPaymentsPageData()`
- DB only, without YooKassa network sync

Expected focus:
- `payment_transactions`
- `student_billing_accounts`
- `student_billing_ledger`

Summary:
- total execution time:
- scan type:
- index used:
- rows estimate vs actual:
- DB vs external API conclusion:
- conclusion:

Plan:
```sql
PASTE FULL PLAN HERE
```

## Decision Matrix

| Path | DB fast? | Index used? | Main issue | Next action |
| --- | --- | --- | --- | --- |
| request-context |  |  |  |  |
| student dashboard preview |  |  |  |  |
| staff schedule |  |  |  |  |
| practice topic/subtopic |  |  |  |  |
| payments DB path |  |  |  |  |

## Interpretation Rules
- Если preview/list queries быстрые и индексные: следующий шаг в loader consolidation, не в БД.
- Если teacher-scope join даёт `Seq Scan` или дорогой `Nested Loop`: следующий шаг в DB/RLS-focused phase 3.
- Если payments DB path быстрый: следующий шаг в выносе YooKassa sync из SSR.
- Если `request-context` остаётся медленным при быстрых DB-планах даже после RPC path: следующий шаг в `EXPLAIN ANALYZE` для `get_linked_actor_scope(...)` и точечной оптимизации join path `student_course_enrollments`.
