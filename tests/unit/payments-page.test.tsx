import { beforeEach, describe, expect, it, vi } from "vitest";

import PaymentsPage from "@/app/(workspace)/(student-zone)/settings/payments/page";

const getStudentPaymentsMock = vi.fn();
const getAvailablePaymentPlansMock = vi.fn();
const getStudentPaymentStatusContextMock = vi.fn();

vi.mock("@/lib/payments/queries", () => ({
  getStudentPayments: (...args: unknown[]) => getStudentPaymentsMock(...args),
  getAvailablePaymentPlans: (...args: unknown[]) => getAvailablePaymentPlansMock(...args),
  getStudentPaymentStatusContext: (...args: unknown[]) => getStudentPaymentStatusContextMock(...args)
}));

vi.mock("@/app/(workspace)/(student-zone)/settings/payments-client", () => ({
  PaymentsClient: (props: {
    initialPayments: unknown;
    initialBillingSummary: unknown;
    initialPlans: unknown;
    paymentStatusContext: unknown;
  }) => <div data-testid="payments-page-probe">{JSON.stringify(props)}</div>
}));

describe("PaymentsPage", () => {
  beforeEach(() => {
    getStudentPaymentsMock.mockReset();
    getAvailablePaymentPlansMock.mockReset();
    getStudentPaymentStatusContextMock.mockReset();
  });

  it("assembles page data from narrow loaders", async () => {
    getStudentPaymentsMock.mockResolvedValue([{ id: "payment-1" }]);
    getAvailablePaymentPlansMock.mockResolvedValue([{ id: "plan-1" }]);
    getStudentPaymentStatusContextMock.mockResolvedValue({ transactionId: "payment-1", status: "pending" });

    const result = await PaymentsPage({
      searchParams: Promise.resolve({ payment: "payment-1" })
    });

    expect(getStudentPaymentsMock).toHaveBeenCalledTimes(1);
    expect(getAvailablePaymentPlansMock).toHaveBeenCalledTimes(1);
    expect(getStudentPaymentStatusContextMock).toHaveBeenCalledWith("payment-1");
    expect(result).toBeTruthy();
  });

  it("starts base page loaders before awaiting search params", async () => {
    let resolveSearchParams: ((value: { payment?: string }) => void) | null = null;
    const searchParams = new Promise<{ payment?: string }>((resolve) => {
      resolveSearchParams = resolve;
    });

    getStudentPaymentsMock.mockResolvedValue([]);
    getAvailablePaymentPlansMock.mockResolvedValue([]);
    getStudentPaymentStatusContextMock.mockResolvedValue(null);

    const resultPromise = PaymentsPage({ searchParams });
    await Promise.resolve();

    expect(getStudentPaymentsMock).toHaveBeenCalledTimes(1);
    expect(getAvailablePaymentPlansMock).toHaveBeenCalledTimes(1);
    expect(getStudentPaymentStatusContextMock).not.toHaveBeenCalled();

    resolveSearchParams?.({ payment: "payment-1" });
    await resultPromise;

    expect(getStudentPaymentStatusContextMock).toHaveBeenCalledWith("payment-1");
  });

  it("skips payment status context when no payment query param is present", async () => {
    getStudentPaymentsMock.mockResolvedValue([]);
    getAvailablePaymentPlansMock.mockResolvedValue([]);
    getStudentPaymentStatusContextMock.mockResolvedValue(null);

    await PaymentsPage({
      searchParams: Promise.resolve({})
    });

    expect(getStudentPaymentStatusContextMock).not.toHaveBeenCalled();
  });

  it("renders with deferred billing summary on the initial response", async () => {
    getStudentPaymentsMock.mockResolvedValue([{ id: "payment-1" }]);
    getAvailablePaymentPlansMock.mockResolvedValue([{ id: "plan-1" }]);
    getStudentPaymentStatusContextMock.mockResolvedValue(null);

    const result = await PaymentsPage({
      searchParams: Promise.resolve({})
    });

    expect(getStudentPaymentsMock).toHaveBeenCalledTimes(1);
    expect(getAvailablePaymentPlansMock).toHaveBeenCalledTimes(1);
    expect(result).toBeTruthy();
  });
});
