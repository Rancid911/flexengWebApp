import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireScheduleApiMock = vi.fn();
const createScheduleLessonMock = vi.fn();
const updateScheduleLessonMock = vi.fn();
const cancelScheduleLessonMock = vi.fn();
const getSchedulePageDataWithFollowupMock = vi.fn();
const getSchedulePageDataInternalMock = vi.fn();
const getScheduleFilterCatalogMock = vi.fn();

vi.mock("@/lib/schedule/server", () => ({
  requireScheduleApi: () => requireScheduleApiMock()
}));

vi.mock("@/lib/schedule/queries", () => ({
  createScheduleLesson: (...args: unknown[]) => createScheduleLessonMock(...args),
  updateScheduleLesson: (...args: unknown[]) => updateScheduleLessonMock(...args),
  cancelScheduleLesson: (...args: unknown[]) => cancelScheduleLessonMock(...args),
  getSchedulePageDataWithFollowup: (...args: unknown[]) => getSchedulePageDataWithFollowupMock(...args),
  getSchedulePageDataInternal: (...args: unknown[]) => getSchedulePageDataInternalMock(...args),
  getScheduleFilterCatalog: (...args: unknown[]) => getScheduleFilterCatalogMock(...args)
}));

import { GET as getScheduleLessons, POST as createScheduleLesson } from "@/app/api/schedule/route";
import { DELETE as deleteScheduleLesson, PATCH as patchScheduleLesson } from "@/app/api/schedule/[id]/route";
import { GET as getScheduleOptions } from "@/app/api/schedule/options/route";

const teacherActor = {
  role: "teacher",
  accessMode: "teacher_assigned",
  userId: "teacher-profile-1",
  teacherId: "teacher-1",
  studentId: null,
  accessibleStudentIds: ["student-1"],
  rbacStatus: "loaded",
  rbacPermissions: ["schedule.view", "schedule.manage"],
  rbacPermissionScopes: {
    "schedule.view": ["assigned"],
    "schedule.manage": ["assigned"]
  }
};

const studentActor = {
  role: "student",
  accessMode: "student_own",
  userId: "student-profile-1",
  studentId: "student-1",
  teacherId: null,
  accessibleStudentIds: null,
  rbacStatus: "loaded",
  rbacPermissions: ["schedule.view"],
  rbacPermissionScopes: {
    "schedule.view": ["own"]
  }
};

const deniedActor = {
  role: null,
  accessMode: "staff_all",
  userId: "profile-without-workspace",
  studentId: null,
  teacherId: null,
  accessibleStudentIds: null
};

const lessonPayload = {
  studentId: "student-1",
  teacherId: "teacher-1",
  title: "Conversation practice",
  startsAt: "2026-03-27T10:00:00.000Z",
  endsAt: "2026-03-27T11:00:00.000Z"
};

function expectNoScheduleLessonServicesCalled() {
  expect(createScheduleLessonMock).not.toHaveBeenCalled();
  expect(updateScheduleLessonMock).not.toHaveBeenCalled();
  expect(cancelScheduleLessonMock).not.toHaveBeenCalled();
}

function expectNoScheduleReadServicesCalled() {
  expect(getSchedulePageDataWithFollowupMock).not.toHaveBeenCalled();
  expect(getSchedulePageDataInternalMock).not.toHaveBeenCalled();
  expect(getScheduleFilterCatalogMock).not.toHaveBeenCalled();
}

