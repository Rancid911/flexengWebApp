import { formatRuLongDate } from "@/lib/dates/format-ru-date";
import type { PaymentPlan } from "@/lib/payments/types";

export function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currency || "RUB",
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatTimestamp(value: string | null) {
  if (!value) return "Дата уточняется";
  return formatRuLongDate(value) || "Дата уточняется";
}

export function getStatusChipClass(status: string, isConfirmationExpired = false) {
  if (status === "pending" && isConfirmationExpired) {
    return "bg-slate-100 text-slate-600";
  }

  switch (status) {
    case "succeeded":
      return "bg-emerald-50 text-emerald-700";
    case "canceled":
    case "failed":
      return "bg-red-50 text-red-700";
    case "pending":
    default:
      return "bg-amber-50 text-amber-700";
  }
}

export function getStatusLabel(status: string, isConfirmationExpired = false) {
  if (status === "pending" && isConfirmationExpired) {
    return "Сессия истекла";
  }

  switch (status) {
    case "succeeded":
      return "Оплачено";
    case "canceled":
      return "Отменено";
    case "failed":
      return "Ошибка";
    case "pending":
    default:
      return "Ожидает оплаты";
  }
}

export function getPlanMetaLabel(plan: PaymentPlan) {
  if (plan.billingCreditType === "lesson" && plan.creditLessonUnits) {
    return `${plan.creditLessonUnits} уроков`;
  }

  if (plan.billingCreditType === "money") {
    return "Пополнение баланса";
  }

  const normalized = `${plan.title} ${plan.yookassaProductLabel}`.toLowerCase();
  if (normalized.includes("консульта")) return "Персональная сессия";
  if (normalized.includes("8")) return "8 занятий";
  if (normalized.includes("4")) return "4 занятия";
  if (normalized.includes("месяц")) return "Месячный формат";
  return "Разовый платёж";
}

export function getPlanLessonPriceLabel(plan: PaymentPlan) {
  if (plan.billingCreditType !== "lesson" || !plan.creditLessonUnits) return null;
  const effectiveLessonPrice = plan.amount / plan.creditLessonUnits;
  return `Цена урока ${formatAmount(effectiveLessonPrice, plan.currency)}`;
}
