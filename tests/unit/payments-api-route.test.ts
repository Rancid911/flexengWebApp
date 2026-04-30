import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getStudentPaymentsMock = vi.fn();
const getCurrentStudentBillingSummaryMock = vi.fn();

vi.mock("@/lib/payments/queries", () => ({
  getStudentPayments: (...args: unknown[]) => getStudentPaymentsMock(...args)
}));

vi.mock("@/lib/billing/server", () => ({
  getCurrentStudentBillingSummary: (...args: unknown[]) => getCurrentStudentBillingSummaryMock(...args)
}));

describe("/api/payments GET", () => {
  beforeEach(() => {
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
});
