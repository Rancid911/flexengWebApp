import { describe, expect, it, vi, beforeEach } from "vitest";

import { ScheduleHttpError } from "@/lib/schedule/http";

const requireScheduleApiMock = vi.fn();
const createTeacherStudentNoteMock = vi.fn();
const updateTeacherStudentNoteMock = vi.fn();
const deleteTeacherStudentNoteMock = vi.fn();
const upsertTeacherLessonFollowupMock = vi.fn();
const getTeacherLessonFollowupMock = vi.fn();
const listTeacherAssignableTestsMock = vi.fn();

vi.mock("@/lib/schedule/server", () => ({
  requireScheduleApi: () => requireScheduleApiMock()
}));

vi.mock("@/lib/teacher-workspace/queries", () => ({
  createTeacherStudentNote: (...args: unknown[]) => createTeacherStudentNoteMock(...args),
  deleteTeacherStudentNote: (...args: unknown[]) => deleteTeacherStudentNoteMock(...args),
  updateTeacherStudentNote: (...args: unknown[]) => updateTeacherStudentNoteMock(...args),
  upsertTeacherLessonFollowup: (...args: unknown[]) => upsertTeacherLessonFollowupMock(...args),
  getTeacherLessonFollowup: (...args: unknown[]) => getTeacherLessonFollowupMock(...args),
  listTeacherAssignableTests: (...args: unknown[]) => listTeacherAssignableTestsMock(...args)
}));

import { POST as createTeacherNote } from "@/app/api/students/[id]/teacher-notes/route";
import { DELETE as deleteTeacherNote, PATCH as patchTeacherNote } from "@/app/api/teacher-notes/[id]/route";
import { POST as postLessonOutcome, GET as getLessonOutcome } from "@/app/api/schedule/[id]/outcome/route";
import { POST as postLessonAttendance } from "@/app/api/schedule/[id]/attendance/route";
import { GET as getFollowupTestOptions } from "@/app/api/schedule/followup-test-options/route";

const teacherActor = {
  role: "teacher",
  userId: "teacher-1",
  teacherId: "teacher-1",
  studentId: null,
  accessibleStudentIds: ["student-1"],
  rbacRoles: ["teacher"],
  rbacPermissions: ["students.view", "schedule.view", "schedule.manage"],
  rbacPermissionScopes: {
    "students.view": ["assigned"],
    "schedule.view": ["assigned"],
    "schedule.manage": ["assigned"]
  }
};

const studentActor = {
  role: "student",
  userId: "student-user-1",
  studentId: "student-1",
  teacherId: null,
  accessibleStudentIds: null
};

const adminNotesActor = {
  role: "admin",
  userId: "admin-1",
  rbacRoles: ["admin"],
  rbacPermissions: ["students.manage"],
  rbacPermissionScopes: {
    "students.manage": ["all"]
  }
};

const managerScheduleReaderActor = {
  role: "manager",
  userId: "manager-1",
  rbacRoles: ["manager"],
  rbacPermissions: ["schedule.view"],
  rbacPermissionScopes: {
    "schedule.view": ["all"]
  }
};

const teacherWithoutScheduleGrant = {
  role: "teacher",
  userId: "teacher-1",
  teacherId: "teacher-1",
  studentId: null,
  accessibleStudentIds: ["student-1"],
  rbacRoles: ["teacher"],
  rbacPermissions: ["profile.view"],
  rbacPermissionScopes: {
    "profile.view": ["own"]
  }
};

const teacherWithAssignedStudentViewGrant = {
  role: "teacher",
  userId: "teacher-1",
  teacherId: "teacher-1",
  studentId: null,
  accessibleStudentIds: ["student-1"],
  rbacRoles: ["teacher"],
  rbacPermissions: ["students.view"],
  rbacPermissionScopes: {
    "students.view": ["assigned"]
  }
};

const teacherWithoutNotesGrant = {
  role: "teacher",
  userId: "teacher-1",
  teacherId: "teacher-1",
  studentId: null,
  accessibleStudentIds: ["student-1"],
  rbacRoles: ["teacher"],
  rbacPermissions: ["profile.view"],
  rbacPermissionScopes: {
    "profile.view": ["own"]
  }
};

