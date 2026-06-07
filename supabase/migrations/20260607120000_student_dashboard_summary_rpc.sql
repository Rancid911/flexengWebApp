begin;

create or replace function public.get_my_student_dashboard_summary()
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
with current_student as (
  select s.id
  from public.students s
  where s.profile_id = auth.uid()
  limit 1
),
placement_test as (
  select t.id, t.title
  from public.tests t
  where t.assessment_kind = 'placement'
    and t.is_published = true
  order by t.created_at desc
  limit 1
),
placement_assignment as (
  select ha.id, ha.title, ha.status, ha.due_at, pt.id as test_id, pt.title as test_title
  from public.homework_assignments ha
  join current_student cs on cs.id = ha.student_id
  join public.homework_items hi on hi.assignment_id = ha.id
  join placement_test pt on pt.id = hi.source_id
  where hi.source_type = 'test'
  order by ha.created_at desc
  limit 1
),
active_homework as (
  select ha.id, ha.title, ha.status, ha.due_at
  from public.homework_assignments ha
  join current_student cs on cs.id = ha.student_id
  where ha.status in ('not_started', 'in_progress', 'overdue')
    and not exists (
      select 1
      from public.homework_items hi
      join placement_test pt on pt.id = hi.source_id
      where hi.assignment_id = ha.id
        and hi.source_type = 'test'
    )
),
homework_summary as (
  select
    count(*) as active_count,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', preview.id,
            'title', preview.title,
            'status', preview.status,
            'dueAt', preview.due_at
          )
          order by preview.due_at asc nulls last, preview.id asc
        )
        from (
          select ah.id, ah.title, ah.status, ah.due_at
          from active_homework ah
          order by ah.due_at asc nulls last, ah.id asc
          limit 2
        ) preview
      ),
      '[]'::jsonb
    ) as preview_rows
  from active_homework
),
word_counts as (
  select
    count(*) filter (where sw.status in ('learning', 'review', 'difficult')) as learning_count,
    count(*) filter (
      where sw.status in ('learning', 'review', 'difficult')
        and (sw.next_review_at is null or sw.next_review_at <= now())
    ) as due_review_count,
    count(*) filter (where sw.status = 'mastered') as mastered_count
  from public.student_words sw
  join current_student cs on cs.id = sw.student_id
),
progress_rows as (
  select
    slp.status,
    slp.progress_percent,
    slp.updated_at,
    slp.lesson_id,
    l.title as lesson_title,
    l.duration_minutes as lesson_duration_minutes,
    l.module_id as lesson_module_id
  from public.student_lesson_progress slp
  join current_student cs on cs.id = slp.student_id
  left join public.lessons l on l.id = slp.lesson_id
  order by slp.updated_at desc
  limit 6
),
progress_summary as (
  select
    coalesce(
      (
        select jsonb_build_object(
          'status', pr.status,
          'progressPercent', pr.progress_percent,
          'updatedAt', pr.updated_at,
          'lessonId', pr.lesson_id,
          'lesson', jsonb_build_object(
            'title', pr.lesson_title,
            'durationMinutes', pr.lesson_duration_minutes,
            'moduleId', pr.lesson_module_id
          )
        )
        from progress_rows pr
        order by (pr.status = 'in_progress') desc, pr.updated_at desc
        limit 1
      ),
      null
    ) as latest_progress,
    coalesce(round(avg(pr.progress_percent))::int, 0) as average_progress,
    count(*) filter (where pr.status = 'in_progress') as active_progress_count
  from progress_rows pr
),
active_courses as (
  select sce.status, c.title as course_title
  from public.student_course_enrollments sce
  join current_student cs on cs.id = sce.student_id
  left join public.courses c on c.id = sce.course_id
  where sce.status = 'active'
  order by sce.created_at desc
  limit 4
),
course_summary as (
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'status', ac.status,
          'course', jsonb_build_object('title', ac.course_title)
        )
      ) filter (where ac.status is not null),
      '[]'::jsonb
    ) as active_courses,
    count(*) as active_count
  from active_courses ac
),
recent_attempt_rows as (
  select sta.status, sta.score, sta.created_at, sta.submitted_at, t.assessment_kind
  from public.student_test_attempts sta
  join current_student cs on cs.id = sta.student_id
  left join public.tests t on t.id = sta.test_id
  order by sta.created_at desc
  limit 20
),
attempt_summary as (
  select
    count(*) filter (
      where rar.status <> 'in_progress'
        and coalesce(rar.assessment_kind, '') <> 'placement'
    ) as submitted_count,
    coalesce(
      round(
        avg(rar.score) filter (
          where rar.status <> 'in_progress'
            and coalesce(rar.assessment_kind, '') <> 'placement'
        )
      )::int,
      0
    ) as average_score
  from recent_attempt_rows rar
),
lesson_stats_7d as (
  select count(*) as completed_count
  from public.lesson_attendance la
  join public.student_schedule_lessons ssl on ssl.id = la.schedule_lesson_id
  join current_student cs on cs.id = la.student_id
  where la.status = 'completed'
    and ssl.status <> 'canceled'
    and ssl.ends_at <= now()
    and ssl.ends_at >= now() - interval '7 days'
),
test_stats_7d as (
  select count(*) as submitted_count
  from public.student_test_attempts sta
  join current_student cs on cs.id = sta.student_id
  left join public.tests t on t.id = sta.test_id
  where sta.status <> 'in_progress'
    and coalesce(t.assessment_kind, '') <> 'placement'
    and sta.submitted_at <= now()
    and sta.submitted_at >= now() - interval '7 days'
),
schedule_rows as (
  select
    ssl.id,
    ssl.student_id,
    ssl.teacher_id,
    ssl.title,
    ssl.starts_at,
    ssl.ends_at,
    ssl.meeting_url,
    ssl.comment,
    ssl.status,
    ssl.created_at,
    ssl.updated_at,
    coalesce(
      (
        select teacher_options.label
        from public.get_schedule_teacher_options(array[ssl.teacher_id]) teacher_options
        where teacher_options.id = ssl.teacher_id
        limit 1
      ),
      'Преподаватель'
    ) as teacher_name
  from public.student_schedule_lessons ssl
  join current_student cs on cs.id = ssl.student_id
  where ssl.status = 'scheduled'
    and ssl.starts_at >= now()
  order by ssl.starts_at asc
  limit 3
),
schedule_summary as (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', sr.id,
        'studentId', sr.student_id,
        'studentName', 'Вы',
        'teacherId', sr.teacher_id,
        'teacherName', sr.teacher_name,
        'title', sr.title,
        'startsAt', sr.starts_at,
        'endsAt', sr.ends_at,
        'meetingUrl', sr.meeting_url,
        'comment', sr.comment,
        'status', sr.status,
        'createdAt', sr.created_at,
        'updatedAt', sr.updated_at,
        'attendanceStatus', null,
        'hasOutcome', false,
        'studentVisibleOutcome', null
      )
      order by sr.starts_at asc
    ),
    '[]'::jsonb
  ) as upcoming_lessons
  from schedule_rows sr
)
select
  case
    when not exists (select 1 from current_student) then null
    else jsonb_build_object(
      'homework', jsonb_build_object(
        'activeCount', coalesce((select hs.active_count from homework_summary hs), 0),
        'previewRows', coalesce((select hs.preview_rows from homework_summary hs), '[]'::jsonb)
      ),
      'wordCounts', jsonb_build_object(
        'learningCount', coalesce((select wc.learning_count from word_counts wc), 0),
        'dueReviewCount', coalesce((select wc.due_review_count from word_counts wc), 0),
        'masteredCount', coalesce((select wc.mastered_count from word_counts wc), 0)
      ),
      'stats7d', jsonb_build_object(
        'completedTeacherLessons', coalesce((select ls.completed_count from lesson_stats_7d ls), 0),
        'submittedTests', coalesce((select ts.submitted_count from test_stats_7d ts), 0)
      ),
      'progress', jsonb_build_object(
        'latest', (select ps.latest_progress from progress_summary ps),
        'averageProgress', coalesce((select ps.average_progress from progress_summary ps), 0),
        'activeProgressCount', coalesce((select ps.active_progress_count from progress_summary ps), 0),
        'activeCourses', coalesce((select cs.active_courses from course_summary cs), '[]'::jsonb),
        'activeCourseCount', coalesce((select cs.active_count from course_summary cs), 0)
      ),
      'attempts', jsonb_build_object(
        'submittedCount', coalesce((select ats.submitted_count from attempt_summary ats), 0),
        'averageScore', coalesce((select ats.average_score from attempt_summary ats), 0)
      ),
      'schedule', jsonb_build_object(
        'upcomingLessons', coalesce((select ss.upcoming_lessons from schedule_summary ss), '[]'::jsonb)
      ),
      'placementTest', (
        select jsonb_build_object(
          'assigned', true,
          'completed', pa.status = 'completed',
          'testId', pa.test_id,
          'title', coalesce(pa.test_title, pa.title, 'Placement Test'),
          'dueAt', pa.due_at,
          'status', pa.status
        )
        from placement_assignment pa
      )
    )
  end;
$$;

revoke all on function public.get_my_student_dashboard_summary() from public;
revoke all on function public.get_my_student_dashboard_summary() from anon;
grant execute on function public.get_my_student_dashboard_summary() to authenticated;

commit;
