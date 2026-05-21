import type { StudentBillingMode, StudentBillingSummary } from "@/lib/billing/types";
import { buildStudentBillingSummaryFromAggregates } from "@/lib/billing/utils";
import { createBillingLedgerRepository, type BillingLedgerRepositoryClient } from "@/lib/billing/ledger.repository";
import {
  normalizeAccount,
  normalizeLedger,
  readPlanRelation,
  type BillingAccountRow,
  type BillingLedgerRow,
  type LessonRow,
  type PaymentPlanBillingRow,
  type PaymentTransactionWithPlanRow
} from "@/lib/billing/mappers";
import { measureServerTiming } from "@/lib/server/timing";
import { getCurrentStudentProfile } from "@/lib/students/current-student";
import { BillingHttpError } from "@/lib/billing/http";
import type { ScheduleActor } from "@/lib/schedule/server";
import {
  assertStaffAdminCapability,
  assertTeacherCapability,
  assertTeacherScope,
  isStudentScheduleActor,
  isTeacherScheduleActor
} from "@/lib/schedule/server";
import type { AccessMode } from "@/lib/supabase/access";
import { createClient } from "@/lib/supabase/server";

export const BILLING_SUMMARY_ACCESS_MODE: AccessMode = "user_scoped";
export const BILLING_MANAGE_ACCESS_MODE: AccessMode = "user_scoped";
export const BILLING_TRANSACTION_SYNC_ACCESS_MODE: AccessMode = "privileged";

type BillingRepository = ReturnType<typeof createBillingLedgerRepository>;
type AccessibleBillingSummaryRow = {
  account: BillingAccountRow | null;
  remaining_lesson_units: number | string | null;
  remaining_money_amount: number | string | null;
  effective_lesson_price_amount: number | string | null;
  effective_lesson_price_currency: string | null;
  recent_entries: BillingLedgerRow[] | null;
};

async function loadBillingAccount(repository: BillingRepository, studentId: string) {
  const response = await repository.loadBillingAccount(studentId);
  if (response.error) {
    throw new BillingHttpError(500, "BILLING_ACCOUNT_FETCH_FAILED", "Failed to load billing account", response.error.message);
  }

  return normalizeAccount((response.data ?? null) as BillingAccountRow | null);
}

async function loadLatestEffectiveLessonPrice(repository: BillingRepository, studentId: string) {
  const response = await repository.loadLatestEffectiveLessonPrice(studentId);
  if (response.error) {
    throw new BillingHttpError(500, "BILLING_EFFECTIVE_PRICE_FETCH_FAILED", "Failed to load effective lesson price", response.error.message);
  }

  return {
    amount: response.data?.effective_lesson_price_amount == null ? null : Number(response.data.effective_lesson_price_amount),
    currency: response.data?.effective_lesson_price_currency == null ? null : String(response.data.effective_lesson_price_currency)
  };
}

async function ensureBillingAccount(
  repository: BillingRepository,
  studentId: string,
  payload: {
    billingMode: StudentBillingMode;
    lessonPriceAmount?: number | null;
    currency?: string;
    updatedByProfileId?: string | null;
  }
) {
  const response = await repository.upsertBillingAccount(studentId, payload);
  if (response.error) {
    throw new BillingHttpError(500, "BILLING_ACCOUNT_SAVE_FAILED", "Failed to save billing account", response.error.message);
  }

  return normalizeAccount(response.data as BillingAccountRow);
}

function assertBillingViewAccess(actor: ScheduleActor, studentId: string) {
  if (isStudentScheduleActor(actor) && actor.studentId !== studentId) {
    throw new BillingHttpError(403, "FORBIDDEN", "Billing access denied");
  }

  if (isTeacherScheduleActor(actor)) {
    assertTeacherCapability(actor);
    assertTeacherScope(actor, { studentId });
  }
}

function assertBillingManageAccess(actor: ScheduleActor) {
  assertStaffAdminCapability(actor);
}

