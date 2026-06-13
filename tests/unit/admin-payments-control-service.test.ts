import { beforeEach, describe, expect, it, vi } from "vitest";

const adminFromMock = vi.hoisted(() => vi.fn());
const adminRpcMock = vi.hoisted(() => vi.fn());
const serverFromMock = vi.hoisted(() => vi.fn());
const serverRpcMock = vi.hoisted(() => vi.fn());
const getBillingSummaryByStudentIdMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  unstable_cache: (callback: () => unknown) => callback
}));

vi.mock("@/lib/server/timing", () => ({
  measureServerTiming: async (_label: string, callback: () => unknown) => await callback()
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: adminFromMock,
    rpc: adminRpcMock
  })
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: serverFromMock,
    rpc: serverRpcMock
  })
}));

vi.mock("@/lib/billing/server", () => ({
  getBillingSummaryByStudentId: (...args: unknown[]) => getBillingSummaryByStudentIdMock(...args)
}));

function makeSettingsQuery() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: {
        enabled: true,
        threshold_lessons: 2,
        updated_at: "2026-05-08T08:00:00.000Z"
      },
      error: null
    })
  };
}

function makeSettingsUpdateQuery() {
  return {
    upsert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: {
        enabled: false,
        threshold_lessons: 3,
        updated_at: "2026-05-09T08:00:00.000Z"
      },
      error: null
    })
  };
}

