# Screen Data Map By Role

Дата аудита: 2026-04-10

Этот документ описывает, какие данные нужны для показа экранов кабинета, откуда они берутся, через какие loader'ы проходят и какие таблицы/RPC используются.

## Общий foundation для всех экранов кабинета

Почти любой экран внутри `app/(workspace)` сначала проходит через request-context.

- Entry points:
  - [request-context.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/lib/auth/request-context.ts)
  - [workspace-shell.server.tsx](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/(workspace)/workspace-shell.server.tsx)
- Что грузится:
  - `supabase.auth.getUser()` через SSR client
  - профиль пользователя из `profiles`
  - связанный actor scope через RPC `get_linked_actor_scope`
  - fallback chain:
    - `students`
    - `teachers`
    - `student_course_enrollments` для teacher student-scope
- Что это даёт экрану:
  - `userId`
  - `email`
  - `profileRole`
  - `displayName`
  - `avatarUrl`
  - `studentId`
  - `teacherId`
  - `accessibleStudentIds`

## Student

### `/dashboard`

- Route:
  - [student-dashboard-route.tsx](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/(workspace)/_components/student-dashboard-route.tsx)
  - [student-dashboard.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/lib/dashboard/student-dashboard.ts)
- Initial block:
  - `student_lesson_progress`
    - поля: `status`, `progress_percent`, `updated_at`, `lesson_id`
    - relation: `lessons(title, duration_minutes, module_id)`
  - `student_test_attempts`
    - поля: `status`, `score`, `created_at`, `submitted_at`
  - `student_course_enrollments`
    - поля: `status`
    - relation: `courses(title)`
  - `homework_assignments`
    - поля: `id`, `title`, `status`, `due_at`
  - `student_words`
    - count-only запрос для total words
- Secondary block:
  - `student_mistakes`
    - поля: `mistake_count`, `module_id`, `test_id`, `last_mistake_at`
  - `student_words`
    - count-only запрос для non-mastered words
  - `student_test_attempts`
    - статус попыток
  - `student_lesson_progress`
    - `progress_percent`
  - schedule preview через `getStudentSchedulePreviewByStudentId()`
    - таблица `student_schedule_lessons`
    - teacher labels через `teachers` или RPC `get_schedule_teacher_options`
- Payment reminder:
  - privileged path из [billing/reminders](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/lib/billing/reminders.ts)
  - использует billing state/settings и student billing summary

### `/schedule`

- Route:
  - [schedule/page.tsx](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/(workspace)/(shared-zone)/schedule/page.tsx)
  - [schedule/queries.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/lib/schedule/queries.ts)
- Основная таблица:
  - `student_schedule_lessons`
    - поля: `id`, `student_id`, `teacher_id`, `title`, `starts_at`, `ends_at`, `meeting_url`, `comment`, `status`, `created_at`, `updated_at`
- Enrichment:
  - teacher labels:
    - RPC `get_schedule_teacher_options`
    - fallback: `teachers` + join `profiles`
  - attendance:
    - `lesson_attendance`
  - outcomes:
    - `lesson_outcomes`
- Что реально показывается:
  - список будущих занятий
  - teacher name
  - attendance status
  - student-visible outcome summary/next steps

### `/practice`

- Route:
  - [practice/page.tsx](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/(workspace)/(shared-zone)/practice/page.tsx)
  - [practice/queries.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/lib/practice/queries.ts)
- Overview summary source:
  - `student_course_enrollments`
    - relation: `courses(id, slug, title, description)`
  - `student_test_attempts`
    - relation: `tests(title, module_id)`
  - `student_mistakes`
    - поля: `id`, `mistake_count`, `module_id`, `test_id`, `last_mistake_at`
  - `course_modules`
  - `lessons`
  - `student_lesson_progress`
- Topics source:
  - `student_course_enrollments`
  - `course_modules`
  - `lessons`
  - `student_lesson_progress`
- Recommended source:
  - `student_test_attempts`
  - `student_mistakes`
  - `student_course_enrollments`
  - `course_modules`
  - `lessons`
  - `student_lesson_progress`

### `/practice/recommended`

- Loader: `getPracticeRecommended()`
- Таблицы:
  - `student_test_attempts`
  - `student_mistakes`
  - `student_lesson_progress`
  - косвенно `lessons`, `tests`, `course_modules`, `courses`

