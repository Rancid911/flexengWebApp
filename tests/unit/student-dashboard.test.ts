import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildStudentDashboardWordCounts,
  getCompletedTeacherLessonsCountLast7Days,
  getStudentDashboardCoreData,
  getStudentDashboardData,
  getStudentDashboardPaymentReminder,
  getSubmittedTestsCountLast7Days
} from "@/lib/dashboard/student-dashboard";

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const getCurrentStudentProfileMock = vi.fn();
const getStudentSchedulePreviewByStudentIdMock = vi.fn();
const getPaymentReminderSettingsMock = vi.fn();
const resolveStudentPaymentReminderForDashboardMock = vi.fn();
const createStudentPaymentReminderPopupMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock()
}));

vi.mock("@/lib/students/current-student", () => ({
  getCurrentStudentProfile: () => getCurrentStudentProfileMock()
}));

vi.mock("@/lib/schedule/queries", () => ({
  getStudentSchedulePreviewByStudentId: (...args: unknown[]) => getStudentSchedulePreviewByStudentIdMock(...args)
}));

vi.mock("@/lib/billing/reminders", () => ({
  getPaymentReminderSettings: (...args: unknown[]) => getPaymentReminderSettingsMock(...args),
  resolveStudentPaymentReminderForDashboard: (...args: unknown[]) => resolveStudentPaymentReminderForDashboardMock(...args),
  createStudentPaymentReminderPopup: (...args: unknown[]) => createStudentPaymentReminderPopupMock(...args)
}));

function makeQueryResult(
  data: unknown,
  error: { message: string } | null = null,
  options: { count?: number | null } = {}
) {
  const result = { data, error, count: options.count ?? null };
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    maybeSingle: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    in: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
    catch: (reject: (reason: unknown) => unknown) => Promise.resolve(result).catch(reject),
    finally: (callback: () => void) => Promise.resolve(result).finally(callback)
  };
  return builder;
}

type CompletedLessonCountRow = {
  student_id: string;
  status: string;
  student_schedule_lessons: {
    status: string;
    ends_at: string;
  };
};

function readNestedValue(row: CompletedLessonCountRow, column: string) {
  if (column === "student_schedule_lessons.status") return row.student_schedule_lessons.status;
  if (column === "student_schedule_lessons.ends_at") return row.student_schedule_lessons.ends_at;
  return row[column as keyof CompletedLessonCountRow];
}

function makeCompletedLessonsCountQueryResult(rows: CompletedLessonCountRow[]) {
  const filters: Array<(row: CompletedLessonCountRow) => boolean> = [];

  const result = () => ({
    data: null,
    error: null,
    count: rows.filter((row) => filters.every((filter) => filter(row))).length
  });

  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn((column: string, value: unknown) => {
      filters.push((row) => readNestedValue(row, column) === value);
      return builder;
    }),
    neq: vi.fn((column: string, value: unknown) => {
      filters.push((row) => readNestedValue(row, column) !== value);
      return builder;
    }),
    lte: vi.fn((column: string, value: unknown) => {
      filters.push((row) => String(readNestedValue(row, column) ?? "") <= String(value));
      return builder;
    }),
    gte: vi.fn((column: string, value: unknown) => {
      filters.push((row) => String(readNestedValue(row, column) ?? "") >= String(value));
      return builder;
    }),
    maybeSingle: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    in: vi.fn(() => builder),
    then: (resolve: (value: ReturnType<typeof result>) => unknown) => Promise.resolve(result()).then(resolve),
    catch: (reject: (reason: unknown) => unknown) => Promise.resolve(result()).catch(reject),
    finally: (callback: () => void) => Promise.resolve(result()).finally(callback)
  };

  return builder;
}

