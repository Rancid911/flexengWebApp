import type { StudentBillingMode, StudentBillingSummary } from "@/lib/billing/types";
import { buildStudentBillingSummary, buildStudentBillingSummaryFromAggregates } from "@/lib/billing/utils";
import { createBillingLedgerRepository, type BillingLedgerRepositoryClient } from "@/lib/billing/ledger.repository";
import {
  normalizeAccount,
  normalizeLedger,
  readPlanRelation,
  type BillingAccountRow,
  type BillingLedgerRow,
  type BillingSummaryAggregateRow,
  type LessonRow,
  type PaymentPlanBillingRow,
  type PaymentTransactionWithPlanRow
} from "@/lib/billing/mappers";
import { measureServerTiming } from "@/lib/server/timing";
import { getCurrentStudentProfile } from "@/lib/students/current-student";
import { ScheduleHttpError } from "@/lib/schedule/http";
import type { ScheduleActor } from "@/lib/schedule/server";
import {
  assertStaffAdminCapability,
  assertTeacherCapability,
  assertTeacherScope,
  isStudentScheduleActor,
  isTeacherScheduleActor
} from "@/lib/schedule/server";
import type { AccessMode } from "@/lib/supabase/access";

// Temporary infrastructure exception: student-facing billing summary still depends on
// privileged aggregate reads until a user-scoped summary RPC/view exists.
export const BILLING_SUMMARY_ACCESS_MODE: AccessMode = "privileged";
export const BILLING_MANAGE_ACCESS_MODE: AccessMode = "privileged";
export const BILLING_TRANSACTION_SYNC_ACCESS_MODE: AccessMode = "privileged";

type BillingRepository = ReturnType<typeof createBillingLedgerRepository>;

async function loadBillingAccount(repository: BillingRepository, studentId: string) {
  const response = await repository.loadBillingAccount(studentId);
  if (response.error) {
    throw new ScheduleHttpError(500, "BILLING_ACCOUNT_FETCH_FAILED", "Failed to load billing account", response.error.message);
  }

  return normalizeAccount((response.data ?? null) as BillingAccountRow | null);
}

async function loadBillingSummaryLedger(repository: BillingRepository, studentId: string) {
  const response = await repository.loadBillingSummaryAggregates(studentId);
  if (response.error) {
    throw new ScheduleHttpError(500, "BILLING_SUMMARY_RPC_UNAVAILABLE", "Failed to load billing summary ledger", response.error.message);
  }

  const aggregate = ((response.data ?? []) as BillingSummaryAggregateRow[])[0] ?? null;
  return {
    remainingLessonUnits: aggregate?.remaining_lesson_units == null ? 0 : Number(aggregate.remaining_lesson_units),
    remainingMoneyAmount: aggregate?.remaining_money_amount == null ? 0 : Number(aggregate.remaining_money_amount),
    effectiveLessonPriceAmount:
      aggregate?.effective_lesson_price_amount == null ? null : Number(aggregate.effective_lesson_price_amount),
    effectiveLessonPriceCurrency: aggregate?.effective_lesson_price_currency ?? null
  };
}

function isBillingSummaryAggregateRpcUnavailable(error: unknown) {
  if (!(error instanceof ScheduleHttpError)) return false;
  if (error.code !== "BILLING_SUMMARY_RPC_UNAVAILABLE") return false;

  const details = String(error.details ?? "").toLowerCase();
  return (
    details.includes("does not exist") ||
    details.includes("undefined function") ||
    details.includes("function public.get_student_billing_summary_aggregates") ||
    details.includes("schema cache") ||
    details.includes("could not find")
  );
}

async function loadFullBillingLedger(repository: BillingRepository, studentId: string) {
  const response = await repository.loadFullBillingLedger(studentId);
  if (response.error) {
    throw new ScheduleHttpError(500, "BILLING_SUMMARY_FALLBACK_FETCH_FAILED", "Failed to load billing summary fallback ledger", response.error.message);
  }

  return normalizeLedger((response.data ?? []) as BillingLedgerRow[]);
}

async function loadRecentBillingLedger(repository: BillingRepository, studentId: string, recentEntriesLimit: number) {
  const response = await repository.loadRecentBillingLedger(studentId, recentEntriesLimit);
  if (response.error) {
    throw new ScheduleHttpError(500, "BILLING_LEDGER_FETCH_FAILED", "Failed to load recent billing ledger", response.error.message);
  }

  return normalizeLedger((response.data ?? []) as BillingLedgerRow[]);
}

