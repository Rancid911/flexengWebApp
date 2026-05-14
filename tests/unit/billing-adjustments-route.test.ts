import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireScheduleApiMock = vi.fn();
const createStudentBillingAdjustmentMock = vi.fn();

vi.mock("@/lib/schedule/server", () => ({
  requireScheduleApi: () => requireScheduleApiMock()
}));

vi.mock("@/lib/billing/server", () => ({
  createStudentBillingAdjustment: (...args: unknown[]) => createStudentBillingAdjustmentMock(...args)
}));

describe("/api/students/[id]/billing/adjustments", () => {
  beforeEach(() => {
    vi.resetModules();
    requireScheduleApiMock.mockReset();
    createStudentBillingAdjustmentMock.mockReset();
  });

  it("creates a billing adjustment for an authorized staff actor", async () => {
    requireScheduleApiMock.mockResolvedValue({ userId: "manager-1", role: "manager" });
    createStudentBillingAdjustmentMock.mockResolvedValue({ studentId: "student-1" });

    const { POST } = await import("@/app/api/students/[id]/billing/adjustments/route");
    const response = await POST(
      new NextRequest("http://localhost/api/students/student-1/billing/adjustments", {
        method: "POST",
        body: JSON.stringify({
          unitType: "lesson",
          direction: "credit",
          value: 2,
          description: "Manual correction"
        })
      }),
      { params: Promise.resolve({ id: "student-1" }) }
    );

    expect(response.status).toBe(201);
    expect(createStudentBillingAdjustmentMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "manager" }),
      "student-1",
      expect.objectContaining({ unitType: "lesson", direction: "credit", value: 2 })
    );
  });

  it("rejects a teacher outside the student scope before calling billing service", async () => {
    requireScheduleApiMock.mockResolvedValue({
      userId: "teacher-profile-1",
      role: "teacher",
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-2"]
    });

    const { POST } = await import("@/app/api/students/[id]/billing/adjustments/route");
    const response = await POST(
      new NextRequest("http://localhost/api/students/student-1/billing/adjustments", {
        method: "POST",
        body: JSON.stringify({
          unitType: "lesson",
          direction: "credit",
          value: 1
        })
      }),
      { params: Promise.resolve({ id: "student-1" }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
    expect(createStudentBillingAdjustmentMock).not.toHaveBeenCalled();
  });
});
