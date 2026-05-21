import { beforeEach, describe, expect, it, vi } from "vitest";

type RpcResponse = {
  data: unknown;
  error: { message: string } | null;
};

const serverRpcMock = vi.hoisted(() => vi.fn());
const serverFromMock = vi.hoisted(() => vi.fn());
const createAdminClientMock = vi.hoisted(() => vi.fn());

let rpcResponse: RpcResponse;

vi.mock("@/lib/server/timing", () => ({
  measureServerTiming: async (_label: string, callback: () => unknown) => await callback()
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: serverFromMock,
    rpc: serverRpcMock
  })
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock
}));

describe("getBillingSummaryByStudentId", () => {
  beforeEach(() => {
    vi.resetModules();
    serverRpcMock.mockReset();
    serverFromMock.mockReset();
    createAdminClientMock.mockReset();
    rpcResponse = {
      data: [
        {
          account: {
            id: "account-1",
            student_id: "student-1",
            billing_mode: "package_lessons",
            lesson_price_amount: null,
            currency: "RUB",
            created_at: null,
            updated_at: null
          },
          remaining_lesson_units: 2,
          remaining_money_amount: 0,
          effective_lesson_price_amount: null,
          effective_lesson_price_currency: null,
          recent_entries: [
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
          ]
        }
      ],
      error: null
    };
    serverRpcMock.mockImplementation(async () => rpcResponse);
  });

  it("uses the user-scoped billing summary RPC", async () => {
    const { getBillingSummaryByStudentId } = await import("@/lib/billing/server");

    const summary = await getBillingSummaryByStudentId("student-1", 1);

    expect(serverRpcMock).toHaveBeenCalledWith("get_accessible_student_billing_summary", {
      p_student_id: "student-1",
      p_recent_entries_limit: 1
    });
    expect(createAdminClientMock).not.toHaveBeenCalled();
    expect(summary.availableLessonCount).toBe(2);
    expect(summary.recentEntries).toHaveLength(1);
    expect(summary.recentEntries[0]?.id).toBe("entry-1");
  });

  it("fails closed when the billing summary RPC is unavailable", async () => {
    rpcResponse = {
      data: null,
      error: {
        message: "function public.get_accessible_student_billing_summary(uuid, integer) does not exist in schema cache"
      }
    };

    const { getBillingSummaryByStudentId } = await import("@/lib/billing/server");

    await expect(getBillingSummaryByStudentId("student-1", 1)).rejects.toMatchObject({
      code: "BILLING_SUMMARY_FETCH_FAILED"
    });
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("updates billing settings with the user-scoped repository after staff guard", async () => {
    const accountQuery = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "account-1",
          student_id: "student-1",
          billing_mode: "per_lesson_price",
          lesson_price_amount: 2500,
          currency: "RUB",
          created_at: null,
          updated_at: null
        },
        error: null
      })
    };
    serverFromMock.mockImplementation((table: string) => {
      if (table === "student_billing_accounts") return accountQuery;
      throw new Error(`Unexpected table ${table}`);
    });

    const { updateStudentBillingSettings } = await import("@/lib/billing/server");

    await updateStudentBillingSettings(
      { userId: "manager-1", role: "manager" } as Parameters<typeof updateStudentBillingSettings>[0],
      "student-1",
      { billingMode: "per_lesson_price", lessonPriceAmount: 2500 }
    );

    expect(serverFromMock).toHaveBeenCalledWith("student_billing_accounts");
    expect(accountQuery.upsert).toHaveBeenCalledWith(
      {
        student_id: "student-1",
        billing_mode: "per_lesson_price",
        lesson_price_amount: 2500,
        currency: "RUB",
        updated_by_profile_id: "manager-1"
      },
      { onConflict: "student_id" }
    );
    expect(serverRpcMock).toHaveBeenCalledWith("get_accessible_student_billing_summary", {
      p_student_id: "student-1",
      p_recent_entries_limit: 8
    });
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("creates manual billing adjustments with the user-scoped repository", async () => {
    const accountQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
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
      })
    };
    const ledgerQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          effective_lesson_price_amount: 1500,
          effective_lesson_price_currency: "RUB"
        },
        error: null
      }),
      insert: vi.fn().mockResolvedValue({ error: null })
    };
    serverFromMock.mockImplementation((table: string) => {
      if (table === "student_billing_accounts") return accountQuery;
      if (table === "student_billing_ledger") return ledgerQuery;
      throw new Error(`Unexpected table ${table}`);
    });

    const { createStudentBillingAdjustment } = await import("@/lib/billing/server");

    await createStudentBillingAdjustment(
      { userId: "manager-1", role: "manager" } as Parameters<typeof createStudentBillingAdjustment>[0],
      "student-1",
      { unitType: "lesson", direction: "credit", value: 2, description: "Manual correction" }
    );

    expect(serverFromMock).toHaveBeenCalledWith("student_billing_accounts");
    expect(serverFromMock).toHaveBeenCalledWith("student_billing_ledger");
    expect(ledgerQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
      student_id: "student-1",
      entry_direction: "credit",
      unit_type: "lesson",
      lesson_units: 2,
      reason: "manual_adjustment",
      created_by_profile_id: "manager-1",
      description: "Manual correction"
    }));
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("denies billing settings update before creating a DB client", async () => {
    const { updateStudentBillingSettings } = await import("@/lib/billing/server");

    await expect(
      updateStudentBillingSettings(
        { userId: "teacher-1", role: "teacher", teacherId: "teacher-1", accessibleStudentIds: ["student-1"] } as Parameters<typeof updateStudentBillingSettings>[0],
        "student-1",
        { billingMode: "per_lesson_price", lessonPriceAmount: 2500 }
      )
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    expect(serverFromMock).not.toHaveBeenCalled();
    expect(serverRpcMock).not.toHaveBeenCalled();
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });
});