function makeTestsTableQueryResult(moduleRows: Record<string, Array<{ id: string }>>) {
  const state: { placementLookup: boolean; moduleId: string | null } = {
    placementLookup: false,
    moduleId: null
  };

  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn((column: string, value: unknown) => {
      if (column === "assessment_kind" && value === "placement") {
        state.placementLookup = true;
      }
      if (column === "module_id" && typeof value === "string") {
        state.moduleId = value;
      }
      return builder;
    }),
    neq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(() =>
      Promise.resolve({
        data: state.placementLookup ? null : null,
        error: null
      })
    ),
    then: (resolve: (value: { data: unknown; error: null; count: null }) => unknown) =>
      Promise.resolve({
        data: state.moduleId ? moduleRows[state.moduleId] ?? [] : [],
        error: null,
        count: null
      }).then(resolve),
    catch: (reject: (reason: unknown) => unknown) =>
      Promise.resolve({
        data: state.moduleId ? moduleRows[state.moduleId] ?? [] : [],
        error: null,
        count: null
      }).catch(reject),
    finally: (callback: () => void) =>
      Promise.resolve({
        data: state.moduleId ? moduleRows[state.moduleId] ?? [] : [],
        error: null,
        count: null
      }).finally(callback)
  };

  return builder;
}

function makeStudentAttemptsQueryResult(rows: Array<Record<string, unknown>>) {
  const state: {
    allowedIds: string[] | null;
    excludedStatus: string | null;
    excludedAssessmentKind: string | null;
    studentId: string | null;
    submittedAtMin: string | null;
    submittedAtMax: string | null;
  } = {
    allowedIds: null,
    excludedStatus: null,
    excludedAssessmentKind: null,
    studentId: null,
    submittedAtMin: null,
    submittedAtMax: null
  };

  const filterRows = () =>
    rows.filter((row) => {
      const tests = row.tests as { assessment_kind?: unknown } | null | undefined;
      const submittedAt = typeof row.submitted_at === "string" ? row.submitted_at : null;
      const matchesIds = state.allowedIds ? state.allowedIds.includes(String(row.test_id ?? "")) : true;
      const matchesStatus = state.excludedStatus ? String(row.status ?? "") !== state.excludedStatus : true;
      const matchesAssessmentKind = state.excludedAssessmentKind
        ? String(tests?.assessment_kind ?? "") !== state.excludedAssessmentKind
        : true;
      const matchesStudent = state.studentId ? String(row.student_id ?? "") === state.studentId : true;
      const matchesSubmittedMin = state.submittedAtMin ? submittedAt != null && submittedAt >= state.submittedAtMin : true;
      const matchesSubmittedMax = state.submittedAtMax ? submittedAt != null && submittedAt <= state.submittedAtMax : true;
      return matchesIds && matchesStatus && matchesAssessmentKind && matchesStudent && matchesSubmittedMin && matchesSubmittedMax;
    });

  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn((column: string, value: unknown) => {
      if (column === "student_id") {
        state.studentId = String(value);
      }
      return builder;
    }),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    in: vi.fn((column: string, values: unknown[]) => {
      if (column === "test_id") {
        state.allowedIds = values.map((value) => String(value));
      }
      return builder;
    }),
    neq: vi.fn((column: string, value: unknown) => {
      if (column === "status") {
        state.excludedStatus = String(value);
      }
      if (column === "tests.assessment_kind") {
        state.excludedAssessmentKind = String(value);
      }
      return builder;
    }),
    lte: vi.fn((column: string, value: unknown) => {
      if (column === "submitted_at") {
        state.submittedAtMax = String(value);
      }
      return builder;
    }),
    gte: vi.fn((column: string, value: unknown) => {
      if (column === "submitted_at") {
        state.submittedAtMin = String(value);
      }
      return builder;
    }),
    then: (resolve: (value: { data: unknown; error: null; count: number }) => unknown) =>
      Promise.resolve({
        data: filterRows(),
        error: null,
        count: filterRows().length
      }).then(resolve),
    catch: (reject: (reason: unknown) => unknown) =>
      Promise.resolve({
        data: filterRows(),
        error: null,
        count: filterRows().length
      }).catch(reject),
    finally: (callback: () => void) =>
      Promise.resolve({
        data: filterRows(),
        error: null,
        count: filterRows().length
      }).finally(callback)
  };

  return builder;
}