export async function getBillingSummaryByStudentId(studentId: string, recentEntriesLimit = 8): Promise<StudentBillingSummary> {
  return measureServerTiming("billing-summary-data", async () => {
    void BILLING_SUMMARY_ACCESS_MODE;
    const supabase = await createClient();
    const response = await measureServerTiming("billing-summary-rpc", async () =>
      await supabase.rpc("get_accessible_student_billing_summary", {
        p_student_id: studentId,
        p_recent_entries_limit: recentEntriesLimit
      })
    );

    if (response.error) {
      throw new BillingHttpError(500, "BILLING_SUMMARY_FETCH_FAILED", "Failed to load billing summary", response.error.message);
    }

    const row = ((response.data ?? []) as AccessibleBillingSummaryRow[])[0] ?? null;
    if (!row) {
      throw new BillingHttpError(403, "FORBIDDEN", "Billing access denied");
    }

    return buildStudentBillingSummaryFromAggregates(
      studentId,
      normalizeAccount(row.account),
      {
        remainingLessonUnits: row.remaining_lesson_units == null ? 0 : Number(row.remaining_lesson_units),
        remainingMoneyAmount: row.remaining_money_amount == null ? 0 : Number(row.remaining_money_amount),
        effectiveLessonPriceAmount: row.effective_lesson_price_amount == null ? null : Number(row.effective_lesson_price_amount),
        effectiveLessonPriceCurrency: row.effective_lesson_price_currency ?? null
      },
      normalizeLedger((row.recent_entries ?? []) as BillingLedgerRow[])
    );
  });
}

export async function getBillingSummaryForActor(actor: ScheduleActor, studentId: string, recentEntriesLimit = 8): Promise<StudentBillingSummary> {
  assertBillingViewAccess(actor, studentId);
  return getBillingSummaryByStudentId(studentId, recentEntriesLimit);
}

export async function getCurrentStudentBillingSummary(recentEntriesLimit = 8): Promise<StudentBillingSummary | null> {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return null;
  return getBillingSummaryByStudentId(profile.studentId, recentEntriesLimit);
}

export async function updateStudentBillingSettings(actor: ScheduleActor, studentId: string, payload: {
  billingMode: StudentBillingMode | null;
  lessonPriceAmount: number | null;
}) {
  void BILLING_MANAGE_ACCESS_MODE;
  assertBillingManageAccess(actor);
  const supabase = await createClient();
  const repository = createBillingLedgerRepository(supabase);

  if (!payload.billingMode) {
    const response = await repository.deleteBillingAccount(studentId);
    if (response.error) {
      throw new BillingHttpError(500, "BILLING_ACCOUNT_DELETE_FAILED", "Failed to clear billing settings", response.error.message);
    }
    return getBillingSummaryByStudentId(studentId);
  }

  await ensureBillingAccount(repository, studentId, {
    billingMode: payload.billingMode,
    lessonPriceAmount: payload.lessonPriceAmount,
    updatedByProfileId: actor.userId
  });

  return getBillingSummaryByStudentId(studentId);
}

export async function createStudentBillingAdjustment(actor: ScheduleActor, studentId: string, payload: {
  unitType: "lesson" | "money";
  direction: "credit" | "debit";
  value: number;
  description?: string | null;
}) {
  void BILLING_MANAGE_ACCESS_MODE;
  assertBillingManageAccess(actor);
  const supabase = await createClient();
  const repository = createBillingLedgerRepository(supabase);
  let account = await loadBillingAccount(repository, studentId);
  const latestLessonPrice = await loadLatestEffectiveLessonPrice(repository, studentId);
  if (!account) {
    if (payload.unitType === "money") {
      throw new BillingHttpError(400, "LESSON_PRICE_REQUIRED", "Для денежных корректировок сначала настройте цену урока");
    }
    account = await ensureBillingAccount(repository, studentId, {
      billingMode: "package_lessons",
      lessonPriceAmount: null,
      updatedByProfileId: actor.userId
    });
  }

  if (payload.unitType === "money" && (!account?.lessonPriceAmount || account.lessonPriceAmount <= 0)) {
    throw new BillingHttpError(400, "LESSON_PRICE_REQUIRED", "Для денежных корректировок сначала настройте цену урока");
  }

  const insertPayload =
    payload.unitType === "lesson"
      ? {
          student_id: studentId,
          entry_direction: payload.direction,
          unit_type: "lesson",
          lesson_units: Math.round(payload.value),
          money_amount: null,
          reason: "manual_adjustment",
          effective_lesson_price_amount: latestLessonPrice.amount,
          effective_lesson_price_currency: latestLessonPrice.currency ?? account?.currency ?? "RUB",
          created_by_profile_id: actor.userId,
          description: payload.description ?? null
        }
      : {
          student_id: studentId,
          entry_direction: payload.direction,
          unit_type: "money",
          lesson_units: null,
          money_amount: Number(payload.value),
          reason: "manual_adjustment",
          effective_lesson_price_amount: account?.lessonPriceAmount ?? latestLessonPrice.amount,
          effective_lesson_price_currency: account?.currency ?? latestLessonPrice.currency ?? "RUB",
          created_by_profile_id: actor.userId,
          description: payload.description ?? null
        };

  const response = await repository.insertLedgerEntry(insertPayload);
  if (response.error) {
    throw new BillingHttpError(500, "BILLING_ADJUSTMENT_FAILED", "Failed to save billing adjustment", response.error.message);
  }

  return getBillingSummaryByStudentId(studentId);
}

