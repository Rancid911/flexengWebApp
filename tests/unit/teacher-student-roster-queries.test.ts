import { beforeEach, describe, expect, it, vi } from "vitest";

import { createScheduleActor } from "@/tests/unit/helpers/actors";

const createClientMock = vi.fn();
const fromMock = vi.fn();
const rpcMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
}));

vi.mock("@/lib/server/timing", () => ({
  measureServerTiming: async (_label: string, callback: () => Promise<unknown>) => callback()
}));

function makeQueryResult(data: unknown) {
  const result = { data, error: null };
  const builder = {
    select: vi.fn(() => builder),
    in: vi.fn(() => builder),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
    catch: (reject: (reason: unknown) => unknown) => Promise.resolve(result).catch(reject),
    finally: (callback: () => void) => Promise.resolve(result).finally(callback)
  };
  return builder;
}

describe("teacher student roster queries", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    fromMock.mockReset();
    rpcMock.mockReset();
    createClientMock.mockResolvedValue({
      from: fromMock,
      rpc: rpcMock
    });
  });

  it("loads dashboard roster from the teacher accessible student scope", async () => {
    const studentsQuery = makeQueryResult([
      {
        id: "student-1",
        profile_id: "profile-1",
        english_level: "A2",
        target_level: "B1",
        learning_goal: null
      }
    ]);
    fromMock.mockReturnValue(studentsQuery);
    rpcMock.mockImplementation(async (fn: string) => {
      if (fn === "get_teacher_student_profile_summaries") {
        return {
          data: [
            {
              student_id: "student-1",
              profile_id: "profile-1",
              display_name: "Student One",
              first_name: null,
              last_name: null,
              email: "student@example.com",
              phone: null
            }
          ],
          error: null
        };
      }

      if (fn === "get_teacher_roster_active_homework_counts") {
        return {
          data: [{ student_id: "student-1", active_homework_count: 2 }],
          error: null
        };
      }

      return { data: [], error: null };
    });

    const { getTeacherDashboardStudentRosterSummary } = await import("@/lib/teacher-workspace/student-roster.queries");
    const result = await getTeacherDashboardStudentRosterSummary(
      createScheduleActor({
        teacherId: "teacher-1",
        accessibleStudentIds: ["student-1"]
      }),
      {
        weekLessons: [
          {
            id: "lesson-1",
            studentId: "student-1",
            studentName: "Student One",
            teacherId: "teacher-1",
            teacherName: "Teacher One",
            title: "Lesson",
            startsAt: "2026-05-19T10:00:00.000Z",
            endsAt: "2026-05-19T11:00:00.000Z",
            meetingUrl: null,
            comment: null,
            status: "scheduled",
            createdAt: null,
            updatedAt: null,
            attendanceStatus: null,
            hasOutcome: false,
            studentVisibleOutcome: null
          }
        ]
      }
    );

    expect(fromMock).toHaveBeenCalledWith("students");
    expect(studentsQuery.in).toHaveBeenCalledWith("id", ["student-1"]);
    expect(rpcMock).toHaveBeenCalledWith("get_teacher_roster_active_homework_counts", {
      p_student_ids: ["student-1"]
    });
    expect(result).toEqual([
      expect.objectContaining({
        studentId: "student-1",
        studentName: "Student One",
        nextLessonAt: "2026-05-19T10:00:00.000Z",
        activeHomeworkCount: 2
      })
    ]);
  });

  it("does not expand roster from week lessons when teacher scope is empty", async () => {
    const { getTeacherDashboardStudentRosterSummary } = await import("@/lib/teacher-workspace/student-roster.queries");
    const result = await getTeacherDashboardStudentRosterSummary(
      createScheduleActor({
        teacherId: "teacher-1",
        accessibleStudentIds: []
      }),
      {
        weekLessons: [
          {
            id: "lesson-1",
            studentId: "student-from-lesson",
            studentName: "Lesson Student",
            teacherId: "teacher-1",
            teacherName: "Teacher One",
            title: "Lesson",
            startsAt: "2026-05-19T10:00:00.000Z",
            endsAt: "2026-05-19T11:00:00.000Z",
            meetingUrl: null,
            comment: null,
            status: "scheduled",
            createdAt: null,
            updatedAt: null,
            attendanceStatus: null,
            hasOutcome: false,
            studentVisibleOutcome: null
          }
        ]
      }
    );

    expect(result).toEqual([]);
    expect(createClientMock).not.toHaveBeenCalled();
  });
});
