import { AdminHttpError } from "@/lib/admin/http";

type YooKassaAmount = {
  value: string;
  currency: string;
};

type YooKassaPaymentMethod = {
  id?: string;
  saved?: boolean;
  type?: string;
};

type YooKassaPayment = {
  id: string;
  status: string;
  paid?: boolean;
  amount: YooKassaAmount;
  description?: string;
  confirmation?: {
    type?: string;
    confirmation_url?: string;
  };
  paid_at?: string;
  metadata?: Record<string, string>;
  payment_method?: YooKassaPaymentMethod;
  refundable?: boolean;
  test?: boolean;
};

type CreateYooKassaPaymentInput = {
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
  idempotenceKey: string;
  receiptLabel: string;
  customerEmail: string;
  metadata: Record<string, string>;
};

type PaymentStatusTone = "success" | "warning" | "danger" | "muted";

export const YOOKASSA_CONFIRMATION_TTL_MS = 60 * 60 * 1000;

export function getYooKassaConfirmationExpiresAt(createdAt: string | null | undefined) {
  if (!createdAt) return null;
  const createdAtDate = new Date(createdAt);
  if (Number.isNaN(createdAtDate.getTime())) return null;
  return new Date(createdAtDate.getTime() + YOOKASSA_CONFIRMATION_TTL_MS).toISOString();
}

export function isYooKassaConfirmationExpired(status: string, createdAt: string | null | undefined, now = Date.now()) {
  if (status !== "pending") return false;
  const expiresAt = getYooKassaConfirmationExpiresAt(createdAt);
  if (!expiresAt) return false;
  const expiresAtMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) return false;
  return now >= expiresAtMs;
}

function getYooKassaShopId() {
  const value = process.env.YOOKASSA_SHOP_ID;
  if (!value) {
    throw new AdminHttpError(500, "CONFIGURATION_ERROR", "YOOKASSA_SHOP_ID is not set");
  }
  return value;
}

function getYooKassaSecretKey() {
  const value = process.env.YOOKASSA_SECRET_KEY;
  if (!value) {
    throw new AdminHttpError(500, "CONFIGURATION_ERROR", "YOOKASSA_SECRET_KEY is not set");
  }
  return value;
}

function getBasicAuthHeader() {
  const credentials = `${getYooKassaShopId()}:${getYooKassaSecretKey()}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

async function yookassaRequest<T>(path: string, init?: RequestInit & { idempotenceKey?: string }) {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", getBasicAuthHeader());
  if (init?.idempotenceKey) {
    headers.set("Idempotence-Key", init.idempotenceKey);
  }

  const response = await fetch(`https://api.yookassa.ru/v3/${path}`, {
    method: init?.method ?? "GET",
    headers,
    body: init?.body
  });

  const payload = (await response.json().catch(() => ({}))) as T & { type?: string; description?: string };
  if (!response.ok) {
    throw new AdminHttpError(
      response.status,
      "YOOKASSA_REQUEST_FAILED",
      typeof payload?.description === "string" ? payload.description : "YooKassa request failed",
      payload,
      { exposeDetails: true }
    );
  }

  return payload;
}

export async function createYooKassaPayment(input: CreateYooKassaPaymentInput) {
  const amount = input.amount.toFixed(2);
  return yookassaRequest<YooKassaPayment>("payments", {
    method: "POST",
    idempotenceKey: input.idempotenceKey,
    body: JSON.stringify({
      amount: {
        value: amount,
        currency: input.currency
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: input.returnUrl
      },
      description: input.description,
      metadata: input.metadata,
      receipt: {
        customer: {
          email: input.customerEmail
        },
        items: [
          {
            description: input.receiptLabel,
            quantity: "1.00",
            amount: {
              value: amount,
              currency: input.currency
            },
            vat_code: 1,
            payment_subject: "service",
            payment_mode: "full_payment"
          }
        ]
      }
    })
  });
}

export async function getYooKassaPayment(providerPaymentId: string) {
  return yookassaRequest<YooKassaPayment>(`payments/${providerPaymentId}`);
}

export function mapYooKassaPaymentToTransactionUpdate(payment: {
  status: string;
  id: string;
  paid_at?: string;
  confirmation?: { confirmation_url?: string };
  payment_method?: { id?: string; saved?: boolean };
}) {
  return {
    status: mapProviderStatusToTransactionStatus(payment.status),
    raw_status: payment.status,
    paid_at: payment.status === "succeeded" ? payment.paid_at ?? new Date().toISOString() : null,
    confirmation_url: payment.confirmation?.confirmation_url ?? null,
    payment_method_id: payment.payment_method?.id ?? null,
    is_reusable_payment_method: payment.payment_method?.saved ?? null,
    updated_at: new Date().toISOString()
  };
}

export function mapProviderStatusToTransactionStatus(status: string) {
  switch (status) {
    case "succeeded":
      return "succeeded";
    case "canceled":
      return "canceled";
    case "waiting_for_capture":
    case "pending":
      return "pending";
    default:
      return "failed";
  }
}

export function mapPaymentStatusMeta(status: string, options?: { isConfirmationExpired?: boolean }) {
  if (status === "pending" && options?.isConfirmationExpired) {
    return {
      label: "Сессия оплаты истекла",
      tone: "muted" as PaymentStatusTone,
      description: "Время на подтверждение платежа истекло. Создайте новый платёж, чтобы попробовать снова."
    };
  }

  switch (status) {
    case "succeeded":
      return {
        label: "Оплачено",
        tone: "success" as PaymentStatusTone,
        description: "Платёж успешно получен и подтверждён ЮKassa."
      };
    case "canceled":
      return {
        label: "Отменено",
        tone: "danger" as PaymentStatusTone,
        description: "Платёж был отменён или не был завершён пользователем."
      };
    case "failed":
      return {
        label: "Ошибка",
        tone: "danger" as PaymentStatusTone,
        description: "Не удалось завершить платёж. Попробуйте снова или выберите другой способ оплаты."
      };
    case "pending":
    default:
      return {
        label: "Ожидает оплаты",
        tone: "warning" as PaymentStatusTone,
        description: "Мы ждём подтверждение от ЮKassa. Обычно это занимает несколько секунд."
      };
  }
}
