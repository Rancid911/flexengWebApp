import { getCurrentStudentBillingSummary } from "@/lib/billing/server";
import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";
import {
  createUserScopedPaymentsRepository,
  type PaymentPlanRow,
  type StudentPaymentStatusRow,
  type StudentPaymentTransactionRow
} from "@/lib/payments/payments.repository";
import type {
  PaymentPlan,
  PaymentStatusContext,
  StudentPaymentTransaction,
  StudentPaymentsPageData
} from "@/lib/payments/types";
import {
  getYooKassaConfirmationExpiresAt,
  isYooKassaConfirmationExpired,
  mapPaymentStatusMeta
} from "@/lib/payments/yookassa";
import { measureServerTiming } from "@/lib/server/timing";
import { getCurrentStudentProfile } from "@/lib/students/current-student";

export const STUDENT_PAYMENT_PLANS_DATA_LOADING = defineDataLoadingDescriptor({
  id: "student-payment-plans",
  owner: "@/lib/payments/payments.service#getAvailablePaymentPlans",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "list",
  issues: []
});

export const STUDENT_PAYMENTS_LIST_DATA_LOADING = defineDataLoadingDescriptor({
  id: "student-payments-list",
  owner: "@/lib/payments/payments.service#getStudentPayments",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "list",
  issues: []
});

export const STUDENT_PAYMENT_STATUS_CONTEXT_DATA_LOADING = defineDataLoadingDescriptor({
  id: "student-payment-status-context",
  owner: "@/lib/payments/payments.service#getStudentPaymentStatusContext",
  accessMode: "user_scoped",
  loadLevel: "client_interaction",
  shape: "detail",
  issues: []
});

export const STUDENT_PAYMENTS_BILLING_SUMMARY_DATA_LOADING = defineDataLoadingDescriptor({
  id: "student-payments-billing-summary",
  owner: "@/lib/billing/server#getCurrentStudentBillingSummary",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "summary",
  issues: [],
  notes: ["Summary-only companion loader for the student payments page."]
});

export const STUDENT_PAYMENTS_PAGE_WRAPPER_DATA_LOADING = defineDataLoadingDescriptor({
  id: "student-payments-page-wrapper",
  owner: "@/lib/payments/payments.service#getStudentPaymentsPageData",
  accessMode: "user_scoped",
  loadLevel: "section",
  shape: "aggregate",
  issues: ["duplicated_fetch", "mixed_responsibilities"],
  transitional: true,
  notes: ["Compatibility wrapper. Preferred page contract is Promise.all over narrow loaders."]
});

function readRelationTitle(value: { title?: unknown } | Array<{ title?: unknown }> | null | undefined) {
  if (Array.isArray(value)) {
    return typeof value[0]?.title === "string" ? value[0].title : null;
  }

  return typeof value?.title === "string" ? value.title : null;
}

export async function getAvailablePaymentPlans(): Promise<PaymentPlan[]> {
  const repository = await createUserScopedPaymentsRepository();
  const { data, error } = await repository.loadAvailablePaymentPlans();

  if (error) return [];

  return ((data ?? []) as PaymentPlanRow[]).map((item) => ({
    id: String(item.id),
    title: String(item.title),
    description: typeof item.description === "string" ? item.description : null,
    amount: Number(item.amount ?? 0),
    currency: String(item.currency ?? "RUB"),
    badge: typeof item.badge === "string" ? item.badge : null,
    yookassaProductLabel: String(item.yookassa_product_label ?? item.title),
    sortOrder: Number(item.sort_order ?? 0),
    billingCreditType:
      item.billing_credit_type === "lesson" || item.billing_credit_type === "money"
        ? item.billing_credit_type
        : null,
    creditLessonUnits: item.credit_lesson_units == null ? null : Number(item.credit_lesson_units),
    creditMoneyAmount: item.credit_money_amount == null ? null : Number(item.credit_money_amount)
  }));
}

export async function getStudentPayments(): Promise<StudentPaymentTransaction[]> {
  return measureServerTiming("payments-list", async () => {
    const profile = await getCurrentStudentProfile();
    if (!profile?.studentId) return [];

    const repository = await createUserScopedPaymentsRepository();
    const { data, error } = await repository.loadStudentPayments(profile.studentId);

    if (error) return [];

    return ((data ?? []) as StudentPaymentTransactionRow[]).map((item) => {
      const status = String(item.status ?? "pending");
      const createdAt = String(item.created_at);

      return {
        id: String(item.id),
        amount: Number(item.amount ?? 0),
        currency: String(item.currency ?? "RUB"),
        status,
        description: typeof item.description === "string" ? item.description : null,
        createdAt,
        paidAt: typeof item.paid_at === "string" ? item.paid_at : null,
        rawStatus: typeof item.raw_status === "string" ? item.raw_status : null,
        confirmationUrl: typeof item.confirmation_url === "string" ? item.confirmation_url : null,
        confirmationExpiresAt: getYooKassaConfirmationExpiresAt(createdAt),
        isConfirmationExpired: isYooKassaConfirmationExpired(status, createdAt),
        providerPaymentId: typeof item.provider_payment_id === "string" ? item.provider_payment_id : null,
        planId: typeof item.plan_id === "string" ? item.plan_id : null,
        planTitle: readRelationTitle(item.payment_plans)
      };
    });
  });
}

export async function getStudentPaymentStatusContext(
  transactionId: string
): Promise<PaymentStatusContext | null> {
  return measureServerTiming("payments-status-context", async () => {
    const profile = await getCurrentStudentProfile();
    if (!profile?.studentId || !transactionId) return null;

    const repository = await createUserScopedPaymentsRepository();
    const { data, error } = await repository.loadStudentPaymentStatus(profile.studentId, transactionId);

    if (error || !data) return null;

    const row = data as StudentPaymentStatusRow;
    const status = String(row.status ?? "pending");
    const createdAt = String(row.created_at ?? "");
    const isConfirmationExpired = isYooKassaConfirmationExpired(status, createdAt);
    const meta = mapPaymentStatusMeta(status, { isConfirmationExpired });
    return {
      transactionId: String(row.id),
      status,
      label: meta.label,
      tone: meta.tone,
      description: meta.description,
      confirmationExpiresAt: getYooKassaConfirmationExpiresAt(createdAt),
      isConfirmationExpired
    };
  });
}

export async function getStudentPaymentsPageData(): Promise<StudentPaymentsPageData> {
  void STUDENT_PAYMENTS_PAGE_WRAPPER_DATA_LOADING;
  return measureServerTiming("payments-page-data", async () => {
    const [payments, billingSummary] = await Promise.all([
      getStudentPayments(),
      getCurrentStudentBillingSummary(6)
    ]);
    return {
      payments,
      billingSummary
    };
  });
}