describe("schedule mutation API routes", () => {
  beforeEach(() => {
    requireScheduleApiMock.mockReset();
    createScheduleLessonMock.mockReset();
    updateScheduleLessonMock.mockReset();
    cancelScheduleLessonMock.mockReset();
    getSchedulePageDataWithFollowupMock.mockReset();
    getSchedulePageDataInternalMock.mockReset();
    getScheduleFilterCatalogMock.mockReset();
  });

  it("lists schedule lessons after read permission check", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherActor);
    getSchedulePageDataInternalMock.mockResolvedValue({ role: "teacher", lessons: [] });

    const response = await getScheduleLessons(new NextRequest("http://localhost/api/schedule?status=scheduled"));

    expect(response.status).toBe(200);
    expect(getSchedulePageDataInternalMock).toHaveBeenCalledWith(teacherActor, expect.objectContaining({ status: "scheduled" }), { includeFollowup: false });
    expect(getSchedulePageDataWithFollowupMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ role: "teacher", lessons: [] });
  });

  it("lists schedule lessons with follow-up enrichment after read permission check", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherActor);
    getSchedulePageDataWithFollowupMock.mockResolvedValue({ role: "teacher", lessons: [{ id: "lesson-1" }] });

    const response = await getScheduleLessons(new NextRequest("http://localhost/api/schedule?includeFollowup=1"));

    expect(response.status).toBe(200);
    expect(getSchedulePageDataWithFollowupMock).toHaveBeenCalledWith(teacherActor, expect.objectContaining({}));
    expect(getSchedulePageDataInternalMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ role: "teacher", lessons: [{ id: "lesson-1" }] });
  });

  it("returns validation errors before schedule list service calls for readers", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherActor);

    const response = await getScheduleLessons(new NextRequest("http://localhost/api/schedule?status=unknown"));

    expect(response.status).toBe(400);
    expectNoScheduleReadServicesCalled();
  });

  it("denies schedule lesson list before filter parsing and service calls", async () => {
    requireScheduleApiMock.mockResolvedValue(deniedActor);

    const response = await getScheduleLessons(new NextRequest("http://localhost/api/schedule?status=unknown"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expectNoScheduleReadServicesCalled();
  });

  it("loads schedule filter catalog after read permission check", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherActor);
    getScheduleFilterCatalogMock.mockResolvedValue({ students: [], teachers: [] });

    const response = await getScheduleOptions(new NextRequest("http://localhost/api/schedule/options?entity=students&limit=50"));

    expect(response.status).toBe(200);
    expect(getScheduleFilterCatalogMock).toHaveBeenCalledWith(teacherActor, { entity: "students", search: null, limit: 50 });
    await expect(response.json()).resolves.toEqual({ students: [], teachers: [] });
  });

  it("denies schedule filter catalog before catalog service calls", async () => {
    requireScheduleApiMock.mockResolvedValue(deniedActor);

    const response = await getScheduleOptions(new NextRequest("http://localhost/api/schedule/options?entity=students&limit=50"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expectNoScheduleReadServicesCalled();
  });

  it("creates schedule lessons after permission check", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherActor);
    createScheduleLessonMock.mockResolvedValue({ id: "lesson-1" });

    const response = await createScheduleLesson(
      new Request("http://localhost/api/schedule", {
        method: "POST",
        body: JSON.stringify(lessonPayload),
        headers: { "Content-Type": "application/json" }
      }) as never
    );

    expect(response.status).toBe(201);
    expect(createScheduleLessonMock).toHaveBeenCalledWith(teacherActor, expect.objectContaining(lessonPayload));
    await expect(response.json()).resolves.toEqual({ id: "lesson-1" });
  });

  it("denies schedule lesson create before body parsing and service calls", async () => {
    requireScheduleApiMock.mockResolvedValue(studentActor);

    const response = await createScheduleLesson(
      new Request("http://localhost/api/schedule", {
        method: "POST",
        body: "not-json",
        headers: { "Content-Type": "application/json" }
      }) as never
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expectNoScheduleLessonServicesCalled();
  });

  it("updates schedule lessons after permission check", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherActor);
    updateScheduleLessonMock.mockResolvedValue({ id: "lesson-1", title: "Updated lesson" });

    const response = await patchScheduleLesson(
      new Request("http://localhost/api/schedule/lesson-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated lesson" }),
        headers: { "Content-Type": "application/json" }
      }) as never,
      { params: Promise.resolve({ id: "lesson-1" }) }
    );

    expect(response.status).toBe(200);
    expect(updateScheduleLessonMock).toHaveBeenCalledWith(teacherActor, "lesson-1", { title: "Updated lesson" });
    await expect(response.json()).resolves.toEqual({ id: "lesson-1", title: "Updated lesson" });
  });

  it("denies schedule lesson update before body parsing and service calls", async () => {
    requireScheduleApiMock.mockResolvedValue(studentActor);

    const response = await patchScheduleLesson(
      new Request("http://localhost/api/schedule/lesson-1", {
        method: "PATCH",
        body: "not-json",
        headers: { "Content-Type": "application/json" }
      }) as never,
      { params: Promise.resolve({ id: "lesson-1" }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expectNoScheduleLessonServicesCalled();
  });

  it("cancels schedule lessons after permission check", async () => {
    requireScheduleApiMock.mockResolvedValue(teacherActor);
    cancelScheduleLessonMock.mockResolvedValue({ id: "lesson-1", status: "canceled" });

    const response = await deleteScheduleLesson(
      new Request("http://localhost/api/schedule/lesson-1", { method: "DELETE" }) as never,
      { params: Promise.resolve({ id: "lesson-1" }) }
    );

    expect(response.status).toBe(200);
    expect(cancelScheduleLessonMock).toHaveBeenCalledWith(teacherActor, "lesson-1");
    await expect(response.json()).resolves.toEqual({ id: "lesson-1", status: "canceled" });
  });

  it("denies schedule lesson cancellation before service calls", async () => {
    requireScheduleApiMock.mockResolvedValue(studentActor);

    const response = await deleteScheduleLesson(
      new Request("http://localhost/api/schedule/lesson-1", { method: "DELETE" }) as never,
      { params: Promise.resolve({ id: "lesson-1" }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN", message: "Permission denied" });
    expectNoScheduleLessonServicesCalled();
  });
});
