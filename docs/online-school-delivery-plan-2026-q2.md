# Delivery Plan: online-school platform evolution

## Summary

Этот документ переводит продуктовый аудит в инженерный план реализации на ближайшие 3 спринта.

Базовый принцип:

- не распыляться на новые student-only виджеты;
- сначала закрыть teacher workflow и academic lifecycle;
- потом развить retention и manager operations;
- затем расширять authoring, аналитику и speaking/listening контур.

План рассчитан на текущую архитектуру проекта:

- Next.js App Router;
- Supabase Auth + Postgres;
- role-based dashboard shell;
- server-side queries в `lib/*`;
- API routes в `app/api/*`.

## Target outcome

После выполнения плана платформа должна поддерживать полный operational cycle:

1. staff планирует урок;
2. teacher проводит урок и фиксирует результат;
3. teacher назначает homework;
4. student получает homework, feedback и следующий шаг;
5. manager/admin видит риски, оплату и состояние обучения;
6. schedule, homework, progress и payments становятся связанными частями одного lifecycle.

## Sprint 1 — Teacher workspace + post-lesson workflow

### Goal

Превратить teacher role из “просмотра и базового расписания” в полноценный рабочий кабинет преподавателя.

### Schema / data

Добавить новые сущности:

- `lesson_attendance`
  - `id`
  - `schedule_lesson_id`
  - `student_id`
  - `teacher_id`
  - `status` (`scheduled`, `completed`, `missed_by_student`, `missed_by_teacher`, `canceled`)
  - `marked_by_profile_id`
  - `marked_at`
  - timestamps
- `lesson_outcomes`
  - `id`
  - `schedule_lesson_id`
  - `student_id`
  - `teacher_id`
  - `summary`
  - `covered_topics`
  - `mistakes_summary`
  - `next_steps`
  - `visible_to_student`
  - `created_by_profile_id`
  - `updated_by_profile_id`
  - timestamps
- `teacher_student_notes`
  - `id`
  - `student_id`
  - `teacher_id`
  - `body`
  - `visibility` (`private`, `manager_visible`)
  - timestamps

Индексы:

- `lesson_attendance(schedule_lesson_id)`
- `lesson_attendance(student_id, marked_at desc)`
- `lesson_outcomes(schedule_lesson_id)`
- `teacher_student_notes(student_id, teacher_id, created_at desc)`

RLS / доступ:

- teacher только по своим ученикам через `student_course_enrollments.assigned_teacher_id`;
- manager/admin имеют глобальный доступ;
- student читает только outcome, где `visible_to_student = true`, и только по своим урокам;
- private notes student не видит.

### Server / API

Добавить домен `lib/teacher-workspace/*` или расширить `lib/schedule/*` и `lib/homework/*`:

- query для teacher dashboard:
  - уроки на сегодня;
  - уроки на неделю;
  - список учеников teacher scope;
  - ближайшие homework, требующие внимания;
  - уроки без отмеченного результата.
- query для student profile в teacher view:
  - student summary;
  - active enrollments;
  - recent mistakes;
  - recent homework;
  - recent lessons.

Добавить API:

- `POST /api/schedule/[id]/attendance`
- `POST /api/schedule/[id]/outcome`
- `PATCH /api/schedule/[id]/outcome`
- `POST /api/students/[id]/teacher-notes`
- `PATCH /api/teacher-notes/[id]`

Validation:

- teacher не может писать outcome/note вне своего scope;
- outcome нельзя создавать для урока другого teacher;
- `completed` attendance должен требовать teacher actor;
- student не может мутировать эти маршруты.

### UI

Сделать teacher dashboard вместо текущего placeholder:

- блок `Сегодня`;
- блок `Эта неделя`;
- блок `Мои ученики`;
- блок `Требует внимания`.

Добавить staff student profile page:

- шапка с уровнем, целью, курсом;
- последние уроки;
- последние homework;
- ошибки;
- notes преподавателя.

Добавить post-lesson drawer / modal из карточки урока:

- attendance status;
- summary;
- covered topics;
- repeated mistakes;
- next steps;
- опция показать summary ученику.

### Homework integration

На этом спринте не строить полный конструктор homework, а сделать v1:

- teacher может назначить homework из существующих сущностей:
  - lesson activity;
  - test;
  - word review set;
- assignment привязывается к конкретному `schedule_lesson_id`.

### Tests

- unit:
  - teacher scope enforcement;
  - outcome visibility rules;
  - attendance transition validation.
- API:
  - teacher может создать outcome только для своих уроков;
  - student не может писать attendance/outcome/note.
- UI:
  - teacher dashboard показывает только teacher scope;
  - post-lesson modal сохраняет outcome;
  - student видит visible outcome в своём контуре.

### Acceptance criteria

- teacher после урока может отметить его результат;
- teacher может оставить заметку по ученику;
- teacher видит только своих учеников;
- student получает feedback по уроку и homework, если teacher это опубликовал.

## Sprint 2 — Schedule lifecycle + manager operations + retention

### Goal

Сделать расписание и операционный контур пригодными для реальной школы, а не только для ручного создания отдельных уроков.

### Schema / data

Добавить:

- расширение `student_schedule_lessons`
  - `series_id` для recurring lessons
  - `source_lesson_id` для reschedule/replacement chain
  - `confirmation_status`
  - `canceled_by_profile_id`
  - `canceled_reason`
- `student_risk_signals`
  - `id`
  - `student_id`
  - `signal_type`
  - `severity`
  - `payload`
  - `is_active`
  - timestamps
- `package_balances` или `lesson_quotas`
  - `student_id`
  - `plan_id`
  - `lessons_total`
  - `lessons_used`
  - `lessons_remaining`
  - `expires_at`
  - `status`

Добавить фоновую модель для reminders:

