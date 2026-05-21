import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getStudentPaymentsMock = vi.fn();
const getCurrentStudentBillingSummaryMock = vi.fn();
const getAppActorMock = vi.fn();

vi.mock("@/lib/auth/request-context", () => ({
  getAppActor: () => getAppActorMock()
}));

vi.mock("@/lib/payments/queries", () => ({
  getStudentPayments: (...args: unknown[]) => getStudentPaymentsMock(...args)
}));

vi.mock("@/lib/billing/server", () => ({
  getCurrentStudentBillingSummary: (...args: unknown[]) => getCurrentStudentBillingSummaryMock(...args)
}));

describe("/api/payments GET", () => {
  beforeEach(() => {
    getAppActorMock.mockReset();
    getAppActorMock.mockResolvedValue({ userId: "student-profile-1", role: "student", isStudent: true });
    getStudentPaymentsMock.mockReset();
    getCurrentStudentBillingSummaryMock.mockReset();
  });

  it("assembles payload from narrow loaders", async () => {
    getStudentPaymentsMock.mockResolvedValue([{ id: "payment-1" }]);
    getCurrentStudentBillingSummaryMock.mockResolvedValue({ studentId: "student-1" });

    const { GET } = await import("@/app/api/payments/route");
    const response = await GET(new NextRequest("http://localhost/api/payments"));

    expect(getStudentPaymentsMock).toHaveBeenCalledTimes(1);
    expect(getCurrentStudentBillingSummaryMock).toHaveBeenCalledWith(6);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      payments: [{ id: "payment-1" }],
      billingSummary: { studentId: "student-1" }
    });
  });

  it("returns payments even when billing summary loading fails", async () => {
    getStudentPaymentsMock.mockResolvedValue([{ id: "payment-1" }]);
    getCurrentStudentBillingSummaryMock.mockRejectedValue(new Error("Failed to load billing summary ledger"));

    const { GET } = await import("@/app/api/payments/route");
    const response = await GET(new NextRequest("http://localhost/api/payments"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      payments: [{ id: "payment-1" }],
      billingSummary: null
    });
  });

  it("supports billing-summary-only refreshes for deferred hydration", async () => {
    getStudentPaymentsMock.mockResolvedValue([{ id: "payment-1" }]);
    getCurrentStudentBillingSummaryMock.mockResolvedValue({ studentId: "student-1" });

    const { GET } = await import("@/app/api/payments/route");
    const response = await GET(new NextRequest("http://localhost/api/payments?includePayments=0&includeBillingSummary=1"));

    expect(getStudentPaymentsMock).not.toHaveBeenCalled();
    expect(getCurrentStudentBillingSummaryMock).toHaveBeenCalledWith(6);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      payments: [],
      billingSummary: { studentId: "student-1" }
    });
  });

  it("returns 401 for unauthenticated actors before loading payments", async () => {
    getAppActorMock.mockResolvedValue(null);

    const { GET } = await import("@/app/api/payments/route");
    const response = await GET(new NextRequest("http://localhost/api/payments"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ code: "UNAUTHORIZED" });
    expect(getStudentPaymentsMock).not.toHaveBeenCalled();
    expect(getCurrentStudentBillingSummaryMock).not.toHaveBeenCalled();
  });

  it("returns 403 for non-student actors before loading payments", async () => {
    getAppActorMock.mockResolvedValue({ userId: "teacher-profile-1", role: "teacher", isTeacher: true });

    const { GET } = await import("@/app/api/payments/route");
    const response = await GET(new NextRequest("http://localhost/api/payments"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
    expect(getStudentPaymentsMock).not.toHaveBeenCalled();
    expect(getCurrentStudentBillingSummaryMock).not.toHaveBeenCalled();
  });

  it("returns 403 for teacher preview actors before loading payments", async () => {
    getAppActorMock.mockResolvedValue({
      userId: "teacher-profile-1",
      role: "teacher",
      profileRole: "teacher",
      isTeacher: true,
      isStudent: false,
      studentId: "student-preview-1"
    });

    const { GET } = await import("@/app/api/payments/route");
    const response = await GET(new NextRequest("http://localhost/api/payments"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
    expect(getStudentPaymentsMock).not.toHaveBeenCalled();
    expect(getCurrentStudentBillingSummaryMock).not.toHaveBeenCalled();
  });
});
