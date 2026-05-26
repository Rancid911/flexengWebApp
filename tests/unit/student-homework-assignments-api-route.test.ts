import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const listTeacherStudentStandaloneHomeworkMock = vi.fn();
const createTeacherStudentStandaloneHomeworkMock = vi.fn();
const requireScheduleApiMock = vi.hoisted(() =>
  vi.fn(async () => ({
    userId: "teacher-profile",
    role: "teacher",
    accessMode: "teacher_assigned",
    studentId: null,
    teacherId: "teacher-1",
    accessibleStudentIds: ["student-1"],
    rbacStatus: "loaded",
    rbacRoles: ["teacher"],
    rbacPermissions: ["homework.assign"],
    rbacPermissionScopes: { "homework.assign": ["assigned"] }
  }))
);

vi.mock("@/lib/schedule/server", () => ({
  requireScheduleApi: () => requireScheduleApiMock()
}));

vi.mock("@/lib/teacher-workspace/queries", () => ({
  listTeacherStudentStandaloneHomework: (...args: unknown[]) => listTeacherStudentStandaloneHomeworkMock(...args),
  createTeacherStudentStandaloneHomework: (...args: unknown[]) => createTeacherStudentStandaloneHomeworkMock(...args)
}));

describe("/api/students/[id]/homework-assignments", () => {
  beforeEach(() => {
    requireScheduleApiMock.mockReset();
    requireScheduleApiMock.mockResolvedValue({
      userId: "teacher-profile",
      role: "teacher",
      accessMode: "teacher_assigned",
      studentId: null,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacStatus: "loaded",
      rbacRoles: ["teacher"],
      rbacPermissions: ["homework.assign"],
      rbacPermissionScopes: { "homework.assign": ["assigned"] }
    });
    listTeacherStudentStandaloneHomeworkMock.mockReset();
    createTeacherStudentStandaloneHomeworkMock.mockReset();
  });

  it("returns standalone homework summary for a student", async () => {
    listTeacherStudentStandaloneHomeworkMock.mockResolvedValue({
      assignments: []
    });

    const { GET } = await import("@/app/api/students/[id]/homework-assignments/route");
    const response = await GET(
      new NextRequest("http://localhost/api/students/student-1/homework-assignments", { method: "GET" }),
      { params: Promise.resolve({ id: "student-1" }) }
    );

    expect(listTeacherStudentStandaloneHomeworkMock).toHaveBeenCalledWith(expect.objectContaining({ role: "teacher" }), "student-1");
    expect(response.status).toBe(200);
  });

  it("denies standalone homework summary for student actor", async () => {
    requireScheduleApiMock.mockResolvedValue({
      userId: "student-profile",
      role: "student",
      accessMode: "student_own",
      studentId: "student-1",
      teacherId: null,
      accessibleStudentIds: null,
      rbacStatus: "loaded",
      rbacRoles: ["student"],
      rbacPermissions: [],
      rbacPermissionScopes: {}
    });

    const { GET } = await import("@/app/api/students/[id]/homework-assignments/route");
    const response = await GET(
      new NextRequest("http://localhost/api/students/student-1/homework-assignments", { method: "GET" }),
      { params: Promise.resolve({ id: "student-1" }) }
    );

    expect(response.status).toBe(403);
    expect(listTeacherStudentStandaloneHomeworkMock).not.toHaveBeenCalled();
    expect(createTeacherStudentStandaloneHomeworkMock).not.toHaveBeenCalled();
  });

  it("creates standalone homework assignment for a student", async () => {
    createTeacherStudentStandaloneHomeworkMock.mockResolvedValue({
      id: "homework-1",
      title: "Modal Verbs Homework",
      description: null,
      status: "not_started",
      dueAt: null,
      completedAt: null,
      createdAt: "2026-04-11T10:00:00.000Z",
      linkedLessonId: null,
      requiredCount: 1,
      completedRequiredCount: 0,
      items: []
    });

    const { POST } = await import("@/app/api/students/[id]/homework-assignments/route");
    const response = await POST(
      new NextRequest("http://localhost/api/students/student-1/homework-assignments", {
        method: "POST",
        body: JSON.stringify({
          title: "Modal Verbs Homework",
          description: null,
          dueAt: null,
          activityIds: ["550e8400-e29b-41d4-a716-446655440000"]
        })
      }),
      { params: Promise.resolve({ id: "student-1" }) }
    );

    expect(createTeacherStudentStandaloneHomeworkMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "teacher" }),
      "student-1",
      expect.objectContaining({
        title: "Modal Verbs Homework",
        activityIds: ["550e8400-e29b-41d4-a716-446655440000"]
      })
    );
    expect(response.status).toBe(201);
  });

  it("denies standalone homework create before parsing invalid JSON", async () => {
    requireScheduleApiMock.mockResolvedValue({
      userId: "student-profile",
      role: "student",
      accessMode: "student_own",
      studentId: "student-1",
      teacherId: null,
      accessibleStudentIds: null,
      rbacStatus: "loaded",
      rbacRoles: ["student"],
      rbacPermissions: [],
      rbacPermissionScopes: {}
    });

    const { POST } = await import("@/app/api/students/[id]/homework-assignments/route");
    const response = await POST(
      new NextRequest("http://localhost/api/students/student-1/homework-assignments", {
        method: "POST",
        body: "not-json"
      }),
      { params: Promise.resolve({ id: "student-1" }) }
    );

    expect(response.status).toBe(403);
    expect(listTeacherStudentStandaloneHomeworkMock).not.toHaveBeenCalled();
    expect(createTeacherStudentStandaloneHomeworkMock).not.toHaveBeenCalled();
  });
});