- `scheduled_notifications` либо equivalent queue table, если нужен DB-backed scheduling.

### Server / API

Расширить schedule API:

- recurring create;
- single-instance reschedule;
- cancel with reason;
- mark missed by student / teacher;
- lesson history read;
- weekly calendar query.

Добавить manager/admin operations:

- enrollment assignment / reassignment teacher;
- pause/freeze enrollment;
- view package balance;
- renew / extend package state.

Добавить risk signal service:

- нет логина X дней;
- есть future lessons, но низкая активность;
- homework overdue;
- низкая completion rate;
- payment/package expiring soon.

### UI

На `/schedule` для staff:

- agenda + weekly calendar toggle;
- recurring lesson create flow;
- reschedule and replacement flow;
- history mode;
- attendance statuses в карточках уроков.

Для manager/admin:

- enrollments console;
- teacher reassignment;
- package / quota status;
- risk list по студентам.

Для student:

- reminders в notifications;
- lesson history при необходимости отдельной вкладкой, но только после future schedule stabilisation.

### Payments / retention integration

Связать payment lifecycle и обучение:

- если lessons/package заканчиваются, показывать CTA на оплату;
- если оплата просрочена или пакет истёк, manager получает signal;
- student видит понятный статус, а не только список транзакций.

### Tests

- recurring lesson generation;
- reschedule chain integrity;
- attendance + cancellation state transitions;
- risk signal generation from activity/payment data;
- manager can reassign teacher;
- student cannot access чужую историю.

### Acceptance criteria

- staff может вести и актуализировать расписание не вручную по одному уроку;
- manager видит риски и состояние пакета;
- student заранее получает reminders;
- status урока и status оплаты не конфликтуют между собой.

## Sprint 3 — Adaptive learning + authoring + analytics

### Goal

Усилить академическую ценность платформы и дать школе инструменты роста качества обучения.

### Schema / data

Добавить:

- `student_goals`
- `learning_milestones`
- `content_tags`
  - `cefr_level`
  - `skill`
  - `goal`
  - `difficulty`
- `speaking_submissions`
- `speaking_feedback`

### Server / domain

Построить recommendation layer v2:

- рекомендации по паттернам ошибок;
- weekly plan generation;
- “before next lesson” suggestions;
- milestone progression tracking.

Добавить authoring support:

- reusable homework builder;
- content-to-goal mapping;
- assignment templates.

Добавить speaking/listening flow:

- upload / store spoken submission;
- teacher feedback;
- student history.

### UI

Для student:

- weekly learning plan;
- progress against goals;
- recommendations by skill;
- speaking practice history.

Для teacher:

- content picker with tags;
- homework templates;
- student goal progress;
- speaking feedback workspace.

Для manager/admin:

- richer analytics:
  - retention by cohort;
  - homework completion;
  - teacher load;
  - student risk distribution;
  - conversion from payment to active learning.

### Tests

- recommendation relevance based on mistakes;
- milestone transitions;
- content tagging filters;
- speaking submission/feedback permissions;
- analytics aggregates against seeded data.

### Acceptance criteria

- student получает понятный персональный учебный план;
- teacher может не только вести урок, но и направлять learning path;
- manager/admin получают operational и academic visibility.

## Cross-cutting engineering rules

### Authorization

- Все новые teacher/staff маршруты опирать на server-side scope checks.
- UI disabled/read-only допустим только как UX-слой, не как security boundary.
- Источник teacher-to-student связи: `student_course_enrollments.assigned_teacher_id`.

### Data design

- Все timestamps хранить в UTC.
- Историю не удалять hard delete, если это связано с академическим следом.
- Для уроков, attendance и outcomes использовать audit-friendly model с `created_by` / `updated_by` / `marked_by`.

### UI conventions

- Student view: простые CTA, минимум operational noise.
- Teacher view: dense workspace, быстрые действия, минимум лишней навигации.
- Manager/admin view: filters, tables, risks, states, bulk actions.

### Rollout order

- сначала schema + server access;
- затем API;
- затем UI;
- затем reminders/background jobs;
- затем analytics.

## Delivery checklist by subsystem

### Database

- migrations
- indexes
- RLS policies
- seed updates

### Backend

- queries
- DTOs
- validation
- API routes
- background jobs / notification scheduling

### Frontend

- teacher dashboard
- student profile for teacher
- post-lesson modal
- recurring schedule UI
- manager operations UI
- adaptive learning UI

### QA

- unit tests
- API tests
- permission tests
- role-based UI tests
- seeded smoke flows for student / teacher / manager / admin

## Suggested implementation order inside the repo

1. `supabase/migrations/*` for attendance, outcomes, notes
2. `lib/*` domain queries and validation
3. `app/api/*` routes
4. `app/(dashboard)/dashboard/*` teacher dashboard
5. `app/(dashboard)/schedule/*` schedule lifecycle expansion
6. `app/(dashboard)/homework/*` teacher assignment flows
7. `lib/payments/*` and manager-facing lifecycle joins
8. analytics and recommendation improvements

## Risks / dependencies

- Teacher dashboard нельзя строить только на client-side fetch: role scope должен приходить с сервера.
- Homework constructor лучше строить поверх существующих practice/test entities, а не изобретать параллельный content graph.
- Recurring lessons и reminders надо проектировать вместе, иначе напоминания быстро станут inconsistent.
- Package balance / lesson quota стоит связать с payment plans, но не смешивать напрямую с transaction log.

## Definition of done

Этап считается завершённым, когда:

- функциональность доступна нужной роли;
- сервер не допускает cross-scope access;
- student lifecycle не распадается между schedule, homework, progress и payments;
- есть automated coverage для permission-sensitive сценариев;
- есть seeded demo data для smoke-проверок по всем ролям.
