import { createClient } from "@/lib/supabase/server";
import { getCurrentStudentProfile } from "@/lib/students/current-student";
import type { PaymentPlan, PaymentStatusContext, StudentPaymentTransaction } from "@/lib/payments/types";
import {
  getYooKassaConfirmationExpiresAt,
  getYooKassaPayment,
  isYooKassaConfirmationExpired,
  mapPaymentStatusMeta,
  mapYooKassaPaymentToTransactionUpdate
} from "@/lib/payments/yookassa";
import { createAdminClient } from "@/lib/supabase/admin";

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
    .select("id, title, description, amount, currency, badge, yookassa_product_label, sort_order")
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
    sortOrder: Number(item.sort_order ?? 0)
  }));
}

export async function getStudentPayments(): Promise<StudentPaymentTransaction[]> {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_transactions")
    .select("id, amount, currency, status, paid_at, created_at, description, raw_status, confirmation_url, provider_payment_id, plan_id, payment_plans(title)")
    .eq("student_id", profile.studentId)
    .order("created_at", { ascending: false });

  if (error) return [];

  const admin = createAdminClient();

  return Promise.all(
    (data ?? []).map(async (item) => {
      let status = String(item.status ?? "pending");
      let paidAt = typeof item.paid_at === "string" ? item.paid_at : null;
      let rawStatus = typeof item.raw_status === "string" ? item.raw_status : null;
      let confirmationUrl = typeof item.confirmation_url === "string" ? item.confirmation_url : null;
      const createdAt = String(item.created_at);
      const providerPaymentId = typeof item.provider_payment_id === "string" ? item.provider_payment_id : null;

      if (providerPaymentId && isYooKassaConfirmationExpired(status, createdAt)) {
        const payment = await getYooKassaPayment(providerPaymentId);
        const update = mapYooKassaPaymentToTransactionUpdate(payment);

        await admin
          .from("payment_transactions")
          .update({
            provider_payload: payment,
            ...update
          })
          .eq("id", String(item.id))
          .eq("student_id", profile.studentId);

        status = update.status;
        paidAt = update.paid_at;
        rawStatus = update.raw_status;
        confirmationUrl = update.confirmation_url;
      }

      return {
        id: String(item.id),
        amount: Number(item.amount ?? 0),
        currency: String(item.currency ?? "RUB"),
        status,
        description: typeof item.description === "string" ? item.description : null,
        createdAt,
        paidAt,
        rawStatus,
        confirmationUrl,
        confirmationExpiresAt: getYooKassaConfirmationExpiresAt(createdAt),
        isConfirmationExpired: isYooKassaConfirmationExpired(status, createdAt),
        providerPaymentId,
        planId: typeof item.plan_id === "string" ? item.plan_id : null,
        planTitle: readRelationTitle(item.payment_plans)
      };
    })
  );
}

export async function getStudentPaymentStatusContext(transactionId: string): Promise<PaymentStatusContext | null> {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId || !transactionId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_transactions")
    .select("id, status, created_at, provider_payment_id")
    .eq("student_id", profile.studentId)
    .eq("id", transactionId)
    .maybeSingle();

  if (error || !data) return null;

  let status = String(data.status ?? "pending");
  const createdAt = String(data.created_at ?? "");
  if (typeof data.provider_payment_id === "string" && isYooKassaConfirmationExpired(status, createdAt)) {
    const payment = await getYooKassaPayment(data.provider_payment_id);
    const update = mapYooKassaPaymentToTransactionUpdate(payment);

    await createAdminClient()
      .from("payment_transactions")
      .update({
        provider_payload: payment,
        ...update
      })
      .eq("id", String(data.id))
      .eq("student_id", profile.studentId);

    status = update.status;
  }

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
}
