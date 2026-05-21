import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const userFromMock = vi.fn();
const adminFromMock = vi.fn();
const applyCompletedLessonChargeMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock()
}));

vi.mock("@/lib/billing/server", () => ({
  applyCompletedLessonCharge: (...args: unknown[]) => applyCompletedLessonChargeMock(...args)
}));

function makeQueryResult(data: unknown) {
  const result = { data, error: null };
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
    upsert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
    catch: (reject: (reason: unknown) => unknown) => Promise.resolve(result).catch(reject),
    finally: (callback: () => void) => Promise.resolve(result).finally(callback)
  };
  return builder;
}

const lessonRow = {
  id: "lesson-1",
  student_id: "student-1",
  teacher_id: "teacher-1",
  title: "Lesson",
  starts_at: "2026-05-19T10:00:00.000Z",
  ends_at: "2026-05-19T11:00:00.000Z",
  meeting_url: null,
  comment: null,
  status: "scheduled",
  created_at: "2026-05-18T10:00:00.000Z",
  updated_at: "2026-05-18T10:00:00.000Z"
};

function makeFromMock() {
  return vi.fn((table: string) => {
    switch (table) {
      case "student_schedule_lessons":
        return makeQueryResult(lessonRow);
      case "lesson_attendance":
        return makeQueryResult({
          id: "attendance-1",
          schedule_lesson_id: "lesson-1",
          student_id: "student-1",
          teacher_id: "teacher-1",
          status: "completed",
          marked_at: "2026-05-19T11:05:00.000Z",
          created_at: null,
          updated_at: null
        });
      case "lesson_outcomes":
        return makeQueryResult({
          id: "outcome-1",
          schedule_lesson_id: "lesson-1",
          student_id: "student-1",
          teacher_id: "teacher-1",
          summary: "Covered past simple",
          covered_topics: null,
          mistakes_summary: null,
          next_steps: null,
          visible_to_student: true,
          created_at: null,
          updated_at: null
        });
      case "homework_assignments":
        return makeQueryResult(null);
      case "students":
        return makeQueryResult({ english_level: "A2" });
      case "tests":
        return makeQueryResult([
          {
            id: "test-1",
            title: "A2 Practice",
            activity_type: "test",
            assessment_kind: "regular",
            cefr_level: "A2",
            drill_topic_key: null,
            drill_kind: null,
            lesson_reinforcement: false
          },
          {
            id: "test-2",
            title: "B1 Practice",
            activity_type: "test",
            assessment_kind: "regular",
            cefr_level: "B1",
            drill_topic_key: null,
            drill_kind: null,
            lesson_reinforcement: false
          }
        ]);
      default:
        throw new Error(`Unexpected table ${table}`);
    }
  });
}

describe("teacher lesson follow-up service", () => {
  beforeEach(() => {
    userFromMock.mockReset();
    adminFromMock.mockReset();
    createClientMock.mockReset();
    createAdminClientMock.mockReset();
    applyCompletedLessonChargeMock.mockReset();

    userFromMock.mockImplementation(makeFromMock());
    adminFromMock.mockImplementation(makeFromMock());
    createClientMock.mockResolvedValue({ from: userFromMock });
    createAdminClientMock.mockReturnValue({ from: adminFromMock });
    applyCompletedLessonChargeMock.mockResolvedValue(undefined);
  });

  it("loads follow-up read data through the user-scoped client", async () => {
    const { getTeacherLessonFollowup } = await import("@/lib/teacher-workspace/lesson-followup.service");

    const result = await getTeacherLessonFollowup(
      { role: "teacher", userId: "teacher-user-1", teacherId: "teacher-1", studentId: null, accessibleStudentIds: ["student-1"] },
      "lesson-1"
    );

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createAdminClientMock).not.toHaveBeenCalled();
    expect(userFromMock).toHaveBeenCalledWith("student_schedule_lessons");
    expect(userFromMock).toHaveBeenCalledWith("lesson_attendance");
    expect(userFromMock).toHaveBeenCalledWith("lesson_outcomes");
    expect(result.attendance?.status).toBe("completed");
    expect(result.outcome?.summary).toBe("Covered past simple");
  });

  it("loads assignable test options through the user-scoped client", async () => {
    const { listTeacherAssignableTests } = await import("@/lib/teacher-workspace/lesson-followup.service");

    const result = await listTeacherAssignableTests(
      { role: "teacher", userId: "teacher-user-1", teacherId: "teacher-1", studentId: null, accessibleStudentIds: ["student-1"] },
      "student-1"
    );

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createAdminClientMock).not.toHaveBeenCalled();
    expect(result).toEqual([
      expect.objectContaining({
        id: "test-1",
        title: "A2 Practice",
        cefrLevel: "A2"
      })
    ]);
  });

  it("uses the user-scoped client for follow-up writes", async () => {
    const { upsertTeacherLessonFollowup } = await import("@/lib/teacher-workspace/lesson-followup.service");

    await upsertTeacherLessonFollowup(
      { role: "teacher", userId: "teacher-user-1", teacherId: "teacher-1", studentId: null, accessibleStudentIds: ["student-1"] },
      "lesson-1",
      {
        attendanceStatus: "canceled",
        summary: "Canceled by request",
        visibleToStudent: true
      }
    );

    expect(createAdminClientMock).not.toHaveBeenCalled();
    expect(createClientMock).toHaveBeenCalledTimes(2);
    expect(userFromMock).toHaveBeenCalledWith("lesson_attendance");
    expect(userFromMock).toHaveBeenCalledWith("lesson_outcomes");
    expect(userFromMock).toHaveBeenCalledWith("student_schedule_lessons");
  });

  it("passes the user-scoped client into lesson charge when attendance is completed", async () => {
    const userClient = { from: userFromMock };
    createClientMock.mockResolvedValue(userClient);
    const { upsertTeacherLessonFollowup } = await import("@/lib/teacher-workspace/lesson-followup.service");

    await upsertTeacherLessonFollowup(
      { role: "teacher", userId: "teacher-user-1", teacherId: "teacher-1", studentId: null, accessibleStudentIds: ["student-1"] },
      "lesson-1",
      {
        attendanceStatus: "completed",
        summary: "Completed lesson",
        visibleToStudent: true
      }
    );

    expect(createAdminClientMock).not.toHaveBeenCalled();
    expect(applyCompletedLessonChargeMock).toHaveBeenCalledWith("lesson-1", "teacher-user-1", userClient);
  });
});
