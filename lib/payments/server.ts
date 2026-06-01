import { createHash, randomUUID } from "node:crypto";

import { AdminHttpError } from "@/lib/admin/http";
import { assertPaymentPlanBillingCompatibility, syncPaymentTransactionBilling } from "@/lib/billing/server";
import type { PaymentStatusContext } from "@/lib/payments/types";
import {
  createYooKassaPayment,
  getYooKassaConfirmationExpiresAt,
  getYooKassaPayment,
  isYooKassaConfirmationExpired,
  mapPaymentStatusMeta,
  mapYooKassaPaymentToTransactionUpdate
} from "@/lib/payments/yookassa";
import { getRequestOrigin } from "@/lib/server-origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AccessMode } from "@/lib/supabase/access";

export const CURRENT_STUDENT_CHECKOUT_ACCESS_MODE: AccessMode = "user_scoped";
export const CURRENT_STUDENT_TRANSACTION_SYNC_ACCESS_MODE: AccessMode = "user_scoped";
export const PAYMENT_PROVIDER_STATE_ACCESS_MODE: AccessMode = "privileged";
export const PAYMENT_WEBHOOK_ACCESS_MODE: AccessMode = "privileged";

type CurrentStudentPaymentTransactionRow = {
  transaction_id: string;
  amount: number | string | null;
  currency: string | null;
  title: string | null;
  description: string | null;
  receipt_label: string | null;
  student_id: string;
  user_id: string;
  customer_email: string | null;
  plan_id: string;
};

type CurrentStudentPaymentStatusRow = {
  id: string;
  student_id: string;
  status: string | null;
  provider_payment_id: string | null;
  created_at: string | null;
};

type PaymentProviderStateUpdate = {
  transactionId: string;
  studentId: string;
  providerPaymentId: string | null;
  providerPayload: unknown;
  status: string;
  rawStatus: string;
  paidAt?: string | null;
  confirmationUrl?: string | null;
  paymentMethodId?: string | null;
  isReusablePaymentMethod?: boolean | null;
};

function normalizeWebhookEventId(eventType: string, providerPaymentId: string) {
  return `${eventType}:${providerPaymentId}`;
}

function getWebhookToken() {
  return process.env.YOOKASSA_WEBHOOK_SECRET ?? "";
}

function getPrivilegedPaymentClient() {
  return createAdminClient();
}

async function updatePaymentTransactionProviderState(update: PaymentProviderStateUpdate) {
  void PAYMENT_PROVIDER_STATE_ACCESS_MODE;
  const payload: Record<string, unknown> = {
    provider_payload: update.providerPayload,
    status: update.status,
    raw_status: update.rawStatus,
    paid_at: update.paidAt ?? null,
    confirmation_url: update.confirmationUrl ?? null,
    payment_method_id: update.paymentMethodId ?? null,
    is_reusable_payment_method: update.isReusablePaymentMethod ?? null
  };

  if (update.providerPaymentId) {
    payload.provider_payment_id = update.providerPaymentId;
  }

  const { data, error } = await getPrivilegedPaymentClient()
    .from("payment_transactions")
    .update(payload)
    .eq("id", update.transactionId)
    .eq("student_id", update.studentId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error };
  }

  if (!data) {
    return { error: { message: "Payment transaction not found" } };
  }

  return { error: null };
}

export async function createCheckoutForCurrentStudent(planId: string) {
  void CURRENT_STUDENT_CHECKOUT_ACCESS_MODE;
  const supabase = await createClient();
  const transactionId = randomUUID();
  const idempotenceKey = randomUUID();
  const origin = await getRequestOrigin();
  const returnUrl = `${origin}/settings/payments?payment=${transactionId}`;

  const { data: transactionRows, error: createError } = await supabase.rpc("create_current_student_payment_transaction", {
    p_transaction_id: transactionId,
    p_plan_id: planId,
    p_return_url: returnUrl,
    p_idempotence_key: idempotenceKey
  });

  if (createError) {
    throw new AdminHttpError(500, "PAYMENT_TRANSACTION_CREATE_FAILED", "Failed to create payment transaction", createError.message);
  }

  const transaction = ((transactionRows ?? []) as CurrentStudentPaymentTransactionRow[])[0] ?? null;
  if (!transaction) {
    throw new AdminHttpError(404, "PAYMENT_PLAN_NOT_FOUND", "Payment plan not found");
  }

  await assertPaymentPlanBillingCompatibility(transaction.student_id, transaction.plan_id, supabase);

  try {
    const payment = await createYooKassaPayment({
      amount: Number(transaction.amount ?? 0),
      currency: String(transaction.currency ?? "RUB"),
      description: String(transaction.title ?? ""),
      returnUrl,
      idempotenceKey,
      receiptLabel: String(transaction.receipt_label ?? transaction.title ?? ""),
      customerEmail: transaction.customer_email ?? "",
      metadata: {
        transactionId,
        userId: transaction.user_id,
        studentId: transaction.student_id,
        planId: transaction.plan_id
      }
    });

    const update = mapYooKassaPaymentToTransactionUpdate(payment);
    const { error: updateError } = await updatePaymentTransactionProviderState({
      transactionId,
      studentId: transaction.student_id,
      providerPaymentId: payment.id,
      providerPayload: payment,
      status: update.status,
      rawStatus: update.raw_status,
      paidAt: update.paid_at,
      confirmationUrl: update.confirmation_url,
      paymentMethodId: update.payment_method_id,
      isReusablePaymentMethod: update.is_reusable_payment_method
    });

    if (updateError) {
      throw new AdminHttpError(500, "PAYMENT_TRANSACTION_UPDATE_FAILED", "Failed to update payment transaction", updateError.message);
    }

    return {
      transactionId,
      redirectUrl: payment.confirmation?.confirmation_url ?? returnUrl
    };
  } catch (error) {
    await updatePaymentTransactionProviderState({
      transactionId,
      studentId: transaction.student_id,
      providerPaymentId: null,
      providerPayload: null,
      status: "failed",
      rawStatus: "provider_error",
      paidAt: null,
      confirmationUrl: null,
      paymentMethodId: null,
      isReusablePaymentMethod: null
    });
    throw error;
  }
}

