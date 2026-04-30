import { describe, expect, it } from "vitest";

import type { StudentBillingSummary } from "@/lib/billing/types";
import {
  createStudentPaymentReminderPopup,
  resolveStudentPaymentReminderStatus,
  resolveStudentPaymentReminderForDashboard,
  shouldSendReminderNotificationToday,
  shouldShowReminderPopupToday
} from "@/lib/billing/reminders";

function makeSummary(overrides: Partial<StudentBillingSummary> = {}): StudentBillingSummary {
  return {
    studentId: "student-1",
    account: null,
    currentMode: "package_lessons",
    currency: "RUB",
    lessonPriceAmount: null,
    effectiveLessonPriceAmount: 1800,
    effectiveLessonPriceCurrency: "RUB",
    availableLessonCount: 3,
    moneyRemainderAmount: 0,
    debtLessonCount: 0,
    remainingLessonUnits: 3,
    remainingMoneyAmount: 0,
    debtLessonUnits: 0,
    debtMoneyAmount: 0,
    isNegative: false,
    hasAccount: true,
    recentEntries: [],
    ...overrides
  };
}

function makeReminderAdminClient(summary: StudentBillingSummary, nextScheduledLessonAt: string | null) {
  const ledgerEntries =
    summary.currentMode === "package_lessons"
      ? summary.remainingLessonUnits === 0
        ? []
        : [
            {
              id: "ledger-lesson",
              student_id: summary.studentId,
              entry_direction: summary.remainingLessonUnits > 0 ? "credit" : "debit",
              unit_type: "lesson",
              lesson_units: Math.abs(summary.remainingLessonUnits),
              money_amount: null,
              reason: summary.remainingLessonUnits > 0 ? "payment" : "lesson_charge",
              payment_transaction_id: null,
              schedule_lesson_id: null,
              payment_plan_id: null,
              effective_lesson_price_amount: null,
              effective_lesson_price_currency: summary.currency,
              description: null,
              created_at: "2026-03-28T10:00:00.000Z"
            }
          ]
      : [];

  return {
    from: (table: string) => {
      if (table === "student_billing_accounts") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "account-1",
                  student_id: summary.studentId,
                  billing_mode: summary.currentMode,
                  lesson_price_amount: summary.lessonPriceAmount,
                  currency: summary.currency,
                  created_at: null,
                  updated_at: null
                },
                error: null
              })
            })
          })
        };
      }

      if (table === "student_billing_ledger") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: ledgerEntries,
                error: null
              })
            })
          })
        };
      }

      if (table === "student_schedule_lessons") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                gte: () => ({
                  lte: () => ({
                    order: () => ({
                      limit: () => ({
                        maybeSingle: async () => ({
                          data: nextScheduledLessonAt ? { starts_at: nextScheduledLessonAt } : null,
                          error: null
                        })
                      })
                    })
                  })
                })
              })
            })
          })
        };
      }

      throw new Error(`Unexpected table ${table}`);
    }
  };
}

describe("payment reminders", () => {
  it("resolves debt before low balance", () => {
    expect(resolveStudentPaymentReminderStatus(makeSummary({ isNegative: true, availableLessonCount: 0, debtLessonCount: 1 }), 1)).toBe("debt");
    expect(resolveStudentPaymentReminderStatus(makeSummary({ availableLessonCount: 1 }), 1)).toBe("low_balance");
    expect(resolveStudentPaymentReminderStatus(makeSummary({ availableLessonCount: 2 }), 1)).toBe("none");
  });

  it("does not repeat notification and popup on the same Moscow day for the same status", () => {
    const state = {
      studentId: "student-1",
      currentStatus: "low_balance" as const,
      lastStatusChangedAt: "2026-03-27T08:00:00.000Z",
      lastNotificationSentAt: "2026-03-27T09:00:00.000Z",
      lastPopupShownAt: "2026-03-27T09:30:00.000Z",
      lastThresholdLessons: 1,
      updatedAt: "2026-03-27T09:30:00.000Z"
    };

    expect(shouldSendReminderNotificationToday(state, "low_balance", new Date("2026-03-27T20:00:00.000Z"))).toBe(false);
    expect(shouldShowReminderPopupToday(state, "low_balance", new Date("2026-03-27T20:00:00.000Z"))).toBe(false);
    expect(shouldSendReminderNotificationToday(state, "debt", new Date("2026-03-27T20:00:00.000Z"))).toBe(true);
    expect(shouldShowReminderPopupToday(state, "debt", new Date("2026-03-27T20:00:00.000Z"))).toBe(true);
  });

  it("creates popup dto only for eligible statuses", () => {
    expect(
      createStudentPaymentReminderPopup({
        summary: makeSummary({ availableLessonCount: 1 }),
        status: "low_balance",
        title: "У вас остался 1 оплаченный урок",
        body: "Пополните оплату заранее.",
        nextScheduledLessonAt: "2026-03-29T10:00:00.000Z",
        shouldShowPopup: true
      })
    ).toMatchObject({
      status: "low_balance",
      availableLessonCount: 1
    });

    expect(
      createStudentPaymentReminderPopup({
        summary: makeSummary(),
        status: "none",
        title: null,
        body: null,
        nextScheduledLessonAt: null,
        shouldShowPopup: false
      })
    ).toBeNull();
  });

  it("shows dashboard popup for debt even without a scheduled lesson", async () => {
    const adminClient = makeReminderAdminClient(
      makeSummary({
        isNegative: true,
        availableLessonCount: 0,
        remainingLessonUnits: -1,
        debtLessonCount: 1,
        debtLessonUnits: 1,
        debtMoneyAmount: 0
      }),
      null
    );

    const result = await resolveStudentPaymentReminderForDashboard(adminClient as never, "student-1", 1);

    expect(result.status).toBe("debt");
    expect(result.shouldShowPopup).toBe(true);
  });

  it("shows dashboard popup only when there is a scheduled lesson and zero paid lessons left", async () => {
    const zeroLessonsResult = await resolveStudentPaymentReminderForDashboard(
      makeReminderAdminClient(makeSummary({ availableLessonCount: 0, remainingLessonUnits: 0 }), "2026-03-29T10:00:00.000Z") as never,
      "student-1",
      1
    );
    expect(zeroLessonsResult.status).toBe("low_balance");
    expect(zeroLessonsResult.shouldShowPopup).toBe(true);

    const oneLessonResult = await resolveStudentPaymentReminderForDashboard(
      makeReminderAdminClient(makeSummary({ availableLessonCount: 1, remainingLessonUnits: 1 }), "2026-03-29T10:00:00.000Z") as never,
      "student-1",
      1
    );
    expect(oneLessonResult.status).toBe("low_balance");
    expect(oneLessonResult.shouldShowPopup).toBe(false);

    const noScheduleResult = await resolveStudentPaymentReminderForDashboard(
      makeReminderAdminClient(makeSummary({ availableLessonCount: 0, remainingLessonUnits: 0 }), null) as never,
      "student-1",
      1
    );
    expect(noScheduleResult.status).toBe("low_balance");
    expect(noScheduleResult.shouldShowPopup).toBe(false);
  });
});