### `/practice/topics`

- Loader: `getPracticeTopics()`
- Таблицы:
  - `student_course_enrollments`
  - `course_modules`
  - `lessons`
  - `student_lesson_progress`
  - relation: `courses`

### `/practice/topics/[topic]`

- Loader: `getPracticeTopicDetail()`
- Таблицы:
  - `courses`
  - `course_modules`
  - `lessons`
  - `tests`
  - `student_lesson_progress`

### `/practice/topics/[topic]/[subtopic]`

- Loader: `getPracticeSubtopicDetail()`
- Таблицы:
  - `courses`
  - `course_modules`
  - `lessons`
  - `tests`
  - `student_lesson_progress`
  - `student_test_attempts`

### `/practice/mistakes`

- Loader: `getPracticeMistakes()`
- Источники:
  - `student_mistakes`
  - relation: `tests(title)`
  - relation: `course_modules(title)`

### `/practice/favorites`

- Loader: `getPracticeFavorites()`
- Источники:
  - `student_favorites`
  - затем depending on target type:
    - `lessons`
    - `tests`

### `/practice/activity/[activityId]`

- Loader: `getPracticeActivityDetail()`
- Источники:
  - если lesson activity:
    - `lessons`
    - `student_lesson_progress`
  - если test activity:
    - `tests`
    - `student_test_attempts`

### `/homework`

- Route:
  - [homework/page.tsx](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/(workspace)/(shared-zone)/homework/page.tsx)
  - [homework/queries.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/lib/homework/queries.ts)
- Overview summary and list:
  - `homework_assignments`
    - поля: `id`, `title`, `description`, `status`, `due_at`
    - relation: `homework_items(id)`
- Detail:
  - `homework_assignments`
  - relation: `homework_items(id, source_type, source_id, sort_order, required)`

### `/homework/active`, `/homework/completed`, `/homework/overdue`

- Loader: `getHomeworkAssignments(status)`
- Таблица:
  - `homework_assignments`
  - relation: `homework_items(id)`

### `/homework/[id]`

- Loader: `getHomeworkAssignmentDetail(id)`
- Таблицы:
  - `homework_assignments`
  - `homework_items`

### `/words/my`

- Route:
  - [words/my/page.tsx](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/(workspace)/(shared-zone)/words/my/page.tsx)
  - [words/queries.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/lib/words/queries.ts)
- Источники:
  - summary counters:
    - `student_words` count total
    - `student_words` count active
    - `student_words` count review queue
    - `student_words` count new
  - list:
    - `student_words`
    - поля: `id`, `term`, `translation`, `status`, `next_review_at`, `created_at`

### `/words/review`

- Loader: `getWordsForReview()`
- Таблица:
  - `student_words`
  - фильтр: `next_review_at is null or <= now`

### `/words/new`

- Loader: `getNewWords()`
- Таблица:
  - `student_words`
  - фильтр: `status = new`

### `/progress/overview`

- Route:
  - [progress/overview/page.tsx](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/(workspace)/(shared-zone)/progress/overview/page.tsx)
  - [progress/queries.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/lib/progress/queries.ts)
- Источники:
  - `student_lesson_progress`
    - completed lessons count
  - `student_test_attempts`
    - attempts and average score
  - `student_mistakes`
    - weak points count

### `/progress/topics`

- Loader: `getProgressByTopics()`
- Источники:
  - `student_course_enrollments`
    - relation: `courses(title)`
  - RPC `get_student_course_progress`

### `/progress/history`

- Loader: `getProgressHistory()`
- Источники:
  - `student_test_attempts`
  - relation: `tests(title)`

### `/progress/weak-points`

- Loader: `getWeakPoints()`
- Источники:
  - `student_mistakes`
  - relation: `tests(title)`

### `/settings/profile`

- Route:
  - [settings/profile/page.tsx](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/(workspace)/(shared-zone)/settings/profile/page.tsx)
  - [use-settings-form-state.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/(workspace)/(shared-zone)/settings/use-settings-form-state.ts)
- Initial data:
  - `supabase.auth.getUser()`
  - `profiles`
    - поля: `first_name`, `last_name`, `phone`, `avatar_url`, `role`, `email`, `birth_date`
  - fallback birth date from `students.birth_date` by `profile_id`
  - avatar storage bucket: `avatars`
