import { createHash, randomUUID } from "node:crypto";

import { AdminHttpError } from "@/lib/admin/http";
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
import { getCurrentStudentProfile } from "@/lib/students/current-student";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizeWebhookEventId(eventType: string, providerPaymentId: string) {
  return `${eventType}:${providerPaymentId}`;
}

function getWebhookToken() {
  return process.env.YOOKASSA_WEBHOOK_SECRET ?? "";
}

export async function createCheckoutForCurrentStudent(planId: string) {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId || !profile.userId) {
    throw new AdminHttpError(401, "UNAUTHORIZED", "Authentication required");
  }

  const admin = createAdminClient();
  const { data: plan, error: planError } = await admin
    .from("payment_plans")
    .select("id, title, description, amount, currency, yookassa_product_label, is_active")
    .eq("id", planId)
    .eq("is_active", true)
    .maybeSingle();

  if (planError || !plan) {
    throw new AdminHttpError(404, "PAYMENT_PLAN_NOT_FOUND", "Payment plan not found");
  }

  const transactionId = randomUUID();
  const idempotenceKey = randomUUID();
  const origin = await getRequestOrigin();
  const returnUrl = `${origin}/settings/payments?payment=${transactionId}`;

  const { error: insertError } = await admin.from("payment_transactions").insert({
    id: transactionId,
    student_id: profile.studentId,
    amount: Number(plan.amount ?? 0),
    currency: String(plan.currency ?? "RUB"),
    status: "pending",
    description: plan.description ?? plan.title,
    provider: "yookassa",
    plan_id: plan.id,
    return_url: returnUrl,
    idempotence_key: idempotenceKey,
    raw_status: "pending",
    metadata: {
      user_id: profile.userId,
      student_id: profile.studentId,
      plan_id: String(plan.id)
    }
  });

  if (insertError) {
    throw new AdminHttpError(500, "PAYMENT_TRANSACTION_CREATE_FAILED", "Failed to create payment transaction", insertError.message);
  }

  try {
    const payment = await createYooKassaPayment({
      amount: Number(plan.amount ?? 0),
      currency: String(plan.currency ?? "RUB"),
      description: String(plan.title),
      returnUrl,
      idempotenceKey,
      receiptLabel: String(plan.yookassa_product_label ?? plan.title),
      customerEmail: profile.email,
      metadata: {
        transactionId,
        userId: profile.userId,
        studentId: profile.studentId,
        planId: String(plan.id)
      }
    });

    const update = mapYooKassaPaymentToTransactionUpdate(payment);
    const { error: updateError } = await admin
      .from("payment_transactions")
      .update({
        provider_payment_id: payment.id,
        provider_payload: payment,
        ...update
      })
      .eq("id", transactionId);

    if (updateError) {
      throw new AdminHttpError(500, "PAYMENT_TRANSACTION_UPDATE_FAILED", "Failed to update payment transaction", updateError.message);
    }

    return {
      transactionId,
      redirectUrl: payment.confirmation?.confirmation_url ?? returnUrl
    };
  } catch (error) {
    await admin
      .from("payment_transactions")
      .update({ status: "failed", raw_status: "provider_error", updated_at: new Date().toISOString() })
      .eq("id", transactionId);
    throw error;
  }
}

export async function syncCurrentStudentTransaction(transactionId: string): Promise<PaymentStatusContext> {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) {
    throw new AdminHttpError(401, "UNAUTHORIZED", "Authentication required");
  }

  const admin = createAdminClient();
  const { data: transaction, error } = await admin
    .from("payment_transactions")
    .select("id, student_id, status, provider_payment_id, created_at")
    .eq("id", transactionId)
    .eq("student_id", profile.studentId)
    .maybeSingle();

  if (error || !transaction) {
    throw new AdminHttpError(404, "PAYMENT_TRANSACTION_NOT_FOUND", "Payment transaction not found");
  }

  let status = String(transaction.status ?? "pending");
  const createdAt = String(transaction.created_at ?? "");
  const confirmationExpiresAt = getYooKassaConfirmationExpiresAt(createdAt);

  if (transaction.provider_payment_id && isYooKassaConfirmationExpired(status, createdAt)) {
    const payment = await getYooKassaPayment(String(transaction.provider_payment_id));
    const update = mapYooKassaPaymentToTransactionUpdate(payment);

    await admin
      .from("payment_transactions")
      .update({
        provider_payload: payment,
        ...update
      })
      .eq("id", transactionId);

    status = update.status;
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

  const admin = createAdminClient();
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

  await admin
    .from("payment_webhook_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("provider", "yookassa")
    .eq("provider_event_id", eventId);

  return { duplicate: false };
}