describe("getCompletedTeacherLessonsCountLast7Days", () => {
  it("counts only completed attendance for the current student in the last 7 days", async () => {
    const fromMock = vi.fn((table: string) => {
      expect(table).toBe("lesson_attendance");
      return makeCompletedLessonsCountQueryResult([
        {
          student_id: "student-1",
          status: "completed",
          student_schedule_lessons: { status: "completed", ends_at: "2026-04-18T08:00:00.000Z" }
        },
        {
          student_id: "student-1",
          status: "completed",
          student_schedule_lessons: { status: "scheduled", ends_at: "2026-04-15T08:00:00.000Z" }
        },
        {
          student_id: "student-1",
          status: "missed_by_student",
          student_schedule_lessons: { status: "completed", ends_at: "2026-04-16T08:00:00.000Z" }
        },
        {
          student_id: "student-1",
          status: "missed_by_teacher",
          student_schedule_lessons: { status: "completed", ends_at: "2026-04-16T09:00:00.000Z" }
        },
        {
          student_id: "student-1",
          status: "completed",
          student_schedule_lessons: { status: "canceled", ends_at: "2026-04-17T08:00:00.000Z" }
        },
        {
          student_id: "student-1",
          status: "completed",
          student_schedule_lessons: { status: "completed", ends_at: "2026-04-10T08:00:00.000Z" }
        },
        {
          student_id: "student-1",
          status: "completed",
          student_schedule_lessons: { status: "completed", ends_at: "2026-04-19T08:00:00.000Z" }
        },
        {
          student_id: "student-2",
          status: "completed",
          student_schedule_lessons: { status: "completed", ends_at: "2026-04-18T08:00:00.000Z" }
        }
      ]);
    });

    const count = await getCompletedTeacherLessonsCountLast7Days(
      "student-1",
      { from: fromMock } as never,
      new Date("2026-04-18T12:00:00.000Z")
    );

    expect(count).toBe(2);
  });

  it("returns zero when there are no completed lessons", async () => {
    const count = await getCompletedTeacherLessonsCountLast7Days(
      "student-1",
      {
        from: vi.fn(() =>
          makeCompletedLessonsCountQueryResult([
            {
              student_id: "student-1",
              status: "canceled",
              student_schedule_lessons: { status: "canceled", ends_at: "2026-04-18T08:00:00.000Z" }
            }
          ])
        )
      } as never,
      new Date("2026-04-18T12:00:00.000Z")
    );

    expect(count).toBe(0);
  });
});

describe("getSubmittedTestsCountLast7Days", () => {
  it("counts only submitted non-placement tests for the current student in the last 7 days", async () => {
    const fromMock = vi.fn((table: string) => {
      expect(table).toBe("student_test_attempts");
      return makeStudentAttemptsQueryResult([
        {
          student_id: "student-1",
          status: "passed",
          submitted_at: "2026-04-18T08:00:00.000Z",
          tests: { assessment_kind: "regular" }
        },
        {
          student_id: "student-1",
          status: "failed",
          submitted_at: "2026-04-15T08:00:00.000Z",
          tests: { assessment_kind: "regular" }
        },
        {
          student_id: "student-1",
          status: "in_progress",
          submitted_at: "2026-04-16T08:00:00.000Z",
          tests: { assessment_kind: "regular" }
        },
        {
          student_id: "student-1",
          status: "passed",
          submitted_at: "2026-04-17T08:00:00.000Z",
          tests: { assessment_kind: "placement" }
        },
        {
          student_id: "student-1",
          status: "passed",
          submitted_at: "2026-04-10T08:00:00.000Z",
          tests: { assessment_kind: "regular" }
        },
        {
          student_id: "student-1",
          status: "passed",
          submitted_at: "2026-04-19T08:00:00.000Z",
          tests: { assessment_kind: "regular" }
        },
        {
          student_id: "student-1",
          status: "passed",
          submitted_at: null,
          tests: { assessment_kind: "regular" }
        },
        {
          student_id: "student-2",
          status: "passed",
          submitted_at: "2026-04-18T08:00:00.000Z",
          tests: { assessment_kind: "regular" }
        }
      ]);
    });

    const count = await getSubmittedTestsCountLast7Days(
      "student-1",
      { from: fromMock } as never,
      new Date("2026-04-18T12:00:00.000Z")
    );

    expect(count).toBe(2);
  });
});

