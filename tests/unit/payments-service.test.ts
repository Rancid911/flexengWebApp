import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createRepositoryMock,
  getCurrentStudentBillingSummaryMock,
  getCurrentStudentProfileMock,
  getYooKassaConfirmationExpiresAtMock,
  isYooKassaConfirmationExpiredMock,
  mapPaymentStatusMetaMock,
  repository
} = vi.hoisted(() => {
  const repository = {
    loadAvailablePaymentPlans: vi.fn(),
    loadStudentPayments: vi.fn(),
    loadStudentPaymentStatus: vi.fn()
  };

  return {
    createRepositoryMock: vi.fn(async () => repository),
    getCurrentStudentBillingSummaryMock: vi.fn(),
    getCurrentStudentProfileMock: vi.fn(),
    getYooKassaConfirmationExpiresAtMock: vi.fn(),
    isYooKassaConfirmationExpiredMock: vi.fn(),
    mapPaymentStatusMetaMock: vi.fn(),
    repository
  };
});

vi.mock("@/lib/payments/payments.repository", () => ({
  createUserScopedPaymentsRepository: () => createRepositoryMock()
}));

vi.mock("@/lib/students/current-student", () => ({
  getCurrentStudentProfile: () => getCurrentStudentProfileMock()
}));

vi.mock("@/lib/billing/server", () => ({
  getCurrentStudentBillingSummary: (...args: unknown[]) => getCurrentStudentBillingSummaryMock(...args)
}));

vi.mock("@/lib/payments/yookassa", () => ({
  getYooKassaConfirmationExpiresAt: (...args: unknown[]) =>
    getYooKassaConfirmationExpiresAtMock(...args),
  isYooKassaConfirmationExpired: (...args: unknown[]) =>
    isYooKassaConfirmationExpiredMock(...args),
  mapPaymentStatusMeta: (...args: unknown[]) => mapPaymentStatusMetaMock(...args)
}));

vi.mock("@/lib/server/timing", () => ({
  measureServerTiming: (_label: string, callback: () => Promise<unknown>) => callback()
}));

import {
  getAvailablePaymentPlans,
  getStudentPayments,
  getStudentPaymentStatusContext,
  getStudentPaymentsPageData,
  STUDENT_PAYMENTS_PAGE_WRAPPER_DATA_LOADING
} from "@/lib/payments/payments.service";

function ok(data: unknown) {
  return { data, error: null };
}