- Mutation targets:
  - `profiles`
  - `students`
  - `supabase.auth.updateUser()`
  - `supabase.storage.from("avatars")`

### `/settings/payments`

- Route:
  - [settings/payments/page.tsx](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/(workspace)/(student-zone)/settings/payments/page.tsx)
  - [payments/queries.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/lib/payments/queries.ts)
  - [billing/server.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/lib/billing/server.ts)
- Initial page:
  - `payment_plans`
  - `payment_transactions`
    - relation: `payment_plans(title)`
  - optional status context:
    - `payment_transactions`
- Deferred billing summary:
  - `student_billing_accounts`
  - RPC `get_student_billing_summary_aggregates`
  - fallback/full ledger: `student_billing_ledger`
- API refresh:
  - [api/payments/route.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/api/payments/route.ts)

### `/search`

- Route:
  - [search/page.tsx](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/(workspace)/(search-zone)/search/page.tsx)
  - [search-service.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/lib/search/search-service.ts)
- Источники:
  - search candidates via RPC `search_documents_query`
  - visibility filters use request-context
  - for student enrollment-restricted documents:
    - `student_course_enrollments`

### Redirect-only student routes

- `/flashcards` -> `/words`
- `/assignments` -> `/homework`
- `/tests` -> `/practice`
- `/learning` -> `/practice`
- Собственных DB-запросов нет.

## Teacher

### `/dashboard`

- Route:
  - [dashboard/page.tsx](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/(workspace)/(shared-zone)/dashboard/page.tsx)
  - [teacher-workspace/queries.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/lib/teacher-workspace/queries.ts)
- Initial critical agenda:
  - `student_schedule_lessons`
    - фильтр: week window, role scope, not canceled
  - labels:
    - RPC `get_schedule_student_options`
    - RPC `get_schedule_teacher_options`
    - fallback: `students`, `teachers`, `profiles`
- Deferred roster:
  - `students`
  - `profiles`
  - `homework_assignments`
- Deferred attention queue:
  - `student_schedule_lessons`
    - completed lessons in current window
  - `lesson_outcomes`
  - labels via student/teacher label loaders

### `/schedule`

- Same shared route as staff/student:
  - [schedule/page.tsx](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/(workspace)/(shared-zone)/schedule/page.tsx)
  - [schedule/queries.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/lib/schedule/queries.ts)
- Initial SSR:
  - `student_schedule_lessons`
  - student labels:
    - RPC `get_schedule_student_options`
    - fallback `students` + `profiles`
  - teacher labels:
    - RPC `get_schedule_teacher_options`
    - fallback `teachers` + `profiles`
  - filter shell built from lesson rows
- Follow-up enrichment after mount:
  - `lesson_attendance`
  - `lesson_outcomes`
  - full `/api/schedule?includeFollowup=1`

### `/students/[studentId]`

- Route:
  - [students/[studentId]/page.tsx](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/(workspace)/(teacher-zone)/students/[studentId]/page.tsx)
  - [teacher-workspace/queries.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/lib/teacher-workspace/queries.ts)
- Header:
  - `students`
  - `profiles`
- Notes:
  - `teacher_student_notes`
- Lesson history:
  - `student_schedule_lessons`
  - then schedule lesson mapping with student/teacher labels and optional follow-up fields
- Homework snapshot:
  - `homework_assignments`
- Mistakes snapshot:
  - `student_mistakes`
  - relation: `tests(title)`
  - relation: `course_modules(title)`
- Billing snapshot:
  - currently not implemented, returns `null`

### Teacher on shared student-centric routes

- `/practice`
- `/homework`
- `/words`
- `/progress`
- `/settings/profile`
- `/search`

Важно:

- teacher navigation включает shared student-like routes (`practice`, `homework`, `words`, `progress`)
- но большинство их loader'ов используют `getCurrentStudentProfile()`
- для teacher это возвращает `null`
- поэтому данные на этих экранах либо пустые, либо fallback/zero-state

## Admin / Manager

### `/dashboard`

- Route:
  - [dashboard/page.tsx](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/(workspace)/(shared-zone)/dashboard/page.tsx)
  - [use-admin-dashboard-metrics.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/(workspace)/(shared-zone)/dashboard/use-admin-dashboard-metrics.ts)
  - [api/admin/dashboard/metrics/route.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/api/admin/dashboard/metrics/route.ts)