export async function syncCurrentStudentTransaction(transactionId: string): Promise<PaymentStatusContext> {
  void CURRENT_STUDENT_TRANSACTION_SYNC_ACCESS_MODE;
  const supabase = await createClient();
  const { data: transactionRows, error } = await supabase.rpc("load_current_student_payment_transaction_status", {
    p_transaction_id: transactionId
  });
  const transaction = ((transactionRows ?? []) as CurrentStudentPaymentStatusRow[])[0] ?? null;

  if (error || !transaction) {
    throw new AdminHttpError(404, "PAYMENT_TRANSACTION_NOT_FOUND", "Payment transaction not found");
  }

  let status = String(transaction.status ?? "pending");
  const createdAt = String(transaction.created_at ?? "");
  const confirmationExpiresAt = getYooKassaConfirmationExpiresAt(createdAt);

  if (transaction.provider_payment_id && isYooKassaConfirmationExpired(status, createdAt)) {
    const payment = await getYooKassaPayment(String(transaction.provider_payment_id));
    const update = mapYooKassaPaymentToTransactionUpdate(payment);

    const { error: updateError } = await updatePaymentTransactionProviderState({
      transactionId,
      studentId: transaction.student_id,
      providerPaymentId: payment.id,
      providerPayload: payment,
      status: update.status,
      rawStatus: update.raw_status,
      paidAt: update.paid_at,
      confirmationUrl: update.confirmation_url,
      paymentMethodId: update.payment_method_id,
      isReusablePaymentMethod: update.is_reusable_payment_method
    });

    if (updateError) {
      throw new AdminHttpError(500, "PAYMENT_TRANSACTION_UPDATE_FAILED", "Failed to update payment transaction", updateError.message);
    }

    status = update.status;
    if (update.status === "succeeded") {
      await syncPaymentTransactionBilling(transactionId, supabase);
    }
  }

  const isConfirmationExpired = isYooKassaConfirmationExpired(status, createdAt);
  const meta = mapPaymentStatusMeta(status, { isConfirmationExpired });
  return {
    transactionId,
    status,
    label: meta.label,
    tone: meta.tone,
    description: meta.description,
    confirmationExpiresAt,
    isConfirmationExpired
  };
}

export async function processYooKassaWebhook(payload: unknown, requestToken: string | null) {
  void PAYMENT_WEBHOOK_ACCESS_MODE;
  const configuredToken = getWebhookToken();
  if (configuredToken && configuredToken !== (requestToken ?? "")) {
    throw new AdminHttpError(401, "INVALID_WEBHOOK_TOKEN", "Invalid webhook token");
  }

  const eventType = typeof (payload as { event?: unknown })?.event === "string" ? (payload as { event: string }).event : "";
  const paymentObject = (payload as { object?: { id?: unknown; status?: unknown } })?.object;
  const providerPaymentId = typeof paymentObject?.id === "string" ? paymentObject.id : "";

  if (!eventType || !providerPaymentId) {
    throw new AdminHttpError(400, "INVALID_WEBHOOK_PAYLOAD", "Invalid webhook payload");
  }

  const admin = getPrivilegedPaymentClient();
  const eventId = normalizeWebhookEventId(eventType, providerPaymentId);
  const payloadHash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");

  const { data: existingEvent } = await admin
    .from("payment_webhook_events")
    .select("id, processed_at")
    .eq("provider", "yookassa")
    .eq("provider_event_id", eventId)
    .maybeSingle();

  if (existingEvent?.processed_at) {
    return { duplicate: true };
  }

  if (!existingEvent) {
    const { error: insertEventError } = await admin.from("payment_webhook_events").insert({
      provider: "yookassa",
      provider_event_id: eventId,
      event_type: eventType,
      payload: {
        hash: payloadHash,
        body: payload
      }
    });

    if (insertEventError && !String(insertEventError.message).toLowerCase().includes("duplicate")) {
      throw new AdminHttpError(500, "PAYMENT_WEBHOOK_EVENT_CREATE_FAILED", "Failed to store webhook event", insertEventError.message);
    }
  }

  const payment = await getYooKassaPayment(providerPaymentId);
  const update = mapYooKassaPaymentToTransactionUpdate(payment);

  await admin
    .from("payment_transactions")
    .update({
      provider_payload: payment,
      ...update
    })
    .eq("provider", "yookassa")
    .eq("provider_payment_id", providerPaymentId);

  const syncedTransactions = await admin
    .from("payment_transactions")
    .select("id")
    .eq("provider", "yookassa")
    .eq("provider_payment_id", providerPaymentId);

  if (syncedTransactions.error) {
    throw new AdminHttpError(500, "PAYMENT_WEBHOOK_PROCESS_FAILED", "Failed to resolve synced transactions", syncedTransactions.error.message);
  }

  for (const transaction of syncedTransactions.data ?? []) {
    if (typeof transaction.id === "string") {
      await syncPaymentTransactionBilling(transaction.id, admin);
    }
  }

  await admin
    .from("payment_webhook_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("provider", "yookassa")
    .eq("provider_event_id", eventId);

  return { duplicate: false };
}