async function loadLatestEffectiveLessonPrice(repository: BillingRepository, studentId: string) {
  const response = await repository.loadLatestEffectiveLessonPrice(studentId);
  if (response.error) {
    throw new ScheduleHttpError(500, "BILLING_EFFECTIVE_PRICE_FETCH_FAILED", "Failed to load effective lesson price", response.error.message);
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
    throw new ScheduleHttpError(500, "BILLING_ACCOUNT_SAVE_FAILED", "Failed to save billing account", response.error.message);
  }

  return normalizeAccount(response.data as BillingAccountRow);
}

function assertBillingViewAccess(actor: ScheduleActor, studentId: string) {
  if (isStudentScheduleActor(actor) && actor.studentId !== studentId) {
    throw new ScheduleHttpError(403, "FORBIDDEN", "Billing access denied");
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
    const repository = createBillingLedgerRepository();
    const accountPromise = measureServerTiming("billing-account-load", () => loadBillingAccount(repository, studentId));
    const recentEntriesPromise = measureServerTiming("billing-recent-ledger", () => loadRecentBillingLedger(repository, studentId, recentEntriesLimit));

    try {
      const [account, summaryAggregates, recentEntries] = await Promise.all([
        accountPromise,
        measureServerTiming("billing-summary-aggregates", () => loadBillingSummaryLedger(repository, studentId)),
        recentEntriesPromise
      ]);

      return buildStudentBillingSummaryFromAggregates(studentId, account, summaryAggregates, recentEntries);
    } catch (error) {
      if (!isBillingSummaryAggregateRpcUnavailable(error)) {
        throw error;
      }

      console.warn("BILLING_SUMMARY_RPC_UNAVAILABLE", {
        studentId,
        message: error instanceof Error ? error.message : String(error),
        details: error instanceof ScheduleHttpError ? error.details : null
      });

      const [account, fullLedger] = await Promise.all([
        accountPromise,
        measureServerTiming("billing-summary-fallback-ledger", () => loadFullBillingLedger(repository, studentId))
      ]);

      return buildStudentBillingSummary(studentId, account, fullLedger, recentEntriesLimit);
    }
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
  const repository = createBillingLedgerRepository();

  if (!payload.billingMode) {
    const response = await repository.deleteBillingAccount(studentId);
    if (response.error) {
      throw new ScheduleHttpError(500, "BILLING_ACCOUNT_DELETE_FAILED", "Failed to clear billing settings", response.error.message);
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
  const repository = createBillingLedgerRepository();
  let account = await loadBillingAccount(repository, studentId);
  const latestLessonPrice = await loadLatestEffectiveLessonPrice(repository, studentId);
  if (!account) {
    if (payload.unitType === "money") {
      throw new ScheduleHttpError(400, "LESSON_PRICE_REQUIRED", "Для денежных корректировок сначала настройте цену урока");
    }
    account = await ensureBillingAccount(repository, studentId, {
      billingMode: "package_lessons",
      lessonPriceAmount: null,
      updatedByProfileId: actor.userId
    });
  }

  if (payload.unitType === "money" && (!account?.lessonPriceAmount || account.lessonPriceAmount <= 0)) {
    throw new ScheduleHttpError(400, "LESSON_PRICE_REQUIRED", "Для денежных корректировок сначала настройте цену урока");
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
    throw new ScheduleHttpError(500, "BILLING_ADJUSTMENT_FAILED", "Failed to save billing adjustment", response.error.message);
  }

  return getBillingSummaryByStudentId(studentId);
}

export async function assertPaymentPlanBillingCompatibility(studentId: string, planId: string) {
  void BILLING_TRANSACTION_SYNC_ACCESS_MODE;
  const repository = createBillingLedgerRepository();
  const [accountResponse, planResponse] = await repository.loadBillingCompatibility(studentId, planId);

  if (accountResponse.error || planResponse.error) {
    throw new ScheduleHttpError(500, "BILLING_COMPATIBILITY_CHECK_FAILED", "Failed to validate billing mode");
  }

  const account = accountResponse.data as { billing_mode?: StudentBillingMode | null; lesson_price_amount?: number | string | null } | null;
  const plan = planResponse.data as PaymentPlanBillingRow | null;
  const billingMode = account?.billing_mode;
  const creditType = plan?.billing_credit_type;
  if (!billingMode || !creditType) return;

  if (creditType === "lesson" && Number(plan?.credit_lesson_units ?? 0) <= 0) {
    throw new ScheduleHttpError(400, "PAYMENT_PLAN_INVALID", "Для пакетного тарифа должно быть указано количество уроков");
  }

  if (creditType === "money" && Number(plan?.credit_money_amount ?? 0) <= 0) {
    throw new ScheduleHttpError(400, "PAYMENT_PLAN_INVALID", "Для денежного тарифа должна быть указана сумма пополнения");
  }

  if (billingMode === "package_lessons" && creditType === "money") {
    throw new ScheduleHttpError(400, "PAYMENT_PLAN_INCOMPATIBLE", "Этот тариф несовместим с режимом списания по пакету уроков");
  }

  if (billingMode === "per_lesson_price" && creditType === "lesson") {
    throw new ScheduleHttpError(400, "PAYMENT_PLAN_INCOMPATIBLE", "Этот тариф несовместим с режимом списания по цене урока");
  }

  if (creditType === "money" && Number(account?.lesson_price_amount ?? 0) <= 0) {
    throw new ScheduleHttpError(400, "LESSON_PRICE_REQUIRED", "Для пополнения баланса должна быть настроена цена урока");
  }
}

export async function syncPaymentTransactionBilling(transactionId: string, adminClientArg?: BillingLedgerRepositoryClient) {
  void BILLING_TRANSACTION_SYNC_ACCESS_MODE;
  const repository = createBillingLedgerRepository(adminClientArg);
  const txResponse = await repository.loadPaymentTransactionWithPlan(transactionId);

  if (txResponse.error) {
    throw new ScheduleHttpError(500, "PAYMENT_BILLING_SYNC_FAILED", "Failed to load payment transaction", txResponse.error.message);
  }

  const transaction = txResponse.data as PaymentTransactionWithPlanRow | null;
  if (!transaction || transaction.status !== "succeeded" || !transaction.student_id) {
    return;
  }

  const plan = readPlanRelation(transaction.payment_plans);
  if (!plan?.billing_credit_type) return;

  const existingEntry = await repository.loadExistingPaymentCreditEntry(transaction.id);
  if (existingEntry.error) {
    throw new ScheduleHttpError(500, "PAYMENT_BILLING_SYNC_FAILED", "Failed to validate billing credit", existingEntry.error.message);
  }

  if (existingEntry.data?.id) return;

  const account = await loadBillingAccount(repository, transaction.student_id);
  const packageLessonUnits = Number(plan.credit_lesson_units ?? 0);
  if (plan.billing_credit_type === "lesson" && packageLessonUnits <= 0) {
    throw new ScheduleHttpError(400, "PAYMENT_PLAN_INVALID", "Lesson package must have positive lesson units");
  }
  const effectiveLessonPriceAmount =
    plan.billing_credit_type === "lesson"
      ? Number(transaction.amount ?? 0) / packageLessonUnits
      : account?.lessonPriceAmount ?? null;
  const effectiveLessonPriceCurrency = transaction.currency ?? account?.currency ?? "RUB";

  if (!account) {
    if (plan.billing_credit_type === "money") {
      throw new ScheduleHttpError(400, "LESSON_PRICE_REQUIRED", "Money top-up requires configured lesson price");
    }
    await ensureBillingAccount(repository, transaction.student_id, {
      billingMode: "package_lessons",
      lessonPriceAmount: null,
      currency: transaction.currency
    });
  } else if (plan.billing_credit_type === "money" && (!account.lessonPriceAmount || account.lessonPriceAmount <= 0)) {
    throw new ScheduleHttpError(400, "LESSON_PRICE_REQUIRED", "Money top-up requires configured lesson price");
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
    throw new ScheduleHttpError(500, "PAYMENT_BILLING_SYNC_FAILED", "Failed to save billing credit", insertResponse.error.message);
  }
}

export async function applyCompletedLessonCharge(lessonId: string, actorUserId: string, adminClientArg?: BillingLedgerRepositoryClient) {
  void BILLING_TRANSACTION_SYNC_ACCESS_MODE;
  const repository = createBillingLedgerRepository(adminClientArg);
  const [lessonResponse, existingChargeResponse] = await repository.loadLessonChargeInputs(lessonId);

  if (lessonResponse.error) {
    throw new ScheduleHttpError(500, "LESSON_CHARGE_FAILED", "Failed to load lesson for billing", lessonResponse.error.message);
  }
  if (existingChargeResponse.error) {
    throw new ScheduleHttpError(500, "LESSON_CHARGE_FAILED", "Failed to validate existing lesson charge", existingChargeResponse.error.message);
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
    throw new ScheduleHttpError(500, "LESSON_CHARGE_FAILED", "Failed to create lesson charge", insertResponse.error.message);
  }
}
