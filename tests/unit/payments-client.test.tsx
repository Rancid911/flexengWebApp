import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  PaymentsClient,
  formatAmount,
  formatTimestamp,
  getPlanMetaLabel,
  getStatusChipClass,
  getStatusLabel
} from "@/app/(dashboard)/settings/payments-client";
import type { PaymentPlan, PaymentStatusContext, StudentPaymentTransaction } from "@/lib/payments/types";

function makePayment(index: number, overrides: Partial<StudentPaymentTransaction> = {}): StudentPaymentTransaction {
  return {
    id: `payment-${index}`,
    amount: 1000 + index,
    currency: "RUB",
    status: "succeeded",
    description: `Платёж ${index}`,
    createdAt: `2026-03-${String(index).padStart(2, "0")}T10:00:00.000Z`,
    paidAt: `2026-03-${String(index).padStart(2, "0")}T10:05:00.000Z`,
    rawStatus: "succeeded",
    confirmationUrl: null,
    confirmationExpiresAt: null,
    isConfirmationExpired: false,
    providerPaymentId: `provider-${index}`,
    planId: `plan-${index}`,
    planTitle: `Тариф ${index}`,
    ...overrides
  };
}

const plans: PaymentPlan[] = [
  {
    id: "plan-1",
    title: "Разовая консультация",
    description: "Короткая консультация",
    amount: 2900,
    currency: "RUB",
    badge: null,
    yookassaProductLabel: "Разовая консультация",
    sortOrder: 1
  },
  {
    id: "plan-2",
    title: "Пакет 4 занятия",
    description: "Пакет на 4 занятия",
    amount: 12900,
    currency: "RUB",
    badge: "Популярный",
    yookassaProductLabel: "Пакет из 4 занятий",
    sortOrder: 2
  },
  {
    id: "plan-3",
    title: "Пакет 8 занятий",
    description: "Пакет на 8 занятий",
    amount: 23900,
    currency: "RUB",
    badge: "Лучший выбор",
    yookassaProductLabel: "Пакет из 8 занятий",
    sortOrder: 3
  },
  {
    id: "plan-4",
    title: "Интенсив на месяц",
    description: "Интенсив",
    amount: 44900,
    currency: "RUB",
    badge: null,
    yookassaProductLabel: "Месячный интенсив",
    sortOrder: 4
  }
];

function renderPaymentsClient(options?: {
  payments?: StudentPaymentTransaction[];
  paymentStatusContext?: PaymentStatusContext | null;
}) {
  return render(
    <PaymentsClient
      initialPayments={options?.payments ?? []}
      initialPlans={plans}
      paymentStatusContext={options?.paymentStatusContext ?? null}
    />
  );
}

describe("PaymentsClient", () => {
  it("shows only first five payments by default and expands/collapses history", () => {
    renderPaymentsClient({ payments: Array.from({ length: 7 }, (_, index) => makePayment(index + 1)) });

    expect(screen.getByText("Показано 5 из 7")).toBeInTheDocument();
    expect(screen.getByText("Тариф 1")).toBeInTheDocument();
    expect(screen.getByText("Тариф 5")).toBeInTheDocument();
    expect(screen.queryByText("Тариф 6")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Загрузить ещё" }));

    expect(screen.getByText("Показано 7 из 7")).toBeInTheDocument();
    expect(screen.getByText("Тариф 6")).toBeInTheDocument();
    expect(screen.getByText("Тариф 7")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Свернуть" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Свернуть" }));

    expect(screen.getByText("Показано 5 из 7")).toBeInTheDocument();
    expect(screen.queryByText("Тариф 6")).not.toBeInTheDocument();
  });

  it("shows empty state when payment history is empty", () => {
    renderPaymentsClient({ payments: [] });

    expect(screen.getByText("История оплат пуста")).toBeInTheDocument();
  });

  it("shows pending continuation action and hides intensive plan", () => {
    renderPaymentsClient({
      payments: [
        makePayment(1, {
          status: "pending",
          providerPaymentId: null,
          confirmationUrl: "https://example.com/pay/1",
          planTitle: "Ожидающий платёж"
        })
      ]
    });

    expect(screen.getByRole("button", { name: "Продолжить оплату" })).toBeInTheDocument();
    expect(screen.getByText("Разовая консультация")).toBeInTheDocument();
    expect(screen.getByText("Пакет 4 занятия")).toBeInTheDocument();
    expect(screen.getByText("Пакет 8 занятий")).toBeInTheDocument();
    expect(screen.queryByText("Интенсив на месяц")).not.toBeInTheDocument();
  });

  it("hides continuation action for expired pending payment", () => {
    renderPaymentsClient({
      payments: [
        makePayment(1, {
          status: "pending",
          confirmationUrl: "https://example.com/pay/1",
          confirmationExpiresAt: "2026-03-27T11:00:00.000Z",
          isConfirmationExpired: true,
          planTitle: "Истекший платёж"
        })
      ],
      paymentStatusContext: {
        transactionId: "payment-1",
        status: "pending",
        label: "Сессия оплаты истекла",
        tone: "muted",
        description: "Время на подтверждение платежа истекло. Создайте новый платёж, чтобы попробовать снова.",
        confirmationExpiresAt: "2026-03-27T11:00:00.000Z",
        isConfirmationExpired: true
      }
    });

    expect(screen.queryByRole("button", { name: "Продолжить оплату" })).not.toBeInTheDocument();
    expect(screen.getByText("Сессия оплаты истекла")).toBeInTheDocument();
    expect(screen.getByText("Сессия истекла")).toBeInTheDocument();
  });
});

describe("payments-client helpers", () => {
  it("formats amount and timestamp for russian locale", () => {
    expect(formatAmount(12900, "RUB")).toContain("12");
    expect(formatTimestamp("2026-03-26T10:00:00.000Z")).toMatch(/2026|марта/);
    expect(formatTimestamp("invalid")).toBe("Дата уточняется");
  });

  it("maps status and plan metadata", () => {
    expect(getStatusLabel("succeeded")).toBe("Оплачено");
    expect(getStatusLabel("failed")).toBe("Ошибка");
    expect(getStatusLabel("pending", true)).toBe("Сессия истекла");
    expect(getStatusChipClass("pending")).toContain("amber");
    expect(getStatusChipClass("pending", true)).toContain("slate");
    expect(getPlanMetaLabel(plans[0])).toBe("Персональная сессия");
    expect(getPlanMetaLabel(plans[2])).toBe("8 занятий");
  });
});