describe("payments service", () => {
  beforeEach(() => {
    createRepositoryMock.mockClear();
    getCurrentStudentBillingSummaryMock.mockReset();
    getCurrentStudentProfileMock.mockReset();
    getYooKassaConfirmationExpiresAtMock.mockReset();
    isYooKassaConfirmationExpiredMock.mockReset();
    mapPaymentStatusMetaMock.mockReset();
    for (const method of Object.values(repository)) {
      method.mockReset();
    }

    getYooKassaConfirmationExpiresAtMock.mockReturnValue("2026-04-01T10:30:00.000Z");
    isYooKassaConfirmationExpiredMock.mockReturnValue(false);
    mapPaymentStatusMetaMock.mockReturnValue({
      label: "Ожидает оплаты",
      tone: "warning",
      description: "Завершите оплату"
    });
  });

  it("returns empty student read models without creating a repository", async () => {
    getCurrentStudentProfileMock.mockResolvedValue(null);

    await expect(getStudentPayments()).resolves.toEqual([]);
    await expect(getStudentPaymentStatusContext("payment-1")).resolves.toBeNull();
    await expect(getStudentPaymentStatusContext("")).resolves.toBeNull();
    expect(createRepositoryMock).not.toHaveBeenCalled();
  });

  it("maps available plans without changing public fields", async () => {
    repository.loadAvailablePaymentPlans.mockResolvedValue(
      ok([
        {
          id: "plan-1",
          title: "8 уроков",
          description: "Пакет",
          amount: "12000",
          currency: null,
          badge: "Лучший выбор",
          yookassa_product_label: null,
          sort_order: "2",
          billing_credit_type: "lesson",
          credit_lesson_units: "8",
          credit_money_amount: null
        }
      ])
    );

    await expect(getAvailablePaymentPlans()).resolves.toEqual([
      {
        id: "plan-1",
        title: "8 уроков",
        description: "Пакет",
        amount: 12000,
        currency: "RUB",
        badge: "Лучший выбор",
        yookassaProductLabel: "8 уроков",
        sortOrder: 2,
        billingCreditType: "lesson",
        creditLessonUnits: 8,
        creditMoneyAmount: null
      }
    ]);
  });

  it("maps student transactions and derived confirmation metadata", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({ studentId: "student-1" });
    repository.loadStudentPayments.mockResolvedValue(
      ok([
        {
          id: "payment-1",
          amount: "2500",
          currency: null,
          status: null,
          paid_at: null,
          created_at: "2026-04-01T10:00:00.000Z",
          description: "Оплата",
          raw_status: "pending",
          confirmation_url: "https://provider.example/confirm",
          provider_payment_id: "provider-1",
          plan_id: "plan-1",
          payment_plans: [{ title: "Тариф" }]
        }
      ])
    );

    await expect(getStudentPayments()).resolves.toEqual([
      {
        id: "payment-1",
        amount: 2500,
        currency: "RUB",
        status: "pending",
        description: "Оплата",
        createdAt: "2026-04-01T10:00:00.000Z",
        paidAt: null,
        rawStatus: "pending",
        confirmationUrl: "https://provider.example/confirm",
        confirmationExpiresAt: "2026-04-01T10:30:00.000Z",
        isConfirmationExpired: false,
        providerPaymentId: "provider-1",
        planId: "plan-1",
        planTitle: "Тариф"
      }
    ]);
    expect(repository.loadStudentPayments).toHaveBeenCalledWith("student-1");
    expect(isYooKassaConfirmationExpiredMock).toHaveBeenCalledWith(
      "pending",
      "2026-04-01T10:00:00.000Z"
    );
  });

  it("maps student-owned status context through YooKassa metadata", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({ studentId: "student-1" });
    isYooKassaConfirmationExpiredMock.mockReturnValue(true);
    repository.loadStudentPaymentStatus.mockResolvedValue(
      ok({
        id: "payment-1",
        status: "pending",
        created_at: "2026-04-01T10:00:00.000Z"
      })
    );

    await expect(getStudentPaymentStatusContext("payment-1")).resolves.toEqual({
      transactionId: "payment-1",
      status: "pending",
      label: "Ожидает оплаты",
      tone: "warning",
      description: "Завершите оплату",
      confirmationExpiresAt: "2026-04-01T10:30:00.000Z",
      isConfirmationExpired: true
    });
    expect(repository.loadStudentPaymentStatus).toHaveBeenCalledWith("student-1", "payment-1");
    expect(mapPaymentStatusMetaMock).toHaveBeenCalledWith("pending", {
      isConfirmationExpired: true
    });
  });

  it("preserves soft fallbacks for failed repository reads", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({ studentId: "student-1" });
    repository.loadAvailablePaymentPlans.mockResolvedValue({
      data: null,
      error: { message: "failed" }
    });
    repository.loadStudentPayments.mockResolvedValue({
      data: null,
      error: { message: "failed" }
    });
    repository.loadStudentPaymentStatus.mockResolvedValue({
      data: null,
      error: { message: "failed" }
    });

    await expect(getAvailablePaymentPlans()).resolves.toEqual([]);
    await expect(getStudentPayments()).resolves.toEqual([]);
    await expect(getStudentPaymentStatusContext("payment-1")).resolves.toBeNull();
  });

  it("keeps the transitional page wrapper and billing aggregation", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({ studentId: "student-1" });
    repository.loadStudentPayments.mockResolvedValue(ok([]));
    getCurrentStudentBillingSummaryMock.mockResolvedValue({
      studentId: "student-1",
      recentEntries: []
    });

    await expect(getStudentPaymentsPageData()).resolves.toEqual({
      payments: [],
      billingSummary: {
        studentId: "student-1",
        recentEntries: []
      }
    });
    expect(STUDENT_PAYMENTS_PAGE_WRAPPER_DATA_LOADING.transitional).toBe(true);
    expect(getCurrentStudentBillingSummaryMock).toHaveBeenCalledWith(6);
  });
});
