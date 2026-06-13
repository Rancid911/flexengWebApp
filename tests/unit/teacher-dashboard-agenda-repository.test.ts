import { describe, expect, it, vi } from "vitest";

import { createTeacherDashboardAgendaRepository } from "@/lib/teacher-workspace/dashboard-agenda.repository";

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

describe("teacher dashboard agenda repository", () => {
  it("loads teacher-scoped week lessons through the injected client", async () => {
    const lessonQuery = makeQueryResult([]);
    const fromMock = vi.fn((table: string) => {
      expect(table).toBe("student_schedule_lessons");
      return lessonQuery;
    });
    const repository = createTeacherDashboardAgendaRepository({
      from: fromMock,
      rpc: vi.fn()
    } as never);

    await repository.loadWeekLessonRows({
      todayStartIso: "2026-05-19T00:00:00.000Z",
      weekEndIso: "2026-05-26T00:00:00.000Z",
      teacherId: "teacher-1"
    });

    expect(fromMock).toHaveBeenCalledWith("student_schedule_lessons");
    expect(lessonQuery.select).toHaveBeenCalledWith("id, student_id, teacher_id, title, starts_at, ends_at, meeting_url, comment, status, created_at, updated_at");
    expect(lessonQuery.eq).toHaveBeenCalledWith("teacher_id", "teacher-1");
  });

  it("loads attendance and outcome enrichment through the injected client", async () => {
    const fromMock = vi.fn((table: string) => makeQueryResult(table === "lesson_attendance" ? [{ schedule_lesson_id: "lesson-1", status: "completed" }] : [{ schedule_lesson_id: "lesson-1" }]));
    const repository = createTeacherDashboardAgendaRepository({
      from: fromMock,
      rpc: vi.fn()
    } as never);

    await repository.loadAttendanceByLessonIds(["lesson-1"]);
    await repository.loadOutcomePresenceByLessonIds(["lesson-1"]);

    expect(fromMock).toHaveBeenCalledWith("lesson_attendance");
    expect(fromMock).toHaveBeenCalledWith("lesson_outcomes");
  });
});