export async function assertPaymentPlanBillingCompatibility(studentId: string, planId: string, client: BillingLedgerRepositoryClient) {
  void BILLING_TRANSACTION_SYNC_ACCESS_MODE;
  const repository = createBillingLedgerRepository(client);
  const [accountResponse, planResponse] = await repository.loadBillingCompatibility(studentId, planId);

  if (accountResponse.error || planResponse.error) {
    throw new BillingHttpError(500, "BILLING_COMPATIBILITY_CHECK_FAILED", "Failed to validate billing mode");
  }

  const account = accountResponse.data as { billing_mode?: StudentBillingMode | null; lesson_price_amount?: number | string | null } | null;
  const plan = planResponse.data as PaymentPlanBillingRow | null;
  const billingMode = account?.billing_mode;
  const creditType = plan?.billing_credit_type;
  if (!billingMode || !creditType) return;

  if (creditType === "lesson" && Number(plan?.credit_lesson_units ?? 0) <= 0) {
    throw new BillingHttpError(400, "PAYMENT_PLAN_INVALID", "Для пакетного тарифа должно быть указано количество уроков");
  }

  if (creditType === "money" && Number(plan?.credit_money_amount ?? 0) <= 0) {
    throw new BillingHttpError(400, "PAYMENT_PLAN_INVALID", "Для денежного тарифа должна быть указана сумма пополнения");
  }

  if (billingMode === "package_lessons" && creditType === "money") {
    throw new BillingHttpError(400, "PAYMENT_PLAN_INCOMPATIBLE", "Этот тариф несовместим с режимом списания по пакету уроков");
  }

  if (billingMode === "per_lesson_price" && creditType === "lesson") {
    throw new BillingHttpError(400, "PAYMENT_PLAN_INCOMPATIBLE", "Этот тариф несовместим с режимом списания по цене урока");
  }

  if (creditType === "money" && Number(account?.lesson_price_amount ?? 0) <= 0) {
    throw new BillingHttpError(400, "LESSON_PRICE_REQUIRED", "Для пополнения баланса должна быть настроена цена урока");
  }
}

export async function syncPaymentTransactionBilling(transactionId: string, client: BillingLedgerRepositoryClient) {
  void BILLING_TRANSACTION_SYNC_ACCESS_MODE;
  const repository = createBillingLedgerRepository(client);
  const txResponse = await repository.loadPaymentTransactionWithPlan(transactionId);

  if (txResponse.error) {
    throw new BillingHttpError(500, "PAYMENT_BILLING_SYNC_FAILED", "Failed to load payment transaction", txResponse.error.message);
  }

  const transaction = txResponse.data as PaymentTransactionWithPlanRow | null;
  if (!transaction || transaction.status !== "succeeded" || !transaction.student_id) {
    return;
  }

  const plan = readPlanRelation(transaction.payment_plans);
  if (!plan?.billing_credit_type) return;

  const existingEntry = await repository.loadExistingPaymentCreditEntry(transaction.id);
  if (existingEntry.error) {
    throw new BillingHttpError(500, "PAYMENT_BILLING_SYNC_FAILED", "Failed to validate billing credit", existingEntry.error.message);
  }

  if (existingEntry.data?.id) return;

  const account = await loadBillingAccount(repository, transaction.student_id);
  const packageLessonUnits = Number(plan.credit_lesson_units ?? 0);
  if (plan.billing_credit_type === "lesson" && packageLessonUnits <= 0) {
    throw new BillingHttpError(400, "PAYMENT_PLAN_INVALID", "Lesson package must have positive lesson units");
  }
  const effectiveLessonPriceAmount =
    plan.billing_credit_type === "lesson"
      ? Number(transaction.amount ?? 0) / packageLessonUnits
      : account?.lessonPriceAmount ?? null;
  const effectiveLessonPriceCurrency = transaction.currency ?? account?.currency ?? "RUB";

  if (!account) {
    if (plan.billing_credit_type === "money") {
      throw new BillingHttpError(400, "LESSON_PRICE_REQUIRED", "Money top-up requires configured lesson price");
    }
    await ensureBillingAccount(repository, transaction.student_id, {
      billingMode: "package_lessons",
      lessonPriceAmount: null,
      currency: transaction.currency
    });
  } else if (plan.billing_credit_type === "money" && (!account.lessonPriceAmount || account.lessonPriceAmount <= 0)) {
    throw new BillingHttpError(400, "LESSON_PRICE_REQUIRED", "Money top-up requires configured lesson price");
  }

  const insertPayload =
    plan.billing_credit_type === "lesson"
      ? {
          student_id: transaction.student_id,
          entry_direction: "credit",
          unit_type: "lesson",
          lesson_units: packageLessonUnits,
          money_amount: null,
          reason: "payment",
          payment_transaction_id: transaction.id,
          payment_plan_id: plan.id,
          effective_lesson_price_amount: effectiveLessonPriceAmount,
          effective_lesson_price_currency: effectiveLessonPriceCurrency,
          created_by_profile_id: null,
          description: `Начислено ${packageLessonUnits} уроков`
        }
      : {
          student_id: transaction.student_id,
          entry_direction: "credit",
          unit_type: "money",
          lesson_units: null,
          money_amount: Number(plan.credit_money_amount ?? transaction.amount ?? 0),
          reason: "payment",
          payment_transaction_id: transaction.id,
          payment_plan_id: plan.id,
          effective_lesson_price_amount: effectiveLessonPriceAmount,
          effective_lesson_price_currency: effectiveLessonPriceCurrency,
          created_by_profile_id: null,
          description: `Пополнение баланса ${Number(plan.credit_money_amount ?? transaction.amount ?? 0)}`
        };

  const insertResponse = await repository.insertLedgerEntry(insertPayload);
  if (insertResponse.error && !String(insertResponse.error.message).toLowerCase().includes("duplicate")) {
    throw new BillingHttpError(500, "PAYMENT_BILLING_SYNC_FAILED", "Failed to save billing credit", insertResponse.error.message);
  }
}

