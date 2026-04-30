import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const assignTeacherStudentPlacementTestMock = vi.fn();
const cancelTeacherStudentPlacementTestMock = vi.fn();

vi.mock("@/lib/schedule/server", () => ({
  requireScheduleApi: vi.fn(async () => ({
    userId: "teacher-profile",
    role: "teacher",
    studentId: null,
    teacherId: "teacher-1",
    accessibleStudentIds: ["student-1"]
  }))
}));

vi.mock("@/lib/teacher-workspace/queries", () => ({
  assignTeacherStudentPlacementTest: (...args: unknown[]) => assignTeacherStudentPlacementTestMock(...args),
  cancelTeacherStudentPlacementTest: (...args: unknown[]) => cancelTeacherStudentPlacementTestMock(...args)
}));

describe("/api/students/[id]/placement-assignment", () => {
  beforeEach(() => {
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
});
