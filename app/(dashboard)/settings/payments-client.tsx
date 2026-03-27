"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { StudentEmptyState } from "@/app/(dashboard)/_components/student-page-primitives";
import { Button } from "@/components/ui/button";
import type { getStudentPayments } from "@/lib/payments/queries";
import type { PaymentPlan, PaymentStatusContext } from "@/lib/payments/types";
import { cn } from "@/lib/utils";

type StudentPayment = Awaited<ReturnType<typeof getStudentPayments>>[number];

export function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currency || "RUB",
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatTimestamp(value: string | null) {
  if (!value) return "Дата уточняется";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата уточняется";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
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
  const normalized = `${plan.title} ${plan.yookassaProductLabel}`.toLowerCase();
  if (normalized.includes("консульта")) return "Персональная сессия";
  if (normalized.includes("8")) return "8 занятий";
  if (normalized.includes("4")) return "4 занятия";
  if (normalized.includes("месяц")) return "Месячный формат";
  return "Разовый платёж";
}

export function PaymentsClient({
  initialPayments,
  initialPlans,
  paymentStatusContext
}: {
  initialPayments: StudentPayment[];
  initialPlans: PaymentPlan[];
  paymentStatusContext: PaymentStatusContext | null;
}) {
  const initialVisiblePaymentsCount = 5;
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  const [paymentActionError, setPaymentActionError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusContext | null>(paymentStatusContext);
  const [visiblePaymentsCount, setVisiblePaymentsCount] = useState(initialVisiblePaymentsCount);

  const visiblePaymentPlans = useMemo(
    () =>
      initialPlans
        .filter((plan) => !`${plan.title} ${plan.yookassaProductLabel}`.toLowerCase().includes("интенсив"))
        .slice(0, 3),
    [initialPlans]
  );
  const featuredPlanId = useMemo(
    () =>
      visiblePaymentPlans.find((plan) => plan.badge?.toLowerCase().includes("лучший выбор"))?.id ??
      visiblePaymentPlans[0]?.id ??
      null,
    [visiblePaymentPlans]
  );
  const paymentTrustChips = useMemo(() => ["Выберите тариф", "Безопасная оплата", "Чек автоматически"], []);
  const visiblePayments = useMemo(
    () => initialPayments.slice(0, visiblePaymentsCount),
    [initialPayments, visiblePaymentsCount]
  );
  const hasMorePayments = visiblePaymentsCount < initialPayments.length;
  const canCollapsePayments = initialPayments.length > initialVisiblePaymentsCount && !hasMorePayments;

  useEffect(() => {
    setPaymentStatus(paymentStatusContext);
  }, [paymentStatusContext]);

  useEffect(() => {
    setVisiblePaymentsCount(initialVisiblePaymentsCount);
  }, [initialPayments]);

  const pollPaymentStatus = useCallback(async (transactionId: string) => {
    const response = await fetch(`/api/payments/yookassa/status?transactionId=${encodeURIComponent(transactionId)}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Не удалось обновить статус платежа");
    }

    const payload = (await response.json()) as PaymentStatusContext;
    setPaymentStatus(payload);
    return payload;
  }, []);

  useEffect(() => {
    if (!paymentStatusContext || paymentStatusContext.status !== "pending" || paymentStatusContext.isConfirmationExpired) return;

    let cancelled = false;
    let attempt = 0;

    const run = async () => {
      while (!cancelled && attempt < 5) {
        attempt += 1;
        await new Promise((resolve) => window.setTimeout(resolve, attempt === 1 ? 1200 : 2500));
        try {
          const payload = await pollPaymentStatus(paymentStatusContext.transactionId);
          if (payload.status !== "pending") return;
        } catch {
          return;
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [paymentStatusContext, pollPaymentStatus]);

  const handleCheckout = useCallback(async (planId: string) => {
    setPaymentActionError("");
    setCheckoutPlanId(planId);
    try {
      const response = await fetch("/api/payments/yookassa/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ planId })
      });

      const payload = (await response.json().catch(() => ({}))) as { redirectUrl?: string; message?: string };
      if (!response.ok || !payload.redirectUrl) {
        throw new Error(typeof payload.message === "string" ? payload.message : "Не удалось создать платёж");
      }

      window.location.assign(payload.redirectUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setPaymentActionError(message || "Не удалось запустить оплату");
    } finally {
      setCheckoutPlanId(null);
    }
  }, []);

  return (
    <div className="space-y-5 pb-8">
      <section className="space-y-6">
        <section className="space-y-5 rounded-[1.8rem] border border-[#dfe5ef] bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] p-5 shadow-[0_14px_32px_rgba(15,23,42,0.05)] md:p-6">
          <div className="relative overflow-hidden rounded-[1.8rem] border border-[#dfe9fb] bg-[linear-gradient(135deg,#6658f5_0%,#8b74ff_56%,#9f81ff_100%)] text-white shadow-[0_16px_34px_rgba(89,71,236,0.18)]">
            <div aria-hidden className="pointer-events-none absolute right-[12px] top-[-30px] h-[156px] w-[156px] rounded-full bg-white/20 max-sm:right-[-10px] max-sm:h-[126px] max-sm:w-[126px]" />
            <div aria-hidden className="pointer-events-none absolute bottom-[-36px] right-[180px] h-[138px] w-[138px] rounded-full bg-white/14 max-sm:right-[88px] max-sm:h-[98px] max-sm:w-[98px]" />
            <div aria-hidden className="pointer-events-none absolute right-[36px] top-[138px] h-[56px] w-[56px] rounded-full bg-white/10 max-sm:right-[20px] max-sm:top-[126px] max-sm:h-[42px] max-sm:w-[42px]" />
            <div className="relative space-y-4 p-5 md:p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#eef2ff]">Оплата обучения</p>
                <h2 className="text-[1.8rem] font-black tracking-[-0.04em] text-white">Выберите подходящий тариф</h2>
                <p className="max-w-2xl text-sm leading-6 text-[#eef3ff]">
                  Здесь можно быстро оплатить обучение, выбрать подходящий пакет и перейти на защищённую страницу оплаты.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {paymentTrustChips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center rounded-full border border-white/18 bg-white/14 px-3.5 py-2 text-xs font-bold text-[#eef7ff] backdrop-blur-sm"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {paymentStatus ? (
              <div
                className={cn(
                  "rounded-[1.2rem] border px-4 py-3 text-sm",
                  paymentStatus.tone === "success"
                    ? "border-emerald-200 bg-emerald-50/90 text-emerald-900"
                    : paymentStatus.tone === "danger"
                      ? "border-red-200 bg-red-50/90 text-red-900"
                      : paymentStatus.tone === "warning"
                        ? "border-amber-200 bg-amber-50/90 text-amber-900"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                )}
              >
                <p className="font-semibold">{paymentStatus.label}</p>
                <p className="mt-1 text-sm/6">{paymentStatus.description}</p>
              </div>
            ) : null}

            {paymentActionError ? (
              <div className="rounded-[1.2rem] border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900">
                <p className="font-semibold">Не удалось перейти к оплате</p>
                <p className="mt-1 text-sm/6">{paymentActionError}</p>
              </div>
            ) : null}
          </div>

          {visiblePaymentPlans.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-black tracking-[-0.03em] text-[#12203b]">Доступные тарифы</h2>
                <p className="text-sm text-[#60708e]">Выберите пакет и перейдите к оплате на защищённой внешней странице.</p>
              </div>
              <div className="space-y-3">
                <div className="mt-2 grid gap-4 xl:grid-cols-3">
                  {visiblePaymentPlans.map((plan) => {
                    const isFeatured = plan.id === featuredPlanId;
                    return (
                      <div
                        key={plan.id}
                        className={cn(
                          "group flex h-full flex-col rounded-[1.6rem] border p-5 transition-all duration-200 md:p-6",
                          isFeatured
                            ? "border-indigo-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(238,242,255,0.92)_100%)] shadow-[0_18px_38px_rgba(99,102,241,0.14)] ring-1 ring-indigo-100"
                            : "border-[#e1e6ef] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-[0_14px_32px_rgba(15,23,42,0.07)]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-3">
                            <div className="flex min-h-8 flex-wrap items-center gap-2">
                              {plan.badge ? (
                                <span
                                  className={cn(
                                    "rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]",
                                    isFeatured ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700"
                                  )}
                                >
                                  {plan.badge}
                                </span>
                              ) : (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                  Тариф
                                </span>
                              )}
                              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                {getPlanMetaLabel(plan)}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-xl font-black tracking-tight text-slate-900">{plan.title}</h3>
                              {plan.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{plan.description}</p> : null}
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 space-y-2">
                          <p className="text-[2rem] font-black tracking-tight text-slate-900">{formatAmount(plan.amount, plan.currency)}</p>
                          <p className="text-sm font-medium text-slate-500">Разовый платёж</p>
                          <p className="text-sm text-slate-500">После подтверждения запись сразу появится в истории операций.</p>
                        </div>
                        <div className="mt-auto pt-6">
                          <Button
                            type="button"
                            className={cn(
                              "h-11 w-full rounded-2xl",
                              isFeatured ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-900 text-white hover:bg-slate-800"
                            )}
                            disabled={checkoutPlanId !== null}
                            onClick={() => void handleCheckout(plan.id)}
                          >
                            {checkoutPlanId === plan.id ? "Переход к оплате..." : "Оплатить"}
                          </Button>
                          <p className="mt-3 text-xs leading-5 text-slate-400">Откроется внешняя платёжная страница ЮKassa.</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            ) : (
              <div className="mt-2">
                <StudentEmptyState title="Тарифы пока не опубликованы" description="Как только пакеты оплаты будут добавлены, они появятся здесь." />
              </div>
            )}
          </section>

      <section className="space-y-3 rounded-[1.8rem] border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] md:p-6">
        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight text-slate-900">История платежей</h2>
          <p className="text-sm text-slate-500">Все операции по обучению и их актуальный статус.</p>
        </div>

        {initialPayments.length > 0 ? (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-[1.1rem] border border-[#e7ebf2] bg-[linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)]">
              {visiblePayments.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className={cn(
                  "px-3.5 py-3.5 md:px-4 md:py-4",
                  index !== visiblePayments.length - 1 && "border-b border-[#edf1f7]"
                )}
              >
                <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="text-base font-black tracking-tight text-slate-900 md:text-[1.05rem]">
                        {formatAmount(item.amount, item.currency)}
                      </p>
                      <p className="truncate text-sm font-medium text-slate-700">
                        {item.planTitle ?? item.description ?? "Платёж по обучению"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span>{formatTimestamp(item.paidAt ?? item.createdAt)}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>{item.providerPaymentId ? "Платёж через ЮKassa" : "Запись в истории"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:min-w-[220px] md:justify-end">
                    <p
                      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getStatusChipClass(item.status, item.isConfirmationExpired)}`}
                    >
                      {getStatusLabel(item.status, item.isConfirmationExpired)}
                    </p>
                    {item.status === "pending" && item.confirmationUrl && !item.isConfirmationExpired ? (
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 rounded-xl bg-white px-3 text-xs font-semibold text-slate-900 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.35)] hover:bg-slate-50"
                        disabled={checkoutPlanId !== null}
                        onClick={() => {
                          if (!item.confirmationUrl) {
                            return
                          }

                          window.location.assign(item.confirmationUrl)
                        }}
                      >
                        Продолжить оплату
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
              ))}
            </div>

            {initialPayments.length > initialVisiblePaymentsCount ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-[#edf1f7] bg-slate-50/70 px-3.5 py-3 text-sm text-slate-600">
                <p>
                  Показано {visiblePayments.length} из {initialPayments.length}
                </p>
                <div className="flex items-center gap-2">
                  {canCollapsePayments ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 rounded-xl px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      onClick={() => setVisiblePaymentsCount(initialVisiblePaymentsCount)}
                    >
                      Свернуть
                    </Button>
                  ) : null}
                  {hasMorePayments ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                      onClick={() =>
                        setVisiblePaymentsCount((currentCount) =>
                          Math.min(currentCount + initialVisiblePaymentsCount, initialPayments.length)
                        )
                      }
                    >
                      Загрузить ещё
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <StudentEmptyState
            title="История оплат пуста"
            description="После первой успешной оплаты операции начнут отображаться в этой секции."
          />
        )}
      </section>
      </section>
    </div>
  );
}