describe("getStudentDashboardData", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    createAdminClientMock.mockReset();
    getCurrentStudentProfileMock.mockReset();
    getStudentSchedulePreviewByStudentIdMock.mockReset();
    getPaymentReminderSettingsMock.mockReset();
    resolveStudentPaymentReminderForDashboardMock.mockReset();
    createStudentPaymentReminderPopupMock.mockReset();
    createAdminClientMock.mockReturnValue({});
    getPaymentReminderSettingsMock.mockResolvedValue({ enabled: false, thresholdLessons: 1 });
    resolveStudentPaymentReminderForDashboardMock.mockResolvedValue(null);
    createStudentPaymentReminderPopupMock.mockReturnValue(null);
  });

  it("returns fallback when student profile is unavailable", async () => {
    getCurrentStudentProfileMock.mockResolvedValue(null);
    getStudentSchedulePreviewByStudentIdMock.mockResolvedValue({ nextLesson: null, upcomingLessons: [] });

    const result = await getStudentDashboardData();

    expect(result.lessonOfTheDay.title).toBe("Практика");
    expect(result.summaryStats[0]).toMatchObject({ label: "Онлайн-уроки", value: "0", chip: "за 7 дней" });
    expect(result.paymentReminderPopup).toBeNull();
  });

  it("keeps payment reminder outside the core dashboard loader", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({ studentId: "student-1" });
    getStudentSchedulePreviewByStudentIdMock.mockResolvedValue({ nextLesson: null, upcomingLessons: [] });
    createClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        switch (table) {
          case "student_words":
            return makeQueryResult(null, null, { count: 0 });
          case "tests":
            return makeQueryResult(null);
          default:
            return makeQueryResult([]);
        }
      })
    });

    await getStudentDashboardCoreData();

    expect(getPaymentReminderSettingsMock).not.toHaveBeenCalled();
    expect(resolveStudentPaymentReminderForDashboardMock).not.toHaveBeenCalled();
  });

  it("builds dashboard data from student progress sources", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({ studentId: "student-1" });
    getStudentSchedulePreviewByStudentIdMock.mockResolvedValue({
      nextLesson: {
        id: "schedule-1",
        studentId: "student-1",
        studentName: "Student",
        teacherId: "teacher-1",
        teacherName: "Teacher",
        title: "Conversation club",
        startsAt: "2026-03-29T10:00:00.000Z",
        endsAt: "2026-03-29T11:00:00.000Z",
        meetingUrl: "https://example.com/meet",
        comment: "Bring a topic",
        status: "scheduled",
        createdAt: null,
        updatedAt: null,
        attendanceStatus: null,
        hasOutcome: false,
        studentVisibleOutcome: null
      },
      upcomingLessons: [
        {
          id: "schedule-1",
          studentId: "student-1",
          studentName: "Student",
          teacherId: "teacher-1",
          teacherName: "Teacher",
          title: "Conversation club",
          startsAt: "2026-03-29T10:00:00.000Z",
          endsAt: "2026-03-29T11:00:00.000Z",
          meetingUrl: "https://example.com/meet",
          comment: "Bring a topic",
          status: "scheduled",
          createdAt: null,
          updatedAt: null,
          attendanceStatus: null,
          hasOutcome: false,
          studentVisibleOutcome: null
        }
      ]
    });
    const submittedYesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const submittedTwoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    createClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        switch (table) {
          case "student_lesson_progress":
            return makeQueryResult([
              {
                status: "in_progress",
                progress_percent: 40,
                updated_at: "2026-04-18T11:00:00.000Z",
                lesson_id: "lesson-1",
                lessons: { title: "Speaking basics", duration_minutes: 15, module_id: "module-1" }
              },
              {
                status: "completed",
                progress_percent: 80,
                updated_at: "2026-04-17T11:00:00.000Z",
                lesson_id: "lesson-2",
                lessons: { title: "Grammar", duration_minutes: 20, module_id: "module-2" }
              }
            ]);
          case "student_test_attempts":
            return makeStudentAttemptsQueryResult([
              {
                student_id: "student-1",
                test_id: "test-drill-1",
                status: "passed",
                score: 91,
                created_at: "2026-04-16T10:00:00.000Z",
                submitted_at: submittedTwoDaysAgo,
                tests: { title: "Speaking Drill", module_id: "module-1", assessment_kind: "regular", activity_type: "trainer" }
              },
              {
                student_id: "student-1",
                test_id: "test-grammar-1",
                status: "in_progress",
                score: 0,
                created_at: "2026-04-17T10:00:00.000Z",
                submitted_at: null,
                tests: { title: "Grammar Drill", module_id: "module-2", assessment_kind: "regular", activity_type: "trainer" }
              },
              {
                student_id: "student-1",
                test_id: "test-drill-1",
                status: "passed",
                score: 88,
                created_at: "2026-04-18T10:00:00.000Z",
                submitted_at: submittedYesterday,
                tests: { title: "Speaking Drill", module_id: "module-1", assessment_kind: "regular", activity_type: "trainer" }
              }
            ]);
          case "student_course_enrollments":
            return makeQueryResult([{ status: "active", courses: { title: "English A2" } }]);
          case "homework_assignments":
            return makeQueryResult([{ id: "hw-1", title: "Homework 1", status: "overdue", due_at: "2026-03-27T10:00:00.000Z" }], null, { count: 1 });
          case "course_modules":
            return makeQueryResult([
              { id: "module-1", title: "Speaking Basics", course_id: "course-1", courses: { slug: "speaking", title: "Speaking" } },
              { id: "module-2", title: "Grammar Core", course_id: "course-2", courses: { slug: "grammar-foundations", title: "Grammar Foundations" } }
            ]);
          case "student_words":
            return makeQueryResult([
              { status: "learning", next_review_at: null },
              { status: "review", next_review_at: "2020-01-01T00:00:00.000Z" },
              { status: "difficult", next_review_at: "2999-01-01T00:00:00.000Z" },
              { status: "mastered", next_review_at: null },
              { status: "new", next_review_at: null }
            ]);
          case "lesson_attendance":
            return makeQueryResult(null, null, { count: 3 });
          case "tests":
            return makeTestsTableQueryResult({
              "module-1": [{ id: "test-drill-1" }, { id: "test-drill-2" }],
              "module-2": [{ id: "test-grammar-1" }]
            });
          default:
            return makeQueryResult([]);
        }
      })
    });

    const result = await getStudentDashboardData();

    expect(result.lessonOfTheDay.title).toBe("Speaking Basics");
    expect(result.lessonOfTheDay.progress).toBe(50);
    expect(result.lessonOfTheDay.sectionsLabel).toBe("2 дрилла в теме");
    expect(result.progress.value).toBe(50);
    expect(result.progress.label).toBe("Пройдено 1 из 2 дриллов");
    expect(result.heroStats).toEqual([
      { label: "Точность", value: "90%" },
      { label: "Попыток", value: "2" },
      { label: "В изучении", value: "3" }
    ]);
    expect(result.homeworkCards[0]).toMatchObject({
      title: "Homework 1",
      status: "Просрочено",
      statusTone: "warning"
    });
    expect(result.activeHomeworkCount).toBe(1);
    expect(result.recommendationCards).toEqual([
      {
        id: "recommendation-module-module-1",
        title: "Speaking Basics",
        subtitle: "Последняя активность: Speaking basics",
        href: "/practice/topics/speaking/module-1"
      },
      {
        id: "recommendation-module-module-2",
        title: "Grammar Core",
        subtitle: "Последняя активность: Grammar",
        href: "/practice/topics/grammar-foundations/module-2"
      }
    ]);
    expect(result.nextBestAction.title).toBe("Закройте просроченное домашнее задание");
    expect(result.nextBestAction.primaryHref).toBe("/homework");
    expect(result.summaryStats[0]).toMatchObject({ label: "Онлайн-уроки", value: "3", chip: "за 7 дней" });
    expect(result.summaryStats[1]).toMatchObject({ label: "Сделано тестов", value: "2", chip: "за 7 дней", icon: "clipboardCheck", href: "/practice" });
    expect(result.summaryStats[2]).toMatchObject({ label: "Слов в повторении", href: "/words/review" });
    expect(result.summaryStats.find((item) => item.label === "Сегодня")).toBeUndefined();
    expect(result.summaryStats[2].value).toBe("2");
    expect(result.nextScheduledLesson?.title).toBe("Conversation club");
    expect(result.upcomingScheduleLessons).toHaveLength(1);
    expect(result.paymentReminderPopup).toBeNull();
  });

  it("prioritizes assigned placement test in next best action over overdue homework", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({ studentId: "student-1" });
    getStudentSchedulePreviewByStudentIdMock.mockResolvedValue({ nextLesson: null, upcomingLessons: [] });
    createClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        switch (table) {
          case "student_lesson_progress":
          case "student_test_attempts":
          case "student_course_enrollments":
          case "student_words":
            return makeQueryResult(null, null, { count: 0 });
          case "course_modules":
            return makeQueryResult([]);
          case "homework_assignments":
            return makeQueryResult([
              {
                id: "placement-hw",
                title: "Placement assignment",
                status: "not_started",
                due_at: "2026-03-27T10:00:00.000Z",
                homework_items: [{ id: "item-placement", source_type: "test", source_id: "placement-test-id" }]
              },
              {
                id: "hw-1",
                title: "Homework 1",
                status: "overdue",
                due_at: "2026-03-26T10:00:00.000Z",
                homework_items: []
              }
            ]);
          case "tests":
            return makeQueryResult({ id: "placement-test-id", title: "Placement Test" });
          default:
            return makeQueryResult([]);
        }
      })
    });

    const result = await getStudentDashboardData();

    expect(result.homeworkCards).toHaveLength(1);
    expect(result.homeworkCards[0]?.title).toBe("Homework 1");
    expect(result.placementTest).toMatchObject({
      assigned: true,
      completed: false,
      href: "/practice/activity/test_placement-test-id"
    });
    expect(result.nextBestAction).toMatchObject({
      title: "Пройдите тест на уровень",
      primaryLabel: "Пройти тест на уровень",
      primaryHref: "/practice/activity/test_placement-test-id"
    });
  });

  it("limits dashboard homework cards to two while keeping total active count", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({ studentId: "student-1" });
    getStudentSchedulePreviewByStudentIdMock.mockResolvedValue({ nextLesson: null, upcomingLessons: [] });
    createClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        switch (table) {
          case "student_lesson_progress":
          case "student_test_attempts":
          case "student_course_enrollments":
          case "student_words":
            return makeQueryResult(null, null, { count: 0 });
          case "course_modules":
            return makeQueryResult([]);
          case "homework_assignments":
            return makeQueryResult([
              { id: "hw-1", title: "Homework 1", status: "not_started", due_at: "2026-03-27T10:00:00.000Z", homework_items: [] },
              { id: "hw-2", title: "Homework 2", status: "in_progress", due_at: "2026-03-28T10:00:00.000Z", homework_items: [] },
              { id: "hw-3", title: "Homework 3", status: "overdue", due_at: "2026-03-29T10:00:00.000Z", homework_items: [] }
            ]);
          case "tests":
            return makeQueryResult(null);
          default:
            return makeQueryResult([]);
        }
      })
    });

    const result = await getStudentDashboardData();

    expect(result.homeworkCards).toHaveLength(2);
    expect(result.homeworkCards.map((item) => item.title)).toEqual(["Homework 1", "Homework 2"]);
    expect(result.activeHomeworkCount).toBe(3);
    expect(result.nextBestAction.title).toBe("Закройте просроченное домашнее задание");
    expect(result.paymentReminderPopup).toBeNull();
  });

  it("excludes placement assignment from homework and surfaces it through next best action", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({ studentId: "student-1" });
    getStudentSchedulePreviewByStudentIdMock.mockResolvedValue({ nextLesson: null, upcomingLessons: [] });
    createClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        switch (table) {
          case "student_lesson_progress":
          case "student_course_enrollments":
            return makeQueryResult([]);
          case "student_test_attempts":
            return makeQueryResult([]);
          case "student_words":
            return makeQueryResult(null, null, { count: 0 });
          case "course_modules":
            return makeQueryResult([]);
          case "tests":
            return makeQueryResult({ id: "placement-test-1", title: "Placement Test" });
          case "homework_assignments":
            return makeQueryResult([
              {
                id: "placement-assignment",
                title: "Placement Test",
                status: "not_started",
                due_at: null,
                homework_items: [{ id: "placement-item", source_type: "test", source_id: "placement-test-1" }]
              },
              {
                id: "homework-assignment",
                title: "Homework 1",
                status: "not_started",
                due_at: "2026-03-27T10:00:00.000Z",
                homework_items: [{ id: "homework-item", source_type: "test", source_id: "regular-test-1" }]
              }
            ]);
          default:
            return makeQueryResult([]);
        }
      })
    });

    const result = await getStudentDashboardData();

    expect(result.homeworkCards).toHaveLength(1);
    expect(result.homeworkCards[0]?.title).toBe("Homework 1");
    expect(result.activeHomeworkCount).toBe(1);
    expect(result.placementTest).toMatchObject({
      title: "Placement Test",
      status: "Назначен"
    });
    expect(result.nextBestAction).toMatchObject({
      title: "Пройдите тест на уровень",
      primaryLabel: "Пройти тест на уровень",
      primaryHref: "/practice/activity/test_placement-test-1"
    });
    expect(result.paymentReminderPopup).toBeNull();
  });

  it("loads payment reminder separately when requested", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({ studentId: "student-1" });
    getPaymentReminderSettingsMock.mockResolvedValue({ enabled: true, thresholdLessons: 2 });
    resolveStudentPaymentReminderForDashboardMock.mockResolvedValue({
      shouldShowPopup: true,
      status: "debt"
    });
    createStudentPaymentReminderPopupMock.mockReturnValue({
      status: "debt",
      title: "У вас долг по оплате уроков",
      body: "Есть задолженность",
      availableLessonCount: 0,
      debtLessonCount: 1,
      debtMoneyAmount: 1800,
      nextScheduledLessonAt: "2026-03-28T10:00:00.000Z"
    });

    const result = await getStudentDashboardPaymentReminder();

    expect(result).toMatchObject({
      status: "debt",
      debtLessonCount: 1
    });
  });

  it("does not create a dashboard popup when there is no scheduled unpaid lesson and no debt", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({ studentId: "student-1" });
    getPaymentReminderSettingsMock.mockResolvedValue({ enabled: true, thresholdLessons: 2 });
    resolveStudentPaymentReminderForDashboardMock.mockResolvedValue({
      shouldShowPopup: false,
      status: "low_balance"
    });

    const result = await getStudentDashboardPaymentReminder();

    expect(result).toBeNull();
    expect(createStudentPaymentReminderPopupMock).not.toHaveBeenCalled();
  });
});

describe("buildStudentDashboardWordCounts", () => {
  it("counts learning words and due review words from real progress rows", () => {
    const result = buildStudentDashboardWordCounts(
      [
        { status: "learning", next_review_at: null },
        { status: "review", next_review_at: "2026-04-23T10:00:00.000Z" },
        { status: "difficult", next_review_at: "2026-04-25T10:00:00.000Z" },
        { status: "mastered", next_review_at: null },
        { status: "new", next_review_at: null }
      ],
      new Date("2026-04-24T12:00:00.000Z")
    );

    expect(result).toEqual({
      learningCount: 3,
      dueReviewCount: 2,
      masteredCount: 1
    });
  });
});
