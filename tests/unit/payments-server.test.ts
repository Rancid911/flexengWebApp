import { beforeEach, describe, expect, it, vi } from "vitest";

const serverRpcMock = vi.hoisted(() => vi.fn());
const adminClientMock = vi.hoisted(() => vi.fn());
const createYooKassaPaymentMock = vi.hoisted(() => vi.fn());
const getYooKassaPaymentMock = vi.hoisted(() => vi.fn());
const assertPaymentPlanBillingCompatibilityMock = vi.hoisted(() => vi.fn());
const syncPaymentTransactionBillingMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: serverRpcMock
  })
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: adminClientMock
}));

vi.mock("@/lib/server-origin", () => ({
  getRequestOrigin: async () => "http://localhost"
}));

vi.mock("@/lib/billing/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/billing/server")>();
  return {
    ...actual,
    assertPaymentPlanBillingCompatibility: (...args: unknown[]) => assertPaymentPlanBillingCompatibilityMock(...args),
    syncPaymentTransactionBilling: (...args: unknown[]) => syncPaymentTransactionBillingMock(...args)
  };
});

vi.mock("@/lib/payments/yookassa", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/payments/yookassa")>();
  return {
    ...actual,
    createYooKassaPayment: (...args: unknown[]) => createYooKassaPaymentMock(...args),
    getYooKassaPayment: (...args: unknown[]) => getYooKassaPaymentMock(...args)
  };
});

function mockPaymentTransactionAdminUpdate(error: unknown = null) {
  const maybeSingleMock = vi.fn().mockResolvedValue({ data: { id: "tx-1" }, error });
  const selectMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
  const updateEqStudentMock = vi.fn(() => ({ select: selectMock }));
  const updateEqIdMock = vi.fn(() => ({ eq: updateEqStudentMock }));
  const updateMock = vi.fn(() => ({ eq: updateEqIdMock }));
  const adminClient = {
    from: vi.fn((table: string) => {
      if (table === "payment_transactions") {
        return { update: updateMock };
      }

      throw new Error(`Unexpected table ${table}`);
    })
  };

  adminClientMock.mockReturnValue(adminClient);
  return { adminClient, updateMock, updateEqIdMock, updateEqStudentMock, selectMock, maybeSingleMock };
}