export async function applyCompletedLessonCharge(lessonId: string, actorUserId: string, client: BillingLedgerRepositoryClient) {
  void BILLING_TRANSACTION_SYNC_ACCESS_MODE;
  const repository = createBillingLedgerRepository(client);
  const [lessonResponse, existingChargeResponse] = await repository.loadLessonChargeInputs(lessonId);

  if (lessonResponse.error) {
    throw new BillingHttpError(500, "LESSON_CHARGE_FAILED", "Failed to load lesson for billing", lessonResponse.error.message);
  }
  if (existingChargeResponse.error) {
    throw new BillingHttpError(500, "LESSON_CHARGE_FAILED", "Failed to validate existing lesson charge", existingChargeResponse.error.message);
  }

  const lesson = lessonResponse.data as LessonRow | null;
  if (!lesson || existingChargeResponse.data?.id) {
    return;
  }

  const account = await loadBillingAccount(repository, lesson.student_id);
  if (!account) return;
  const latestLessonPrice = await loadLatestEffectiveLessonPrice(repository, lesson.student_id);
  const effectiveLessonPriceAmount =
    account.billingMode === "package_lessons"
      ? latestLessonPrice.amount
      : account.lessonPriceAmount ?? latestLessonPrice.amount;
  const effectiveLessonPriceCurrency = account.currency ?? latestLessonPrice.currency ?? "RUB";

  const insertPayload =
    account.billingMode === "package_lessons"
      ? {
          student_id: lesson.student_id,
          entry_direction: "debit",
          unit_type: "lesson",
          lesson_units: 1,
          money_amount: null,
          reason: "lesson_charge",
          schedule_lesson_id: lesson.id,
          effective_lesson_price_amount: effectiveLessonPriceAmount,
          effective_lesson_price_currency: effectiveLessonPriceCurrency,
          created_by_profile_id: actorUserId,
          description: `Списан 1 урок: ${lesson.title}`
        }
      : account.lessonPriceAmount != null
        ? {
            student_id: lesson.student_id,
            entry_direction: "debit",
            unit_type: "money",
            lesson_units: null,
            money_amount: Number(account.lessonPriceAmount),
            reason: "lesson_charge",
            schedule_lesson_id: lesson.id,
            effective_lesson_price_amount: effectiveLessonPriceAmount,
            effective_lesson_price_currency: effectiveLessonPriceCurrency,
            created_by_profile_id: actorUserId,
            description: `Списано ${Number(account.lessonPriceAmount)} за урок: ${lesson.title}`
          }
        : null;

  if (!insertPayload) return;

  const insertResponse = await repository.insertLedgerEntry(insertPayload);
  if (insertResponse.error && !String(insertResponse.error.message).toLowerCase().includes("duplicate")) {
    throw new BillingHttpError(500, "LESSON_CHARGE_FAILED", "Failed to create lesson charge", insertResponse.error.message);
  }
}
