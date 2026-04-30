import { describe, expect, it } from "vitest";

import { BILLING_SUMMARY_ACCESS_MODE } from "@/lib/billing/server";
import { STUDENT_DASHBOARD_PAYMENT_REMINDER_ACCESS_MODE } from "@/lib/dashboard/student-dashboard";
import { buildStudentBillingSummary, formatBillingBalance, formatBillingDebt, formatBillingRemainingMoney } from "@/lib/billing/utils";
import type { StudentBillingAccount, StudentBillingLedgerEntry } from "@/lib/billing/types";

const packageAccount: StudentBillingAccount = {
  id: "account-1",
  studentId: "student-1",
  billingMode: "package_lessons",
  lessonPriceAmount: null,
  currency: "RUB",
  createdAt: null,
  updatedAt: null
};

function makeEntry(index: number, overrides: Partial<StudentBillingLedgerEntry> = {}): StudentBillingLedgerEntry {
  return {
    id: `entry-${index}`,
    studentId: "student-1",
    entryDirection: "credit",
    unitType: "lesson",
    lessonUnits: 1,
    moneyAmount: null,
    reason: "payment",
    paymentTransactionId: null,
    scheduleLessonId: null,
    paymentPlanId: null,
    effectiveLessonPriceAmount: null,
    effectiveLessonPriceCurrency: null,
    description: null,
    createdAt: `2026-03-2${index}T10:00:00.000Z`,
    ...overrides
  };
}

describe("billing utils", () => {
  it("keeps student billing summary and dashboard reminder on documented privileged exception paths", () => {
    expect(BILLING_SUMMARY_ACCESS_MODE).toBe("privileged");
    expect(STUDENT_DASHBOARD_PAYMENT_REMINDER_ACCESS_MODE).toBe("privileged");
  });

  it("builds lesson balance and debt from ledger entries", () => {
    const summary = buildStudentBillingSummary("student-1", packageAccount, [
      makeEntry(1, { lessonUnits: 4 }),
      makeEntry(2, { entryDirection: "debit", reason: "lesson_charge" }),
      makeEntry(3, { entryDirection: "debit", reason: "lesson_charge" })
    ]);

    expect(summary.availableLessonCount).toBe(2);
    expect(formatBillingBalance(summary)).toBe("2 урока");
    expect(formatBillingDebt(summary)).toBeNull();
  });

  it("converts money balance into available whole lessons and remainder", () => {
    const summary = buildStudentBillingSummary(
      "student-1",
      {
        id: "account-2",
        studentId: "student-1",
        billingMode: "per_lesson_price",
        lessonPriceAmount: 1800,
        currency: "RUB",
        createdAt: null,
        updatedAt: null
      },
      [
        makeEntry(1, {
          unitType: "money",
          lessonUnits: null,
          moneyAmount: 10000,
          reason: "payment",
          effectiveLessonPriceAmount: 1800,
          effectiveLessonPriceCurrency: "RUB"
        })
      ]
    );

    expect(summary.availableLessonCount).toBe(5);
    expect(summary.moneyRemainderAmount).toBe(1000);
    expect(formatBillingBalance(summary)).toBe("5 уроков");
  });

  it("marks negative money balance as debt for per-lesson mode", () => {
    const summary = buildStudentBillingSummary(
      "student-1",
      {
        id: "account-2",
        studentId: "student-1",
        billingMode: "per_lesson_price",
        lessonPriceAmount: 1800,
        currency: "RUB",
        createdAt: null,
        updatedAt: null
      },
      [
        makeEntry(1, {
          unitType: "money",
          lessonUnits: null,
          moneyAmount: 1800,
          reason: "payment"
        }),
        makeEntry(2, {
          entryDirection: "debit",
          unitType: "money",
          lessonUnits: null,
          moneyAmount: 3600,
          reason: "lesson_charge"
        })
      ]
    );

    expect(summary.remainingMoneyAmount).toBe(-1800);
    expect(summary.isNegative).toBe(true);
    expect(summary.debtLessonCount).toBe(1);
    expect(formatBillingDebt(summary)).toContain("1 урок");
  });

  it("formats full money balance for configured billing account", () => {
    const summary = buildStudentBillingSummary(
      "student-1",
      {
        id: "account-2",
        studentId: "student-1",
        billingMode: "per_lesson_price",
        lessonPriceAmount: 1800,
        currency: "RUB",
        createdAt: null,
        updatedAt: null
      },
      [
        makeEntry(1, {
          unitType: "money",
          lessonUnits: null,
          moneyAmount: 10000,
          reason: "payment",
          effectiveLessonPriceAmount: 1800,
          effectiveLessonPriceCurrency: "RUB"
        })
      ]
    );

    expect(formatBillingRemainingMoney(summary)).toBe("10 000 ₽");
  });
});
