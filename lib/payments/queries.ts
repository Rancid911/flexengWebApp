import { createClient } from "@/lib/supabase/server";
import { getCurrentStudentProfile } from "@/lib/students/current-student";
import { measureServerTiming } from "@/lib/server/timing";
import type { PaymentPlan, PaymentStatusContext, StudentPaymentTransaction, StudentPaymentsPageData } from "@/lib/payments/types";
import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";
import {
  getYooKassaConfirmationExpiresAt,
  isYooKassaConfirmationExpired,
  mapPaymentStatusMeta
} from "@/lib/payments/yookassa";
import { getCurrentStudentBillingSummary } from "@/lib/billing/server";

export const STUDENT_PAYMENT_PLANS_DATA_LOADING = defineDataLoadingDescriptor({
  id: "student-payment-plans",
  owner: "@/lib/payments/queries#getAvailablePaymentPlans",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "list",
  issues: []
});

export const STUDENT_PAYMENTS_LIST_DATA_LOADING = defineDataLoadingDescriptor({
  id: "student-payments-list",
  owner: "@/lib/payments/queries#getStudentPayments",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "list",
  issues: []
});

export const STUDENT_PAYMENT_STATUS_CONTEXT_DATA_LOADING = defineDataLoadingDescriptor({
  id: "student-payment-status-context",
  owner: "@/lib/payments/queries#getStudentPaymentStatusContext",
  accessMode: "user_scoped",
  loadLevel: "client_interaction",
  shape: "detail",
  issues: []
});

export const STUDENT_PAYMENTS_BILLING_SUMMARY_DATA_LOADING = defineDataLoadingDescriptor({
  id: "student-payments-billing-summary",
  owner: "@/lib/billing/server#getCurrentStudentBillingSummary",
  accessMode: "privileged",
  loadLevel: "page",
  shape: "summary",
  issues: [],
  notes: ["Summary-only companion loader for the student payments page."]
});

export const STUDENT_PAYMENTS_PAGE_WRAPPER_DATA_LOADING = defineDataLoadingDescriptor({
  id: "student-payments-page-wrapper",
  owner: "@/lib/payments/queries#getStudentPaymentsPageData",
  accessMode: "user_scoped",
  loadLevel: "section",
  shape: "aggregate",
  issues: ["duplicated_fetch", "mixed_responsibilities"],
  transitional: true,
  notes: ["Compatibility wrapper. Preferred page contract is Promise.all over narrow loaders."]
});

function readRelationTitle(value: { title: unknown } | Array<{ title: unknown }> | null | undefined) {
  if (Array.isArray(value)) {
    return typeof value[0]?.title === "string" ? value[0].title : null;
  }

  return typeof value?.title === "string" ? value.title : null;
}

export async function getAvailablePaymentPlans(): Promise<PaymentPlan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_plans")
    .select("id, title, description, amount, currency, badge, yookassa_product_label, sort_order, billing_credit_type, credit_lesson_units, credit_money_amount")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return [];

  return (data ?? []).map((item) => ({
    id: String(item.id),
    title: String(item.title),
    description: typeof item.description === "string" ? item.description : null,
    amount: Number(item.amount ?? 0),
    currency: String(item.currency ?? "RUB"),
    badge: typeof item.badge === "string" ? item.badge : null,
    yookassaProductLabel: String(item.yookassa_product_label ?? item.title),
    sortOrder: Number(item.sort_order ?? 0),
    billingCreditType: item.billing_credit_type === "lesson" || item.billing_credit_type === "money" ? item.billing_credit_type : null,
    creditLessonUnits: item.credit_lesson_units == null ? null : Number(item.credit_lesson_units),
    creditMoneyAmount: item.credit_money_amount == null ? null : Number(item.credit_money_amount)
  }));
}

export async function getStudentPayments(): Promise<StudentPaymentTransaction[]> {
  return measureServerTiming("payments-list", async () => {
    const profile = await getCurrentStudentProfile();
    if (!profile?.studentId) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payment_transactions")
      .select("id, amount, currency, status, paid_at, created_at, description, raw_status, confirmation_url, provider_payment_id, plan_id, payment_plans(title)")
      .eq("student_id", profile.studentId)
      .order("created_at", { ascending: false });

    if (error) return [];

    return (data ?? []).map((item) => {
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

export async function getStudentPaymentStatusContext(transactionId: string): Promise<PaymentStatusContext | null> {
  return measureServerTiming("payments-status-context", async () => {
    const profile = await getCurrentStudentProfile();
    if (!profile?.studentId || !transactionId) return null;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payment_transactions")
      .select("id, status, created_at")
      .eq("student_id", profile.studentId)
      .eq("id", transactionId)
      .maybeSingle();

    if (error || !data) return null;

    const status = String(data.status ?? "pending");
    const createdAt = String(data.created_at ?? "");
    const isConfirmationExpired = isYooKassaConfirmationExpired(status, createdAt);
    const meta = mapPaymentStatusMeta(status, { isConfirmationExpired });
    return {
      transactionId: String(data.id),
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
    const [payments, billingSummary] = await Promise.all([getStudentPayments(), getCurrentStudentBillingSummary(6)]);
    return {
      payments,
      billingSummary
    };
  });
}
