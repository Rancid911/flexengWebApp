import { beforeEach, describe, expect, it, vi } from "vitest";

type RpcResponse = {
  data: unknown;
  error: { message: string } | null;
};

type BillingAccountResponse = {
  data: unknown;
  error: { message: string } | null;
};

type LedgerResponse = {
  data: unknown[];
  error: { message: string } | null;
};

let rpcResponse: RpcResponse;
let billingAccountResponse: BillingAccountResponse;
let recentLedgerResponse: LedgerResponse;
let fullLedgerResponse: LedgerResponse;

vi.mock("@/lib/server/timing", () => ({
  measureServerTiming: async (_label: string, callback: () => unknown) => await callback()
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: vi.fn(async () => rpcResponse),
    from: vi.fn((table: string) => {
      if (table === "student_billing_accounts") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue(billingAccountResponse)
        };
      }

      if (table === "student_billing_ledger") {
        const orderedQuery = {
          limit: vi.fn().mockResolvedValue(recentLedgerResponse),
          then: (onFulfilled: (value: LedgerResponse) => unknown, onRejected?: (reason: unknown) => unknown) =>
            Promise.resolve(fullLedgerResponse).then(onFulfilled, onRejected)
        };

        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnValue(orderedQuery)
        };
      }

      throw new Error(`Unexpected table ${table}`);
    })
  })
}));

describe("getBillingSummaryByStudentId", () => {
  beforeEach(() => {
    rpcResponse = {
      data: [
        {
          remaining_lesson_units: 2,
          remaining_money_amount: 0,
          effective_lesson_price_amount: null,
          effective_lesson_price_currency: null
        }
      ],
      error: null
    };
    billingAccountResponse = {
      data: {
        id: "account-1",
        student_id: "student-1",
        billing_mode: "package_lessons",
        lesson_price_amount: null,
        currency: "RUB",
        created_at: null,
        updated_at: null
      },
      error: null
    };
    recentLedgerResponse = {
      data: [
        {
          id: "entry-1",
          student_id: "student-1",
          entry_direction: "credit",
          unit_type: "lesson",
          lesson_units: 2,
          money_amount: null,
          reason: "payment",
          payment_transaction_id: null,
          schedule_lesson_id: null,
          payment_plan_id: null,
          effective_lesson_price_amount: null,
          effective_lesson_price_currency: null,
          description: null,
          created_at: "2026-04-05T10:00:00.000Z"
        }
      ],
      error: null
    };
    fullLedgerResponse = {
      data: [
        {
          id: "entry-2",
          student_id: "student-1",
          entry_direction: "debit",
          unit_type: "lesson",
          lesson_units: 1,
          money_amount: null,
          reason: "lesson_charge",
          payment_transaction_id: null,
          schedule_lesson_id: null,
          payment_plan_id: null,
          effective_lesson_price_amount: null,
          effective_lesson_price_currency: null,
          description: null,
          created_at: "2026-04-06T10:00:00.000Z"
        },
        {
          id: "entry-1",
          student_id: "student-1",
          entry_direction: "credit",
          unit_type: "lesson",
          lesson_units: 4,
          money_amount: null,
          reason: "payment",
          payment_transaction_id: null,
          schedule_lesson_id: null,
          payment_plan_id: null,
          effective_lesson_price_amount: null,
          effective_lesson_price_currency: null,
          description: null,
          created_at: "2026-04-05T10:00:00.000Z"
        }
      ],
      error: null
    };
  });

  it("uses the fast RPC summary path when aggregates are available", async () => {
    const { getBillingSummaryByStudentId } = await import("@/lib/billing/server");

    const summary = await getBillingSummaryByStudentId("student-1", 1);

    expect(summary.availableLessonCount).toBe(2);
    expect(summary.recentEntries).toHaveLength(1);
  });

  it("falls back to full ledger summary when the aggregate RPC is unavailable", async () => {
    rpcResponse = {
      data: null,
      error: {
        message: 'function public.get_student_billing_summary_aggregates(uuid) does not exist in schema cache'
      }
    };

    const { getBillingSummaryByStudentId } = await import("@/lib/billing/server");

    const summary = await getBillingSummaryByStudentId("student-1", 1);

    expect(summary.availableLessonCount).toBe(3);
    expect(summary.recentEntries).toHaveLength(1);
    expect(summary.recentEntries[0]?.id).toBe("entry-2");
  });
});