- Initial server page:
  - только admin access check через request-context/profile identity
- Main metrics fetch:
  - RPC `admin_dashboard_metrics`
  - поля DTO:
    - `revenue_month`
    - `new_payments_7d`
    - `active_students_7d`
    - `active_teachers_7d`
    - `avg_check_month`
    - `currency`
- Клиент:
  - runtime/session cache на 5 минут

### `/schedule`

- Same shared staff schedule route
- Initial data:
  - `student_schedule_lessons`
  - student labels via RPC/fallback:
    - `get_schedule_student_options`
    - `students`
    - `profiles`
  - teacher labels via RPC/fallback:
    - `get_schedule_teacher_options`
    - `teachers`
    - `profiles`
- Follow-up enrichment:
  - `lesson_attendance`
  - `lesson_outcomes`

### `/admin`

- Route:
  - [admin/page.tsx](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/(workspace)/(staff-zone)/admin/page.tsx)
  - [use-admin-tab-data.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/(workspace)/(staff-zone)/admin/ui/use-admin-tab-data.ts)
- Сам экран почти весь client-side и тянет данные через API tabs.

#### Tab: Tests

- API:
  - [api/admin/tests/route.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/api/admin/tests/route.ts)
- Таблица:
  - `tests`

#### Tab: Users

- API:
  - [api/admin/users/route.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/api/admin/users/route.ts)
- Таблицы:
  - `profiles`
  - hydration for students through helper `hydrateUsersWithStudentDetails()`
  - for created student also:
    - `students`
    - `student_billing_accounts`
  - auth creation:
    - `supabase.auth.admin.createUser()`

#### Tab: Blog Posts

- API:
  - [api/admin/blog/posts/route.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/api/admin/blog/posts/route.ts)
- Таблицы:
  - `blog_posts`
  - `blog_categories`
  - `blog_post_tags`
  - `blog_tags`

#### Tab: Notifications

- API:
  - [api/admin/notifications/route.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/api/admin/notifications/route.ts)
- Таблица:
  - `notifications`

### `/admin/payments`

- Route:
  - [admin/payments/page.tsx](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/app/(workspace)/(staff-zone)/admin/payments/page.tsx)
  - [admin/payments-control.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/lib/admin/payments-control.ts)
- Initial page:
  - `admin_payment_reminder_settings`
  - RPC `admin_list_payment_control`
  - RPC `admin_payment_control_stats`
- Additional flows:
  - reminder sync/send:
    - `students`
    - `profiles`
    - `notifications`
    - billing summary from [billing/server.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/lib/billing/server.ts)
    - reminder state from billing reminder store

### `/settings/profile`

- Same screen as student/teacher:
  - `supabase.auth.getUser()`
  - `profiles`
  - optional fallback `students.birth_date`
  - avatar bucket `avatars`

### `/search`

- Same shared search route
- Источники:
  - RPC `search_documents_query`
  - request-context capabilities
- For admin visibility:
  - admin sees admin-scoped search documents if `roleScope` allows staff admin

## Public / support screens outside role profiles

Это не “профильные” экраны, но для полноты:

- Public blog:
  - [blog/public.ts](/Users/anton/Desktop/Флексенг/6.%20Инфра-ра/Pencil/dashboard-next/dashboard-next-next16/lib/blog/public.ts)
  - таблицы:
    - `blog_posts`
    - `blog_categories`
    - `blog_tags`
    - `blog_post_tags`

## Короткие выводы

- Самые “таблично насыщенные” маршруты:
  - student `/dashboard`
  - shared staff `/schedule`
  - teacher `/students/[studentId]`
  - admin `/admin`
  - admin `/admin/payments`
- Самые важные RPC:
  - `get_linked_actor_scope`
  - `get_schedule_student_options`
  - `get_schedule_teacher_options`
  - `get_student_course_progress`
  - `get_student_billing_summary_aggregates`
  - `admin_dashboard_metrics`
  - `admin_list_payment_control`
  - `admin_payment_control_stats`
  - `search_documents_query`
- Главный общий источник identity/profile:
  - `profiles`
- Главный общий источник role-linked business scope:
  - `students`
  - `teachers`
  - `student_course_enrollments`
