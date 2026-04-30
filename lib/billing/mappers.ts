import type { StudentBillingAccount, StudentBillingLedgerEntry, StudentBillingMode } from "@/lib/billing/types";

export type BillingAccountRow = {
  id: string;
  student_id: string;
  billing_mode: StudentBillingMode;
  lesson_price_amount: number | string | null;
  currency: string;
  created_at: string | null;
  updated_at: string | null;
};

export type BillingLedgerRow = {
  id: string;
  student_id: string;
  entry_direction: "credit" | "debit";
  unit_type: "lesson" | "money";
  lesson_units: number | string | null;
  money_amount: number | string | null;
  reason: "payment" | "lesson_charge" | "manual_adjustment" | "refund";
  payment_transaction_id: string | null;
  schedule_lesson_id: string | null;
  payment_plan_id: string | null;
  effective_lesson_price_amount: number | string | null;
  effective_lesson_price_currency: string | null;
  description: string | null;
  created_at: string | null;
};

export type PaymentPlanBillingRow = {
  billing_credit_type: "lesson" | "money" | null;
  credit_lesson_units: number | string | null;
  credit_money_amount: number | string | null;
};

export type PaymentTransactionWithPlanRow = {
  id: string;
  student_id: string | null;
  status: string;
  plan_id: string | null;
  amount: number | string;
  currency: string;
  payment_plans:
    | ({ id: string } & PaymentPlanBillingRow)
    | Array<{ id: string } & PaymentPlanBillingRow>
    | null;
};

export type BillingSummaryAggregateRow = {
  remaining_lesson_units: number | string | null;
  remaining_money_amount: number | string | null;
  effective_lesson_price_amount: number | string | null;
  effective_lesson_price_currency: string | null;
};

export type LessonRow = {
  id: string;
  student_id: string;
  teacher_id: string;
  title: string;
};

export function normalizeAccount(row: BillingAccountRow | null): StudentBillingAccount | null {
  if (!row) return null;
  return {
    id: row.id,
    studentId: row.student_id,
    billingMode: row.billing_mode,
    lessonPriceAmount: row.lesson_price_amount == null ? null : Number(row.lesson_price_amount),
    currency: row.currency ?? "RUB",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function normalizeLedger(rows: BillingLedgerRow[]): StudentBillingLedgerEntry[] {
  return rows.map((row) => ({
    id: row.id,
    studentId: row.student_id,
    entryDirection: row.entry_direction,
    unitType: row.unit_type,
    lessonUnits: row.lesson_units == null ? null : Number(row.lesson_units),
    moneyAmount: row.money_amount == null ? null : Number(row.money_amount),
    reason: row.reason,
    paymentTransactionId: row.payment_transaction_id,
    scheduleLessonId: row.schedule_lesson_id,
    paymentPlanId: row.payment_plan_id,
    effectiveLessonPriceAmount: row.effective_lesson_price_amount == null ? null : Number(row.effective_lesson_price_amount),
    effectiveLessonPriceCurrency: row.effective_lesson_price_currency ?? null,
    description: row.description,
    createdAt: row.created_at
  }));
}

export function readPlanRelation(
  relation: PaymentTransactionWithPlanRow["payment_plans"]
): ({ id: string } & PaymentPlanBillingRow) | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation ?? null;
}
