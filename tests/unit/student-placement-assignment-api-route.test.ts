import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const assignTeacherStudentPlacementTestMock = vi.fn();
const cancelTeacherStudentPlacementTestMock = vi.fn();
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
  assignTeacherStudentPlacementTest: (...args: unknown[]) => assignTeacherStudentPlacementTestMock(...args),
  cancelTeacherStudentPlacementTest: (...args: unknown[]) => cancelTeacherStudentPlacementTestMock(...args)
}));

describe("/api/students/[id]/placement-assignment", () => {
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
    assignTeacherStudentPlacementTestMock.mockReset();
    cancelTeacherStudentPlacementTestMock.mockReset();
  });

  it("assigns placement test for a student", async () => {
    assignTeacherStudentPlacementTestMock.mockResolvedValue({
      assignmentId: "assignment-1",
      status: "not_started",
      testId: "test-1",
      title: "Placement Test",
      attemptId: null,
      score: null,
      recommendedLevel: null,
      recommendedBandLabel: null,
      submittedAt: null
    });

    const { POST } = await import("@/app/api/students/[id]/placement-assignment/route");
    const response = await POST(
      new NextRequest("http://localhost/api/students/student-1/placement-assignment", { method: "POST" }),
      { params: Promise.resolve({ id: "student-1" }) }
    );

    expect(assignTeacherStudentPlacementTestMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "teacher" }),
      "student-1"
    );
    expect(response.status).toBe(201);
  });

  it("assigns placement test for loaded RBAC teachers with assigned homework scope", async () => {
    requireScheduleApiMock.mockResolvedValue({
      userId: "teacher-profile",
      role: "teacher",
      accessMode: "teacher_assigned",
      studentId: null,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacRoles: ["teacher"],
      rbacPermissions: ["homework.assign"],
      rbacPermissionScopes: {
        "homework.assign": ["assigned"]
      }
    });
    assignTeacherStudentPlacementTestMock.mockResolvedValue({
      assignmentId: "assignment-1",
      status: "not_started",
      testId: "test-1",
      title: "Placement Test",
      attemptId: null,
      score: null,
      recommendedLevel: null,
      recommendedBandLabel: null,
      submittedAt: null
    });

    const { POST } = await import("@/app/api/students/[id]/placement-assignment/route");
    const response = await POST(
      new NextRequest("http://localhost/api/students/student-1/placement-assignment", { method: "POST" }),
      { params: Promise.resolve({ id: "student-1" }) }
    );

    expect(assignTeacherStudentPlacementTestMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "teacher" }),
      "student-1"
    );
    expect(response.status).toBe(201);
  });

  it("denies placement assignment for loaded RBAC teachers missing homework scope before service calls", async () => {
    requireScheduleApiMock.mockResolvedValue({
      userId: "teacher-profile",
      role: "teacher",
      accessMode: "teacher_assigned",
      studentId: null,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacRoles: ["teacher"],
      rbacPermissions: ["students.view"],
      rbacPermissionScopes: {
        "students.view": ["assigned"]
      }
    });

    const { POST } = await import("@/app/api/students/[id]/placement-assignment/route");
    const response = await POST(
      new NextRequest("http://localhost/api/students/student-1/placement-assignment", { method: "POST" }),
      { params: Promise.resolve({ id: "student-1" }) }
    );

    expect(response.status).toBe(403);
    expect(assignTeacherStudentPlacementTestMock).not.toHaveBeenCalled();
    expect(cancelTeacherStudentPlacementTestMock).not.toHaveBeenCalled();
  });

  it("denies placement assignment for unassigned loaded RBAC teachers before service calls", async () => {
    requireScheduleApiMock.mockResolvedValue({
      userId: "teacher-profile",
      role: "teacher",
      accessMode: "teacher_assigned",
      studentId: null,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacRoles: ["teacher"],
      rbacPermissions: ["homework.assign"],
      rbacPermissionScopes: {
        "homework.assign": ["assigned"]
      }
    });

    const { POST } = await import("@/app/api/students/[id]/placement-assignment/route");
    const response = await POST(
      new NextRequest("http://localhost/api/students/student-2/placement-assignment", { method: "POST" }),
      { params: Promise.resolve({ id: "student-2" }) }
    );

    expect(response.status).toBe(403);
    expect(assignTeacherStudentPlacementTestMock).not.toHaveBeenCalled();
    expect(cancelTeacherStudentPlacementTestMock).not.toHaveBeenCalled();
  });

  it("denies placement assignment for student actor", async () => {
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

    const { POST } = await import("@/app/api/students/[id]/placement-assignment/route");
    const response = await POST(
      new NextRequest("http://localhost/api/students/student-1/placement-assignment", { method: "POST" }),
      { params: Promise.resolve({ id: "student-1" }) }
    );

    expect(response.status).toBe(403);
    expect(assignTeacherStudentPlacementTestMock).not.toHaveBeenCalled();
    expect(cancelTeacherStudentPlacementTestMock).not.toHaveBeenCalled();
  });

  it("cancels placement test assignment for a student", async () => {
    cancelTeacherStudentPlacementTestMock.mockResolvedValue({
      assignmentId: null,
      status: "not_assigned",
      testId: "test-1",
      title: "Placement Test",
      attemptId: null,
      score: null,
      recommendedLevel: null,
      recommendedBandLabel: null,
      submittedAt: null
    });

    const { DELETE } = await import("@/app/api/students/[id]/placement-assignment/route");
    const response = await DELETE(
      new NextRequest("http://localhost/api/students/student-1/placement-assignment", { method: "DELETE" }),
      { params: Promise.resolve({ id: "student-1" }) }
    );
    const payload = await response.json();

    expect(cancelTeacherStudentPlacementTestMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "teacher" }),
      "student-1"
    );
    expect(response.status).toBe(200);
    expect(payload.status).toBe("not_assigned");
  });

  it("cancels placement test for loaded RBAC teachers with assigned homework scope", async () => {
    requireScheduleApiMock.mockResolvedValue({
      userId: "teacher-profile",
      role: "teacher",
      accessMode: "teacher_assigned",
      studentId: null,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacRoles: ["teacher"],
      rbacPermissions: ["homework.assign"],
      rbacPermissionScopes: {
        "homework.assign": ["assigned"]
      }
    });
    cancelTeacherStudentPlacementTestMock.mockResolvedValue({
      assignmentId: null,
      status: "not_assigned",
      testId: "test-1",
      title: "Placement Test",
      attemptId: null,
      score: null,
      recommendedLevel: null,
      recommendedBandLabel: null,
      submittedAt: null
    });

    const { DELETE } = await import("@/app/api/students/[id]/placement-assignment/route");
    const response = await DELETE(
      new NextRequest("http://localhost/api/students/student-1/placement-assignment", { method: "DELETE" }),
      { params: Promise.resolve({ id: "student-1" }) }
    );

    expect(cancelTeacherStudentPlacementTestMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "teacher" }),
      "student-1"
    );
    expect(response.status).toBe(200);
  });

  it("denies placement cancellation for loaded RBAC teachers missing homework scope before service calls", async () => {
    requireScheduleApiMock.mockResolvedValue({
      userId: "teacher-profile",
      role: "teacher",
      accessMode: "teacher_assigned",
      studentId: null,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacRoles: ["teacher"],
      rbacPermissions: ["students.view"],
      rbacPermissionScopes: {
        "students.view": ["assigned"]
      }
    });

    const { DELETE } = await import("@/app/api/students/[id]/placement-assignment/route");
    const response = await DELETE(
      new NextRequest("http://localhost/api/students/student-1/placement-assignment", { method: "DELETE" }),
      { params: Promise.resolve({ id: "student-1" }) }
    );

    expect(response.status).toBe(403);
    expect(assignTeacherStudentPlacementTestMock).not.toHaveBeenCalled();
    expect(cancelTeacherStudentPlacementTestMock).not.toHaveBeenCalled();
  });

  it("denies placement cancellation for student actor", async () => {
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

    const { DELETE } = await import("@/app/api/students/[id]/placement-assignment/route");
    const response = await DELETE(
      new NextRequest("http://localhost/api/students/student-1/placement-assignment", { method: "DELETE" }),
      { params: Promise.resolve({ id: "student-1" }) }
    );

    expect(response.status).toBe(403);
    expect(assignTeacherStudentPlacementTestMock).not.toHaveBeenCalled();
    expect(cancelTeacherStudentPlacementTestMock).not.toHaveBeenCalled();
  });
});