describe("listAdminPaymentControl", () => {
  beforeEach(() => {
    vi.resetModules();
    adminFromMock.mockReset();
    adminRpcMock.mockReset();
    serverFromMock.mockReset();
    serverRpcMock.mockReset();
    getBillingSummaryByStudentIdMock.mockReset();
    serverFromMock.mockImplementation((table: string) => {
      if (table === "admin_payment_reminder_settings") {
        return makeSettingsQuery();
      }
      throw new Error(`Unexpected server table ${table}`);
    });
  });

  it("uses user-scoped RPCs for payment-control summary data", async () => {
    serverRpcMock.mockImplementation((fn: string) => {
      if (fn === "admin_list_payment_control") {
        return Promise.resolve({
          data: [
            {
              student_id: "student-1",
              profile_id: "profile-1",
              first_name: "Иван",
              last_name: "Иванов",
              email: "ivan@example.com",
              phone: null,
              billing_mode: "package_lessons",
              available_lesson_count: 1,
              debt_lesson_count: 0,
              debt_money_amount: 0,
              money_remainder_amount: 0,
              lesson_price_amount: null,
              effective_lesson_price_amount: 1500,
              billing_currency: "RUB",
              billing_not_configured: false,
              requires_attention: true,
              billing_is_negative: false,
              total_count: 1
            }
          ],
          error: null
        });
      }

      if (fn === "admin_payment_control_stats") {
        return Promise.resolve({
          data: [
            {
              total_students: 1,
              attention_students: 1,
              debt_students: 0,
              one_lesson_left_students: 1,
              unconfigured_students: 0
            }
          ],
          error: null
        });
      }

      throw new Error(`Unexpected RPC ${fn}`);
    });

    const { listAdminPaymentControl } = await import("@/lib/admin/payments-control");

    const result = await listAdminPaymentControl(new URL("http://localhost/admin/payments?page=2&pageSize=5&q=ivan&filter=attention"));

    expect(serverFromMock).toHaveBeenCalledWith("admin_payment_reminder_settings");
    expect(adminFromMock).not.toHaveBeenCalled();
    expect(adminRpcMock).not.toHaveBeenCalled();
    expect(serverRpcMock).toHaveBeenCalledWith("admin_list_payment_control", {
      p_threshold_lessons: 2,
      p_query: "ivan",
      p_filter: "attention",
      p_page: 2,
      p_page_size: 5
    });
    expect(serverRpcMock).toHaveBeenCalledWith("admin_payment_control_stats", {
      p_threshold_lessons: 2,
      p_query: "ivan",
      p_filter: "attention"
    });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.stats.total_students).toBe(1);
  });

  it("uses the user-scoped client for payment reminder settings update", async () => {
    const settingsQuery = makeSettingsUpdateQuery();
    serverFromMock.mockImplementation((table: string) => {
      if (table === "admin_payment_reminder_settings") {
        return settingsQuery;
      }
      throw new Error(`Unexpected server table ${table}`);
    });

    const { updateAdminPaymentReminderSettings } = await import("@/lib/admin/payments-control");

    const result = await updateAdminPaymentReminderSettings(
      { userId: "admin-1" } as Parameters<typeof updateAdminPaymentReminderSettings>[0],
      {
        enabled: false,
        threshold_lessons: 3
      }
    );

    expect(serverFromMock).toHaveBeenCalledWith("admin_payment_reminder_settings");
    expect(settingsQuery.upsert).toHaveBeenCalledWith(
      {
        id: true,
        enabled: false,
        threshold_lessons: 3,
        updated_by_profile_id: "admin-1"
      },
      { onConflict: "id" }
    );
    expect(adminFromMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      enabled: false,
      threshold_lessons: 3,
      updated_at: "2026-05-09T08:00:00.000Z"
    });
  });

  it("uses the user-scoped client for manual payment reminder send", async () => {
    const studentQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "student-1",
          profile_id: "profile-1",
          profiles: {
            id: "profile-1",
            first_name: "Иван",
            last_name: "Иванов",
            email: "ivan@example.com",
            phone: null
          }
        },
        error: null
      })
    };
    const stateQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          student_id: "student-1",
          current_status: "none",
          last_status_changed_at: null,
          last_notification_sent_at: null,
          last_popup_shown_at: null,
          last_threshold_lessons: null,
          updated_at: null
        },
        error: null
      }),
      upsert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          student_id: "student-1",
          current_status: "low_balance",
          last_status_changed_at: "2026-05-09T08:00:00.000Z",
          last_notification_sent_at: "2026-05-09T08:00:00.000Z",
          last_popup_shown_at: null,
          last_threshold_lessons: 2,
          updated_at: "2026-05-09T08:00:00.000Z"
        },
        error: null
      })
    };
    const notificationQuery = {
      insert: vi.fn().mockResolvedValue({ error: null })
    };

    serverFromMock.mockImplementation((table: string) => {
      if (table === "students") return studentQuery;
      if (table === "admin_payment_reminder_settings") return makeSettingsQuery();
      if (table === "student_payment_reminder_state") return stateQuery;
      if (table === "notifications") return notificationQuery;
      throw new Error(`Unexpected server table ${table}`);
    });
    getBillingSummaryByStudentIdMock.mockResolvedValue({
      studentId: "student-1",
      account: null,
      currentMode: "package_lessons",
      currency: "RUB",
      lessonPriceAmount: null,
      effectiveLessonPriceAmount: 1500,
      effectiveLessonPriceCurrency: "RUB",
      availableLessonCount: 1,
      moneyRemainderAmount: 0,
      debtLessonCount: 0,
      remainingLessonUnits: 0,
      remainingMoneyAmount: 0,
      debtLessonUnits: 0,
      debtMoneyAmount: 0,
      isNegative: false,
      hasAccount: true,
      recentEntries: []
    });

    const { sendStudentPaymentReminder } = await import("@/lib/admin/payments-control");

    const result = await sendStudentPaymentReminder({ userId: "admin-1" } as Parameters<typeof sendStudentPaymentReminder>[0], "student-1");

    expect(serverFromMock).toHaveBeenCalledWith("students");
    expect(serverFromMock).toHaveBeenCalledWith("notifications");
    expect(serverFromMock).toHaveBeenCalledWith("student_payment_reminder_state");
    expect(adminFromMock).not.toHaveBeenCalled();
    expect(adminRpcMock).not.toHaveBeenCalled();
    expect(getBillingSummaryByStudentIdMock).toHaveBeenCalledWith("student-1", 0);
    expect(notificationQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
      target_user_ids: ["profile-1"],
      created_by: "admin-1"
    }));
    expect(stateQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: "student-1",
        current_status: "low_balance",
        last_threshold_lessons: 2
      }),
      { onConflict: "student_id" }
    );
    expect(result).toEqual({ ok: true, status: "low_balance", previous_status: "none" });
  });

  it("uses the user-scoped client for automatic payment reminder sync", async () => {
    const studentsQuery = {
      select: vi.fn().mockResolvedValue({
        data: [
          {
            id: "student-1",
            profile_id: "profile-1",
            profiles: {
              id: "profile-1",
              first_name: "Иван",
              last_name: "Иванов",
              email: "ivan@example.com",
              phone: null
            }
          }
        ],
        error: null
      })
    };
    const stateQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null
      }),
      upsert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          student_id: "student-1",
          current_status: "low_balance",
          last_status_changed_at: "2026-05-09T08:00:00.000Z",
          last_notification_sent_at: "2026-05-09T08:00:00.000Z",
          last_popup_shown_at: null,
          last_threshold_lessons: 2,
          updated_at: "2026-05-09T08:00:00.000Z"
        },
        error: null
      })
    };
    const notificationQuery = {
      insert: vi.fn().mockResolvedValue({ error: null })
    };

    serverFromMock.mockImplementation((table: string) => {
      if (table === "students") return studentsQuery;
      if (table === "student_payment_reminder_state") return stateQuery;
      if (table === "notifications") return notificationQuery;
      throw new Error(`Unexpected server table ${table}`);
    });
    getBillingSummaryByStudentIdMock.mockResolvedValue({
      studentId: "student-1",
      account: null,
      currentMode: "package_lessons",
      currency: "RUB",
      lessonPriceAmount: null,
      effectiveLessonPriceAmount: 1500,
      effectiveLessonPriceCurrency: "RUB",
      availableLessonCount: 1,
      moneyRemainderAmount: 0,
      debtLessonCount: 0,
      remainingLessonUnits: 0,
      remainingMoneyAmount: 0,
      debtLessonUnits: 0,
      debtMoneyAmount: 0,
      isNegative: false,
      hasAccount: true,
      recentEntries: []
    });

    const { syncAutomaticPaymentReminders } = await import("@/lib/admin/payments-control");

    await syncAutomaticPaymentReminders(
      { userId: "admin-1" } as Parameters<typeof syncAutomaticPaymentReminders>[0],
      { enabled: true, threshold_lessons: 2 }
    );

    expect(serverFromMock).toHaveBeenCalledWith("students");
    expect(serverFromMock).toHaveBeenCalledWith("student_payment_reminder_state");
    expect(serverFromMock).toHaveBeenCalledWith("notifications");
    expect(adminFromMock).not.toHaveBeenCalled();
    expect(adminRpcMock).not.toHaveBeenCalled();
    expect(getBillingSummaryByStudentIdMock).toHaveBeenCalledWith("student-1", 0);
    expect(notificationQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
      target_user_ids: ["profile-1"],
      created_by: "admin-1"
    }));
    expect(stateQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: "student-1",
        current_status: "low_balance",
        last_threshold_lessons: 2
      }),
      { onConflict: "student_id" }
    );
  });
});
