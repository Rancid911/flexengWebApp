import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireScheduleApiMock = vi.hoisted(() => vi.fn());
const getBillingSummaryForActorMock = vi.hoisted(() => vi.fn());
const updateStudentBillingSettingsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/schedule/server", () => ({
  requireScheduleApi: () => requireScheduleApiMock()
}));

vi.mock("@/lib/billing/server", () => ({
  getBillingSummaryForActor: (...args: unknown[]) => getBillingSummaryForActorMock(...args),
  updateStudentBillingSettings: (...args: unknown[]) => updateStudentBillingSettingsMock(...args)
}));

describe("/api/students/[id]/billing", () => {
  beforeEach(() => {
    vi.resetModules();
    requireScheduleApiMock.mockReset();
    getBillingSummaryForActorMock.mockReset();
    updateStudentBillingSettingsMock.mockReset();
  });

  it("returns billing summary for the current student", async () => {
    requireScheduleApiMock.mockResolvedValue({
      userId: "student-profile-1",
      role: "student",
      accessMode: "student_own",
      studentId: "student-1",
      teacherId: null,
      accessibleStudentIds: null,
      rbacStatus: "loaded",
      rbacRoles: ["student"],
      rbacPermissions: ["billing.view"],
      rbacPermissionScopes: { "billing.view": ["own"] }
    });
    getBillingSummaryForActorMock.mockResolvedValue({ studentId: "student-1", entries: [] });

    const { GET } = await import("@/app/api/students/[id]/billing/route");
    const response = await GET(new NextRequest("http://localhost/api/students/student-1/billing"), {
      params: Promise.resolve({ id: "student-1" })
    });

    expect(response.status).toBe(200);
    expect(getBillingSummaryForActorMock).toHaveBeenCalledWith(expect.objectContaining({ role: "student" }), "student-1", 10);
  });

  it("denies billing summary for another student before calling billing service", async () => {
    requireScheduleApiMock.mockResolvedValue({
      userId: "student-profile-1",
      role: "student",
      accessMode: "student_own",
      studentId: "student-1",
      teacherId: null,
      accessibleStudentIds: null,
      rbacStatus: "loaded",
      rbacRoles: ["student"],
      rbacPermissions: ["billing.view"],
      rbacPermissionScopes: { "billing.view": ["own"] }
    });

    const { GET } = await import("@/app/api/students/[id]/billing/route");
    const response = await GET(new NextRequest("http://localhost/api/students/student-2/billing"), {
      params: Promise.resolve({ id: "student-2" })
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
    expect(getBillingSummaryForActorMock).not.toHaveBeenCalled();
    expect(updateStudentBillingSettingsMock).not.toHaveBeenCalled();
  });

  it("returns billing summary for a scoped teacher", async () => {
    requireScheduleApiMock.mockResolvedValue({
      userId: "teacher-profile-1",
      role: "teacher",
      accessMode: "teacher_assigned",
      studentId: null,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacStatus: "loaded",
      rbacRoles: ["teacher"],
      rbacPermissions: ["billing.view"],
      rbacPermissionScopes: { "billing.view": ["assigned"] }
    });
    getBillingSummaryForActorMock.mockResolvedValue({ studentId: "student-1", entries: [] });

    const { GET } = await import("@/app/api/students/[id]/billing/route");
    const response = await GET(new NextRequest("http://localhost/api/students/student-1/billing"), {
      params: Promise.resolve({ id: "student-1" })
    });

    expect(response.status).toBe(200);
    expect(getBillingSummaryForActorMock).toHaveBeenCalledWith(expect.objectContaining({ role: "teacher" }), "student-1", 10);
  });

  it("updates billing settings for a staff actor", async () => {
    requireScheduleApiMock.mockResolvedValue({
      userId: "manager-1",
      role: "manager",
      accessMode: "staff_all",
      studentId: null,
      teacherId: null,
      accessibleStudentIds: null,
      rbacStatus: "loaded",
      rbacRoles: ["manager"],
      rbacPermissions: ["billing.adjust"],
      rbacPermissionScopes: { "billing.adjust": ["all"] }
    });
    updateStudentBillingSettingsMock.mockResolvedValue({ studentId: "student-1", billingMode: "per_lesson_price" });

    const { PATCH } = await import("@/app/api/students/[id]/billing/route");
    const response = await PATCH(
      new NextRequest("http://localhost/api/students/student-1/billing", {
        method: "PATCH",
        body: JSON.stringify({
          billingMode: "per_lesson_price",
          lessonPriceAmount: 2500
        })
      }),
      { params: Promise.resolve({ id: "student-1" }) }
    );

    expect(response.status).toBe(200);
    expect(updateStudentBillingSettingsMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "manager" }),
      "student-1",
      expect.objectContaining({ billingMode: "per_lesson_price", lessonPriceAmount: 2500 })
    );
  });

  it("denies billing settings update before parsing invalid JSON", async () => {
    requireScheduleApiMock.mockResolvedValue({
      userId: "teacher-profile-1",
      role: "teacher",
      accessMode: "teacher_assigned",
      studentId: null,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      rbacStatus: "loaded",
      rbacRoles: ["teacher"],
      rbacPermissions: ["billing.view"],
      rbacPermissionScopes: { "billing.view": ["assigned"] }
    });

    const { PATCH } = await import("@/app/api/students/[id]/billing/route");
    const response = await PATCH(
      new NextRequest("http://localhost/api/students/student-1/billing", {
        method: "PATCH",
        body: "not-json"
      }),
      { params: Promise.resolve({ id: "student-1" }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
    expect(getBillingSummaryForActorMock).not.toHaveBeenCalled();
    expect(updateStudentBillingSettingsMock).not.toHaveBeenCalled();
  });
});