function expectNoTeacherNoteServicesCalled() {
  expect(createTeacherStudentNoteMock).not.toHaveBeenCalled();
  expect(updateTeacherStudentNoteMock).not.toHaveBeenCalled();
  expect(deleteTeacherStudentNoteMock).not.toHaveBeenCalled();
}

function expectNoLessonFollowupServicesCalled() {
  expect(upsertTeacherLessonFollowupMock).not.toHaveBeenCalled();
  expect(getTeacherLessonFollowupMock).not.toHaveBeenCalled();
  expect(listTeacherAssignableTestsMock).not.toHaveBeenCalled();
}

describe("teacher workspace api routes", () => {
  beforeEach(() => {
    requireScheduleApiMock.mockReset();
    createTeacherStudentNoteMock.mockReset();
    updateTeacherStudentNoteMock.mockReset();
    deleteTeacherStudentNoteMock.mockReset();
    upsertTeacherLessonFollowupMock.mockReset();
    getTeacherLessonFollowupMock.mockReset();
    listTeacherAssignableTestsMock.mockReset();
  });

  it("creates a teacher note after permission check", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherActor);
    createTeacherStudentNoteMock.mockResolvedValue({ id: "note-1", body: "New note" });

    const response = await createTeacherNote(
      new Request("http://localhost/api/students/student-1/teacher-notes", {
        method: "POST",
        body: JSON.stringify({ body: "New note", visibility: "private" }),
        headers: { "Content-Type": "application/json" }
      }) as never,
      { params: Promise.resolve({ id: "student-1" }) }
    );

    expect(response.status).toBe(201);
    expect(createTeacherStudentNoteMock).toHaveBeenCalledWith(teacherActor, "student-1", {
      body: "New note",
      visibility: "private"
    });
    await expect(response.json()).resolves.toEqual({ id: "note-1", body: "New note" });
  });

  it("creates a teacher note for loaded RBAC teachers with assigned student grant", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherWithAssignedStudentViewGrant);
    createTeacherStudentNoteMock.mockResolvedValue({ id: "note-1", body: "New note" });

    const response = await createTeacherNote(
      new Request("http://localhost/api/students/student-1/teacher-notes", {
        method: "POST",
        body: JSON.stringify({ body: "New note", visibility: "private" }),
        headers: { "Content-Type": "application/json" }
      }) as never,
      { params: Promise.resolve({ id: "student-1" }) }
    );

    expect(response.status).toBe(201);
    expect(createTeacherStudentNoteMock).toHaveBeenCalledWith(teacherWithAssignedStudentViewGrant, "student-1", {
      body: "New note",
      visibility: "private"
    });
  });

  it("denies teacher note create for loaded RBAC teachers missing note grants before body parsing", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherWithoutNotesGrant);

    const response = await createTeacherNote(
      new Request("http://localhost/api/students/student-1/teacher-notes", {
        method: "POST",
        body: "not-json",
        headers: { "Content-Type": "application/json" }
      }) as never,
      { params: Promise.resolve({ id: "student-1" }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expectNoTeacherNoteServicesCalled();
  });

  it("denies teacher note create before body parsing and service calls", async () => {
    requireScheduleApiMock.mockResolvedValue(studentActor);

    const response = await createTeacherNote(
      new Request("http://localhost/api/students/student-1/teacher-notes", {
        method: "POST",
        body: "not-json",
        headers: { "Content-Type": "application/json" }
      }) as never,
      { params: Promise.resolve({ id: "student-1" }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expectNoTeacherNoteServicesCalled();
  });

  it("updates a teacher note after permission check", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherActor);
    updateTeacherStudentNoteMock.mockResolvedValue({ id: "note-1", body: "Updated note" });

    const response = await patchTeacherNote(
      new Request("http://localhost/api/teacher-notes/note-1", {
        method: "PATCH",
        body: JSON.stringify({ body: "Updated note", visibility: "private" }),
        headers: { "Content-Type": "application/json" }
      }) as never,
      { params: Promise.resolve({ id: "note-1" }) }
    );

    expect(response.status).toBe(200);
    expect(updateTeacherStudentNoteMock).toHaveBeenCalledWith(teacherActor, "note-1", {
      body: "Updated note",
      visibility: "private"
    });
    await expect(response.json()).resolves.toEqual({ id: "note-1", body: "Updated note" });
  });

  it("updates a teacher note for loaded RBAC teachers with assigned student grant", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherWithAssignedStudentViewGrant);
    updateTeacherStudentNoteMock.mockResolvedValue({ id: "note-1", body: "Updated note" });

    const response = await patchTeacherNote(
      new Request("http://localhost/api/teacher-notes/note-1", {
        method: "PATCH",
        body: JSON.stringify({ body: "Updated note", visibility: "private" }),
        headers: { "Content-Type": "application/json" }
      }) as never,
      { params: Promise.resolve({ id: "note-1" }) }
    );

    expect(response.status).toBe(200);
    expect(updateTeacherStudentNoteMock).toHaveBeenCalledWith(teacherWithAssignedStudentViewGrant, "note-1", {
      body: "Updated note",
      visibility: "private"
    });
  });

  it("denies teacher note patch for loaded RBAC teachers missing note grants before body parsing", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherWithoutNotesGrant);

    const response = await patchTeacherNote(
      new Request("http://localhost/api/teacher-notes/note-1", {
        method: "PATCH",
        body: "not-json",
        headers: { "Content-Type": "application/json" }
      }) as never,
      { params: Promise.resolve({ id: "note-1" }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expectNoTeacherNoteServicesCalled();
  });

  it("denies teacher note patch before body parsing and service calls", async () => {
    requireScheduleApiMock.mockResolvedValue(studentActor);

    const response = await patchTeacherNote(
      new Request("http://localhost/api/teacher-notes/note-1", {
        method: "PATCH",
        body: "not-json",
        headers: { "Content-Type": "application/json" }
      }) as never,
      { params: Promise.resolve({ id: "note-1" }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expectNoTeacherNoteServicesCalled();
  });

  it("returns forbidden for teacher note patch when query layer rejects out-of-scope write", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherWithAssignedStudentViewGrant);
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
    const actor = adminNotesActor;
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

  it("deletes a teacher note for loaded RBAC teachers with assigned student grant", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherWithAssignedStudentViewGrant);
    deleteTeacherStudentNoteMock.mockResolvedValue({ id: "note-1" });

    const response = await deleteTeacherNote(
      new Request("http://localhost/api/teacher-notes/note-1", { method: "DELETE" }) as never,
      { params: Promise.resolve({ id: "note-1" }) }
    );

    expect(response.status).toBe(200);
    expect(deleteTeacherStudentNoteMock).toHaveBeenCalledWith(teacherWithAssignedStudentViewGrant, "note-1");
  });

  it("denies teacher note delete for loaded RBAC teachers missing note grants before service calls", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherWithoutNotesGrant);

    const response = await deleteTeacherNote(
      new Request("http://localhost/api/teacher-notes/note-1", { method: "DELETE" }) as never,
      { params: Promise.resolve({ id: "note-1" }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expectNoTeacherNoteServicesCalled();
  });

  it("denies teacher note delete before service calls", async () => {
    requireScheduleApiMock.mockResolvedValue(studentActor);

    const response = await deleteTeacherNote(
      new Request("http://localhost/api/teacher-notes/note-1", { method: "DELETE" }) as never,
      { params: Promise.resolve({ id: "note-1" }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expectNoTeacherNoteServicesCalled();
  });

  it("returns query-layer errors for teacher note delete", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherWithAssignedStudentViewGrant);
    deleteTeacherStudentNoteMock.mockRejectedValue(new ScheduleHttpError(404, "TEACHER_NOTE_NOT_FOUND", "Teacher note not found"));

    const response = await deleteTeacherNote(
      new Request("http://localhost/api/teacher-notes/note-1", { method: "DELETE" }) as never,
      { params: Promise.resolve({ id: "note-1" }) }
    );

    expect(response.status).toBe(404);
  });

  it("returns forbidden for outcome save when query layer rejects teacher scope", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherActor);
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

  it("denies outcome save before body parsing and service calls", async () => {
    requireScheduleApiMock.mockResolvedValue(studentActor);

    const response = await postLessonOutcome(
      new Request("http://localhost/api/schedule/lesson-1/outcome", {
        method: "POST",
        body: "not-json",
        headers: { "Content-Type": "application/json" }
      }) as never,
      { params: Promise.resolve({ id: "lesson-1" }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expectNoLessonFollowupServicesCalled();
  });

  it("denies outcome save before body parsing when loaded RBAC lacks schedule manage", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherWithoutScheduleGrant);

    const response = await postLessonOutcome(
      new Request("http://localhost/api/schedule/lesson-1/outcome", {
        method: "POST",
        body: "not-json",
        headers: { "Content-Type": "application/json" }
      }) as never,
      { params: Promise.resolve({ id: "lesson-1" }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expectNoLessonFollowupServicesCalled();
  });

  it("returns forbidden for attendance save when query layer rejects mismatched teacher lesson", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherActor);
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

  it("denies attendance save before body parsing and service calls", async () => {
    requireScheduleApiMock.mockResolvedValue(studentActor);

    const response = await postLessonAttendance(
      new Request("http://localhost/api/schedule/lesson-1/attendance", {
        method: "POST",
        body: "not-json",
        headers: { "Content-Type": "application/json" }
      }) as never,
      { params: Promise.resolve({ id: "lesson-1" }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expectNoLessonFollowupServicesCalled();
  });

  it("denies attendance save before body parsing when loaded RBAC lacks schedule manage", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherWithoutScheduleGrant);

    const response = await postLessonAttendance(
      new Request("http://localhost/api/schedule/lesson-1/attendance", {
        method: "POST",
        body: "not-json",
        headers: { "Content-Type": "application/json" }
      }) as never,
      { params: Promise.resolve({ id: "lesson-1" }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expectNoLessonFollowupServicesCalled();
  });

  it("keeps reader path available for follow-up GET", async () => {
    requireScheduleApiMock.mockResolvedValue(managerScheduleReaderActor);
    getTeacherLessonFollowupMock.mockResolvedValue({ attendance: null, outcome: null });

    const response = await getLessonOutcome(
      new Request("http://localhost/api/schedule/lesson-1/outcome", { method: "GET" }) as never,
      { params: Promise.resolve({ id: "lesson-1" }) }
    );

    expect(response.status).toBe(200);
    expect(getTeacherLessonFollowupMock).toHaveBeenCalledWith(expect.objectContaining({ role: "manager" }), "lesson-1");
  });

  it("denies follow-up GET for student actors before service calls", async () => {
    requireScheduleApiMock.mockResolvedValue(studentActor);

    const response = await getLessonOutcome(
      new Request("http://localhost/api/schedule/lesson-1/outcome", { method: "GET" }) as never,
      { params: Promise.resolve({ id: "lesson-1" }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expectNoLessonFollowupServicesCalled();
  });

  it("denies follow-up GET before service calls when loaded RBAC lacks schedule view", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherWithoutScheduleGrant);

    const response = await getLessonOutcome(
      new Request("http://localhost/api/schedule/lesson-1/outcome", { method: "GET" }) as never,
      { params: Promise.resolve({ id: "lesson-1" }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expectNoLessonFollowupServicesCalled();
  });

  it("lists follow-up test options after manage permission check", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherActor);
    listTeacherAssignableTestsMock.mockResolvedValue([{ id: "test-1", title: "Placement" }]);

    const response = await getFollowupTestOptions(
      new Request("http://localhost/api/schedule/followup-test-options?studentId=student-1&includeAllLevels=1") as never
    );

    expect(response.status).toBe(200);
    expect(listTeacherAssignableTestsMock).toHaveBeenCalledWith(teacherActor, "student-1", { includeAllLevels: true });
    await expect(response.json()).resolves.toEqual([{ id: "test-1", title: "Placement" }]);
  });

  it("denies follow-up test options before studentId validation and service calls", async () => {
    requireScheduleApiMock.mockResolvedValue(studentActor);

    const response = await getFollowupTestOptions(new Request("http://localhost/api/schedule/followup-test-options") as never);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expectNoLessonFollowupServicesCalled();
  });

  it("denies follow-up test options before validation when loaded RBAC lacks schedule manage", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherWithoutScheduleGrant);

    const response = await getFollowupTestOptions(new Request("http://localhost/api/schedule/followup-test-options") as never);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expectNoLessonFollowupServicesCalled();
  });
});