describe("student YooKassa payment service", () => {
  beforeEach(() => {
    vi.resetModules();
    serverRpcMock.mockReset();
    adminClientMock.mockReset();
    createYooKassaPaymentMock.mockReset();
    getYooKassaPaymentMock.mockReset();
    assertPaymentPlanBillingCompatibilityMock.mockReset();
    syncPaymentTransactionBillingMock.mockReset();
  });

  it("creates checkout through user-scoped RPCs", async () => {
    serverRpcMock.mockImplementation((fn: string) => {
      if (fn === "create_current_student_payment_transaction") {
        return Promise.resolve({
          data: [
            {
              transaction_id: "tx-1",
              amount: 1200,
              currency: "RUB",
              title: "Тариф",
              description: "Описание",
              receipt_label: "Уроки английского",
              student_id: "student-1",
              user_id: "user-1",
              customer_email: "student@example.com",
              plan_id: "plan-1"
            }
          ],
          error: null
        });
      }

      throw new Error(`Unexpected RPC ${fn}`);
    });
    const adminUpdate = mockPaymentTransactionAdminUpdate();
    createYooKassaPaymentMock.mockResolvedValue({
      id: "provider-payment-1",
      status: "pending",
      confirmation: {
        confirmation_url: "https://pay.example/tx-1"
      },
      amount: {
        value: "1200.00",
        currency: "RUB"
      }
    });

    const { createCheckoutForCurrentStudent } = await import("@/lib/payments/server");

    const result = await createCheckoutForCurrentStudent("plan-1");

    expect(adminClientMock).toHaveBeenCalledTimes(1);
    expect(assertPaymentPlanBillingCompatibilityMock).toHaveBeenCalledWith("student-1", "plan-1", expect.objectContaining({ rpc: serverRpcMock }));
    expect(serverRpcMock).toHaveBeenCalledWith("create_current_student_payment_transaction", expect.objectContaining({
      p_plan_id: "plan-1",
      p_return_url: expect.stringContaining("/settings/payments?payment="),
      p_idempotence_key: expect.any(String)
    }));
    expect(serverRpcMock).toHaveBeenCalledTimes(1);
    expect(adminUpdate.adminClient.from).toHaveBeenCalledWith("payment_transactions");
    expect(adminUpdate.updateMock).toHaveBeenCalledWith(expect.objectContaining({
      provider_payment_id: "provider-payment-1",
      status: "pending",
      raw_status: "pending"
    }));
    expect(adminUpdate.updateEqIdMock).toHaveBeenCalledWith("id", expect.any(String));
    expect(adminUpdate.updateEqStudentMock).toHaveBeenCalledWith("student_id", "student-1");
    expect(result).toEqual({
      transactionId: expect.any(String),
      redirectUrl: "https://pay.example/tx-1"
    });
  });

  it("loads and refreshes current student transaction status through user-scoped RPCs", async () => {
    const createdAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    serverRpcMock.mockImplementation((fn: string) => {
      if (fn === "load_current_student_payment_transaction_status") {
        return Promise.resolve({
          data: [
            {
              id: "tx-1",
              student_id: "student-1",
              status: "pending",
              provider_payment_id: "provider-payment-1",
              created_at: createdAt
            }
          ],
          error: null
        });
      }

      throw new Error(`Unexpected RPC ${fn}`);
    });
    const adminUpdate = mockPaymentTransactionAdminUpdate();
    getYooKassaPaymentMock.mockResolvedValue({
      id: "provider-payment-1",
      status: "succeeded",
      paid_at: "2026-05-20T08:00:00.000Z",
      confirmation: {},
      amount: {
        value: "1200.00",
        currency: "RUB"
      }
    });

    const { syncCurrentStudentTransaction } = await import("@/lib/payments/server");

    const result = await syncCurrentStudentTransaction("tx-1");

    expect(adminClientMock).toHaveBeenCalledTimes(1);
    expect(serverRpcMock).toHaveBeenCalledWith("load_current_student_payment_transaction_status", {
      p_transaction_id: "tx-1"
    });
    expect(serverRpcMock).toHaveBeenCalledTimes(1);
    expect(adminUpdate.updateMock).toHaveBeenCalledWith(expect.objectContaining({
      provider_payment_id: "provider-payment-1",
      status: "succeeded",
      raw_status: "succeeded",
      paid_at: "2026-05-20T08:00:00.000Z"
    }));
    expect(adminUpdate.updateEqIdMock).toHaveBeenCalledWith("id", "tx-1");
    expect(adminUpdate.updateEqStudentMock).toHaveBeenCalledWith("student_id", "student-1");
    expect(syncPaymentTransactionBillingMock).toHaveBeenCalledWith("tx-1", expect.objectContaining({ rpc: serverRpcMock }));
    expect(result).toMatchObject({
      transactionId: "tx-1",
      status: "succeeded",
      tone: "success"
    });
  });

  it("processes YooKassa webhooks through the privileged provider client", async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const eventEqProviderEventIdMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
    const eventEqProviderMock = vi.fn(() => ({ eq: eventEqProviderEventIdMock }));
    const eventSelectMock = vi.fn(() => ({ eq: eventEqProviderMock }));
    const insertEventMock = vi.fn().mockResolvedValue({ error: null });
    const updateEventEqProviderEventIdMock = vi.fn().mockResolvedValue({ error: null });
    const updateEventEqProviderMock = vi.fn(() => ({ eq: updateEventEqProviderEventIdMock }));
    const updateEventMock = vi.fn(() => ({ eq: updateEventEqProviderMock }));

    const transactionUpdateEqPaymentMock = vi.fn().mockResolvedValue({ error: null });
    const transactionUpdateEqProviderMock = vi.fn(() => ({ eq: transactionUpdateEqPaymentMock }));
    const transactionUpdateMock = vi.fn(() => ({ eq: transactionUpdateEqProviderMock }));
    const transactionSelectEqPaymentMock = vi.fn().mockResolvedValue({ data: [{ id: "tx-1" }], error: null });
    const transactionSelectEqProviderMock = vi.fn(() => ({ eq: transactionSelectEqPaymentMock }));
    const transactionSelectMock = vi.fn(() => ({ eq: transactionSelectEqProviderMock }));

    const adminClient = {
      from: vi.fn((table: string) => {
        if (table === "payment_webhook_events") {
          return {
            select: eventSelectMock,
            insert: insertEventMock,
            update: updateEventMock
          };
        }

        if (table === "payment_transactions") {
          return {
            update: transactionUpdateMock,
            select: transactionSelectMock
          };
        }

        throw new Error(`Unexpected table ${table}`);
      })
    };
    adminClientMock.mockReturnValue(adminClient);
    getYooKassaPaymentMock.mockResolvedValue({
      id: "provider-payment-1",
      status: "succeeded",
      paid_at: "2026-05-20T08:00:00.000Z",
      confirmation: {},
      amount: {
        value: "1200.00",
        currency: "RUB"
      }
    });

    const { processYooKassaWebhook } = await import("@/lib/payments/server");

    const result = await processYooKassaWebhook(
      {
        event: "payment.succeeded",
        object: {
          id: "provider-payment-1",
          status: "succeeded"
        }
      },
      null
    );

    expect(adminClientMock).toHaveBeenCalledTimes(1);
    expect(serverRpcMock).not.toHaveBeenCalled();
    expect(adminClient.from).toHaveBeenCalledWith("payment_webhook_events");
    expect(adminClient.from).toHaveBeenCalledWith("payment_transactions");
    expect(syncPaymentTransactionBillingMock).toHaveBeenCalledWith("tx-1", adminClient);
    expect(result).toEqual({ duplicate: false });
  });
});
