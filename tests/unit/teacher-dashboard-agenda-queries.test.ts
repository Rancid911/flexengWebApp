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

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn
  };
});

function makeQueryResult(data: unknown) {
  const result = { data, error: null };
  const builder = {
    select: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    in: vi.fn(() => builder),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
    catch: (reject: (reason: unknown) => unknown) => Promise.resolve(result).catch(reject),
    finally: (callback: () => void) => Promise.resolve(result).finally(callback)
  };
  return builder;
}

describe("teacher dashboard agenda queries", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    fromMock.mockReset();
    rpcMock.mockReset();
    createClientMock.mockResolvedValue({
      from: fromMock,
      rpc: rpcMock
    });
    fromMock.mockImplementation((table: string) => {
      if (table === "student_schedule_lessons") {
        return makeQueryResult([
          {
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
          }
        ]);
      }
      return makeQueryResult([]);
    });
    rpcMock.mockResolvedValue({
      data: [{ id: "student-1", label: "Student One" }],
      error: null
    });
  });

  it("loads teacher week bundle through the user-scoped server client", async () => {
    const { getTeacherDashboardWeekLessonBundle } = await import("@/lib/teacher-workspace/dashboard-agenda.queries");

    const bundle = await getTeacherDashboardWeekLessonBundle(createScheduleActor({
      role: "teacher",
      userId: "teacher-user-1",
      teacherId: "teacher-1",
      studentId: null,
      accessibleStudentIds: ["student-1"]
    }));

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith("student_schedule_lessons");
    expect(rpcMock).toHaveBeenCalledWith("get_schedule_student_options", {
      p_student_ids: ["student-1"]
    });
    expect(bundle.weekLessons).toEqual([
      expect.objectContaining({
        id: "lesson-1",
        studentName: "Student One",
        teacherName: "Вы",
        attendanceStatus: null,
        hasOutcome: false
      })
    ]);
  });
});
