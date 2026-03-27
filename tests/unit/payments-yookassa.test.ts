import { describe, expect, it } from "vitest";

import {
  getYooKassaConfirmationExpiresAt,
  isYooKassaConfirmationExpired,
  mapPaymentStatusMeta,
  mapProviderStatusToTransactionStatus,
  YOOKASSA_CONFIRMATION_TTL_MS
} from "@/lib/payments/yookassa";

describe("payments yookassa helpers", () => {
  it("maps provider statuses to internal transaction statuses", () => {
    expect(mapProviderStatusToTransactionStatus("succeeded")).toBe("succeeded");
    expect(mapProviderStatusToTransactionStatus("canceled")).toBe("canceled");
    expect(mapProviderStatusToTransactionStatus("waiting_for_capture")).toBe("pending");
    expect(mapProviderStatusToTransactionStatus("pending")).toBe("pending");
    expect(mapProviderStatusToTransactionStatus("unknown")).toBe("failed");
  });

  it("returns ui metadata for payment statuses", () => {
    expect(mapPaymentStatusMeta("succeeded")).toMatchObject({ label: "Оплачено", tone: "success" });
    expect(mapPaymentStatusMeta("pending")).toMatchObject({ label: "Ожидает оплаты", tone: "warning" });
    expect(mapPaymentStatusMeta("pending", { isConfirmationExpired: true })).toMatchObject({
      label: "Сессия оплаты истекла",
      tone: "muted"
    });
    expect(mapPaymentStatusMeta("failed")).toMatchObject({ label: "Ошибка", tone: "danger" });
  });

  it("derives confirmation expiration and detects stale pending payments", () => {
    const createdAt = "2026-03-27T10:00:00.000Z";

    expect(getYooKassaConfirmationExpiresAt(createdAt)).toBe("2026-03-27T11:00:00.000Z");
    expect(isYooKassaConfirmationExpired("pending", createdAt, Date.parse(createdAt) + YOOKASSA_CONFIRMATION_TTL_MS - 1)).toBe(false);
    expect(isYooKassaConfirmationExpired("pending", createdAt, Date.parse(createdAt) + YOOKASSA_CONFIRMATION_TTL_MS)).toBe(true);
    expect(isYooKassaConfirmationExpired("succeeded", createdAt, Date.parse(createdAt) + YOOKASSA_CONFIRMATION_TTL_MS)).toBe(false);
  });
});
