import { describe, expect, it, vi } from "vitest";

import { createPaymentsRepository } from "@/lib/payments/payments.repository";

function makeQueryResult(data: unknown = null) {
  const result = { data, error: null };
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

describe("payments repository", () => {
  it("loads active plans with the existing fields and ordering", async () => {
    const query = makeQueryResult([]);
    const fromMock = vi.fn(() => query);
    const repository = createPaymentsRepository({ from: fromMock } as never);

    await repository.loadAvailablePaymentPlans();

    expect(fromMock).toHaveBeenCalledWith("payment_plans");
    expect(query.select).toHaveBeenCalledWith(
      "id, title, description, amount, currency, badge, yookassa_product_label, sort_order, billing_credit_type, credit_lesson_units, credit_money_amount"
    );
    expect(query.eq).toHaveBeenCalledWith("is_active", true);
    expect(query.order).toHaveBeenNthCalledWith(1, "sort_order", { ascending: true });
    expect(query.order).toHaveBeenNthCalledWith(2, "created_at", { ascending: false });
  });

  it("loads current student transactions in reverse chronological order", async () => {
    const query = makeQueryResult([]);
    const fromMock = vi.fn(() => query);
    const repository = createPaymentsRepository({ from: fromMock } as never);

    await repository.loadStudentPayments("student-1");

    expect(fromMock).toHaveBeenCalledWith("payment_transactions");
    expect(query.select).toHaveBeenCalledWith(
      "id, amount, currency, status, paid_at, created_at, description, raw_status, confirmation_url, provider_payment_id, plan_id, payment_plans(title)"
    );
    expect(query.eq).toHaveBeenCalledWith("student_id", "student-1");
    expect(query.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("loads one student-owned transaction for status context", async () => {
    const query = makeQueryResult({ id: "payment-1" });
    const fromMock = vi.fn(() => query);
    const repository = createPaymentsRepository({ from: fromMock } as never);

    await repository.loadStudentPaymentStatus("student-1", "payment-1");

    expect(fromMock).toHaveBeenCalledWith("payment_transactions");
    expect(query.select).toHaveBeenCalledWith("id, status, created_at");
    expect(query.eq).toHaveBeenNthCalledWith(1, "student_id", "student-1");
    expect(query.eq).toHaveBeenNthCalledWith(2, "id", "payment-1");
    expect(query.maybeSingle).toHaveBeenCalledTimes(1);
  });
});
