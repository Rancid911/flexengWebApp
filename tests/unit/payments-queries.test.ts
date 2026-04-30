import { beforeEach, describe, expect, it, vi } from "vitest";

import { getStudentPaymentsPageData, STUDENT_PAYMENTS_PAGE_WRAPPER_DATA_LOADING } from "@/lib/payments/queries";

const createClientMock = vi.fn();
const getCurrentStudentProfileMock = vi.fn();
const getCurrentStudentBillingSummaryMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
}));

vi.mock("@/lib/students/current-student", () => ({
  getCurrentStudentProfile: () => getCurrentStudentProfileMock()
}));

vi.mock("@/lib/billing/server", () => ({
  getCurrentStudentBillingSummary: (...args: unknown[]) => getCurrentStudentBillingSummaryMock(...args)
}));

function makeQueryResult(data: unknown, error: { message: string } | null = null) {
  const result = { data, error };
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
    catch: (reject: (reason: unknown) => unknown) => Promise.resolve(result).catch(reject),
    finally: (callback: () => void) => Promise.resolve(result).finally(callback)
  };
  return builder;
}

describe("getStudentPaymentsPageData", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    getCurrentStudentProfileMock.mockReset();
    getCurrentStudentBillingSummaryMock.mockReset();
  });

  it("remains a transitional compatibility wrapper around narrow loaders", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({ studentId: "student-1" });
    getCurrentStudentBillingSummaryMock.mockResolvedValue({ studentId: "student-1", recentEntries: [] });
    createClientMock.mockReturnValue({
      from: vi.fn(() => makeQueryResult([
        {
          id: "payment-1",
          amount: 2500,
          currency: "RUB",
          status: "succeeded",
          paid_at: null,
          created_at: "2026-04-01T10:00:00.000Z",
          description: "Оплата",
          raw_status: "succeeded",
          confirmation_url: null,
          provider_payment_id: "provider-1",
          plan_id: "plan-1",
          payment_plans: { title: "Тариф" }
        }
      ]))
    });

    const result = await getStudentPaymentsPageData();

    expect(STUDENT_PAYMENTS_PAGE_WRAPPER_DATA_LOADING.transitional).toBe(true);
    expect(getCurrentStudentBillingSummaryMock).toHaveBeenCalledWith(6);
    expect(result).toMatchObject({
      payments: [
        {
          id: "payment-1",
          planTitle: "Тариф"
        }
      ],
      billingSummary: {
        studentId: "student-1"
      }
    });
  });
});
