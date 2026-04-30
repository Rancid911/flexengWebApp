import { describe, expect, it, vi, beforeEach } from "vitest";

import { ScheduleHttpError } from "@/lib/schedule/http";

const requireScheduleApiMock = vi.fn();
const updateTeacherStudentNoteMock = vi.fn();
const deleteTeacherStudentNoteMock = vi.fn();
const upsertTeacherLessonFollowupMock = vi.fn();
const getTeacherLessonFollowupMock = vi.fn();

vi.mock("@/lib/schedule/server", () => ({
  requireScheduleApi: () => requireScheduleApiMock()
}));

vi.mock("@/lib/teacher-workspace/queries", () => ({
  deleteTeacherStudentNote: (...args: unknown[]) => deleteTeacherStudentNoteMock(...args),
  updateTeacherStudentNote: (...args: unknown[]) => updateTeacherStudentNoteMock(...args),
  upsertTeacherLessonFollowup: (...args: unknown[]) => upsertTeacherLessonFollowupMock(...args),
  getTeacherLessonFollowup: (...args: unknown[]) => getTeacherLessonFollowupMock(...args)
}));

import { DELETE as deleteTeacherNote, PATCH as patchTeacherNote } from "@/app/api/teacher-notes/[id]/route";
import { POST as postLessonOutcome, GET as getLessonOutcome } from "@/app/api/schedule/[id]/outcome/route";
import { POST as postLessonAttendance } from "@/app/api/schedule/[id]/attendance/route";

describe("teacher workspace api routes", () => {
  beforeEach(() => {
    requireScheduleApiMock.mockReset();
    updateTeacherStudentNoteMock.mockReset();
    deleteTeacherStudentNoteMock.mockReset();
    upsertTeacherLessonFollowupMock.mockReset();
    getTeacherLessonFollowupMock.mockReset();
  });

  it("returns forbidden for teacher note patch when query layer rejects out-of-scope write", async () => {
    requireScheduleApiMock.mockResolvedValue({ role: "teacher", userId: "teacher-1" });
    updateTeacherStudentNoteMock.mockRejectedValue(new ScheduleHttpError(403, "FORBIDDEN", "Teacher write capability required"));

    const response = await patchTeacherNote(
      new Request("http://localhost/api/teacher-notes/note-1", {
        method: "PATCH",
        body: JSON.stringify({ body: "Updated note", visibility: "private" }),
        headers: { "Content-Type": "application/json" }
      }) as never,
      { params: Promise.resolve({ id: "note-1" }) }
    );

    expect(response.status).toBe(403);
  });

  it("deletes a teacher note through the route", async () => {
    const actor = { role: "admin", userId: "admin-1" };
    requireScheduleApiMock.mockResolvedValue(actor);
    deleteTeacherStudentNoteMock.mockResolvedValue({ id: "note-1" });

    const response = await deleteTeacherNote(
      new Request("http://localhost/api/teacher-notes/note-1", { method: "DELETE" }) as never,
      { params: Promise.resolve({ id: "note-1" }) }
    );

    expect(response.status).toBe(200);
    expect(deleteTeacherStudentNoteMock).toHaveBeenCalledWith(actor, "note-1");
    await expect(response.json()).resolves.toEqual({ id: "note-1" });
  });

  it("returns query-layer errors for teacher note delete", async () => {
    requireScheduleApiMock.mockResolvedValue({ role: "teacher", userId: "teacher-1" });
    deleteTeacherStudentNoteMock.mockRejectedValue(new ScheduleHttpError(404, "TEACHER_NOTE_NOT_FOUND", "Teacher note not found"));

    const response = await deleteTeacherNote(
      new Request("http://localhost/api/teacher-notes/note-1", { method: "DELETE" }) as never,
      { params: Promise.resolve({ id: "note-1" }) }
    );

    expect(response.status).toBe(404);
  });

  it("returns forbidden for outcome save when query layer rejects teacher scope", async () => {
    requireScheduleApiMock.mockResolvedValue({ role: "teacher", userId: "teacher-1" });
    upsertTeacherLessonFollowupMock.mockRejectedValue(new ScheduleHttpError(403, "FORBIDDEN", "Teacher write capability required"));

    const response = await postLessonOutcome(
      new Request("http://localhost/api/schedule/lesson-1/outcome", {
        method: "POST",
        body: JSON.stringify({
          attendanceStatus: "completed",
          summary: "Summary",
          coveredTopics: null,
          mistakesSummary: null,
          nextSteps: null,
          visibleToStudent: true
        }),
        headers: { "Content-Type": "application/json" }
      }) as never,
      { params: Promise.resolve({ id: "lesson-1" }) }
    );

    expect(response.status).toBe(403);
  });

  it("returns forbidden for attendance save when query layer rejects mismatched teacher lesson", async () => {
    requireScheduleApiMock.mockResolvedValue({ role: "teacher", userId: "teacher-1" });
    upsertTeacherLessonFollowupMock.mockRejectedValue(new ScheduleHttpError(403, "FORBIDDEN", "Teacher write capability required"));

    const response = await postLessonAttendance(
      new Request("http://localhost/api/schedule/lesson-1/attendance", {
        method: "POST",
        body: JSON.stringify({ attendanceStatus: "completed", summary: "Summary" }),
        headers: { "Content-Type": "application/json" }
      }) as never,
      { params: Promise.resolve({ id: "lesson-1" }) }
    );

    expect(response.status).toBe(403);
  });

  it("keeps reader path available for follow-up GET", async () => {
    requireScheduleApiMock.mockResolvedValue({ role: "manager", userId: "manager-1" });
    getTeacherLessonFollowupMock.mockResolvedValue({ attendance: null, outcome: null });

    const response = await getLessonOutcome(
      new Request("http://localhost/api/schedule/lesson-1/outcome", { method: "GET" }) as never,
      { params: Promise.resolve({ id: "lesson-1" }) }
    );

    expect(response.status).toBe(200);
  });
});
