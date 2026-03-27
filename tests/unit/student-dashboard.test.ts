import { beforeEach, describe, expect, it, vi } from "vitest";

import { getStudentDashboardData } from "@/lib/dashboard/student-dashboard";

const createClientMock = vi.fn();
const getCurrentStudentProfileMock = vi.fn();
const getStudentSchedulePreviewByStudentIdMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
}));

vi.mock("@/lib/students/current-student", () => ({
  getCurrentStudentProfile: () => getCurrentStudentProfileMock()
}));

vi.mock("@/lib/schedule/queries", () => ({
  getStudentSchedulePreviewByStudentId: (...args: unknown[]) => getStudentSchedulePreviewByStudentIdMock(...args)
}));

function makeQueryResult(data: unknown, error: { message: string } | null = null) {
  const result = { data, error };
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    in: vi.fn(() => builder),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
    catch: (reject: (reason: unknown) => unknown) => Promise.resolve(result).catch(reject),
    finally: (callback: () => void) => Promise.resolve(result).finally(callback)
  };
  return builder;
}

describe("getStudentDashboardData", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    getCurrentStudentProfileMock.mockReset();
    getStudentSchedulePreviewByStudentIdMock.mockReset();
  });

  it("returns fallback when student profile is unavailable", async () => {
    getCurrentStudentProfileMock.mockResolvedValue(null);
    getStudentSchedulePreviewByStudentIdMock.mockResolvedValue({ nextLesson: null, upcomingLessons: [] });

    const result = await getStudentDashboardData();

    expect(result.lessonOfTheDay.title).toBe("Практика");
    expect(result.summaryStats[0].value).toBe("0 мин");
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
        updatedAt: null
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
          updatedAt: null
        }
      ]
    });
    createClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        switch (table) {
          case "student_lesson_progress":
            return makeQueryResult([
              {
                status: "in_progress",
                progress_percent: 40,
                updated_at: "2026-03-26T10:00:00.000Z",
                lesson_id: "lesson-1",
                lessons: { title: "Speaking basics", duration_minutes: 15, module_id: "module-1" }
              },
              {
                status: "completed",
                progress_percent: 80,
                updated_at: "2026-03-25T10:00:00.000Z",
                lesson_id: "lesson-2",
                lessons: { title: "Grammar", duration_minutes: 20, module_id: "module-2" }
              }
            ]);
          case "student_test_attempts":
            return makeQueryResult([
              { status: "passed", score: 91, created_at: "2026-03-20T10:00:00.000Z", submitted_at: "2026-03-20T10:10:00.000Z" },
              { status: "in_progress", score: 0, created_at: "2026-03-21T10:00:00.000Z", submitted_at: null }
            ]);
          case "student_course_enrollments":
            return makeQueryResult([{ status: "active", courses: { title: "English A2" } }]);
          case "homework_assignments":
            return makeQueryResult([{ id: "hw-1", title: "Homework 1", status: "overdue", due_at: "2026-03-27T10:00:00.000Z" }]);
          case "student_mistakes":
            return makeQueryResult([
              { mistake_count: 3, module_id: "module-1", test_id: null },
              { mistake_count: 2, module_id: "module-1", test_id: null }
            ]);
          case "student_words":
            return makeQueryResult([
              { id: "word-1", status: "learning" },
              { id: "word-2", status: "mastered" }
            ]);
          default:
            return makeQueryResult([]);
        }
      })
    });

    const result = await getStudentDashboardData();

    expect(result.lessonOfTheDay.title).toBe("Speaking basics");
    expect(result.lessonOfTheDay.progress).toBe(40);
    expect(result.progress.value).toBe(60);
    expect(result.heroStats).toEqual([
      { label: "Точность", value: "91%" },
      { label: "Попыток", value: "1" },
      { label: "Слов", value: "2" }
    ]);
    expect(result.homeworkCards[0]).toMatchObject({
      title: "Homework 1",
      status: "Просрочено",
      statusTone: "warning"
    });
    expect(result.recommendationCards).toHaveLength(1);
    expect(result.summaryStats[0].value).toBe("6 мин");
    expect(result.nextScheduledLesson?.title).toBe("Conversation club");
    expect(result.upcomingScheduleLessons).toHaveLength(1);
  });
});
