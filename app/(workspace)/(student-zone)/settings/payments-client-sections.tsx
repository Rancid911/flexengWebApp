"use client";

import { useMemo } from "react";

import { StudentEmptyState } from "@/app/(workspace)/_components/student-page-primitives";
import {
  formatAmount,
  formatTimestamp,
  getPlanLessonPriceLabel,
  getPlanMetaLabel,
  getStatusChipClass,
  getStatusLabel
} from "@/app/(workspace)/(student-zone)/settings/payments-client-formatters";
import { Button } from "@/components/ui/button";
import type { StudentBillingSummary } from "@/lib/billing/types";
import {
  formatBillingBalance,
  formatBillingDebt,
  formatBillingEntryDetails,
  formatBillingEntryValue,
  formatBillingLessonPrice,
  formatBillingMoneyRemainder,
  getStudentBillingDirectionLabel,
  getStudentBillingModeLabel,
  getStudentBillingReasonLabel
} from "@/lib/billing/utils";
import type { getStudentPayments } from "@/lib/payments/queries";
import type { PaymentPlan } from "@/lib/payments/types";
import { cn } from "@/lib/utils";

type StudentPayment = Awaited<ReturnType<typeof getStudentPayments>>[number];

function getMoneyPlanLessonEstimate(plan: PaymentPlan, summary: StudentBillingSummary | null) {
  if (plan.billingCreditType !== "money" || !summary?.lessonPriceAmount || summary.lessonPriceAmount <= 0) return null;
  const lessonCount = Math.floor(plan.amount / summary.lessonPriceAmount);
  return `≈ ${lessonCount} уроков по ${formatAmount(summary.lessonPriceAmount, plan.currency)}`;
}

export function PaymentHero() {
  const paymentTrustChips = useMemo(() => ["Доступно уроков", "Цена урока", "История оплат"], []);

  return (
    <div className="relative overflow-hidden rounded-[1.8rem] border border-[#dfe9fb] bg-[linear-gradient(180deg,#fdfefe_0%,#f6f9ff_100%)] text-slate-900 shadow-[0_14px_28px_rgba(15,23,42,0.06)]">
      <div aria-hidden className="pointer-events-none absolute right-[12px] top-[-30px] h-[156px] w-[156px] rounded-full bg-[#dbeafe]/60 max-sm:right-[-10px] max-sm:h-[126px] max-sm:w-[126px]" />
      <div aria-hidden className="pointer-events-none absolute bottom-[-36px] right-[180px] h-[138px] w-[138px] rounded-full bg-[#eff6ff] max-sm:right-[88px] max-sm:h-[98px] max-sm:w-[98px]" />
      <div aria-hidden className="pointer-events-none absolute right-[36px] top-[138px] h-[56px] w-[56px] rounded-full bg-white/80 max-sm:right-[20px] max-sm:top-[126px] max-sm:h-[42px] max-sm:w-[42px]" />
      <div className="relative space-y-4 p-5 md:p-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#587198]">Оплата и списания</p>
          <h2 className="text-[1.8rem] font-black tracking-[-0.04em] text-slate-900">Текущий статус и пополнение</h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Здесь видно, сколько уроков доступно сейчас, по какой цене они считаются и какое пополнение лучше выбрать дальше.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {paymentTrustChips.map((chip) => (
            <span key={chip} className="inline-flex items-center rounded-full border border-[#dbe5f4] bg-white px-3.5 py-2 text-xs font-bold text-[#587198] shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BillingSummaryCard({ summary }: { summary: StudentBillingSummary | null }) {
  if (!summary) return null;

  return (
    <div className="rounded-[1.35rem] border border-[#dfe9fb] bg-[#f8fbff] px-4 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#5b6f92]">Текущий статус</p>
          <h3 className="text-lg font-black tracking-[-0.03em] text-slate-900">{getStudentBillingModeLabel(summary.currentMode)}</h3>
          <p className="text-sm text-slate-600">
            {summary.hasAccount ? "Списания по проведённым урокам считаются автоматически." : "Режим оплаты пока не настроен."}
          </p>
          {formatBillingLessonPrice(summary) ? <p className="text-sm text-slate-600">Цена урока: {formatBillingLessonPrice(summary)}</p> : null}
          {formatBillingMoneyRemainder(summary) ? <p className="text-sm text-slate-600">Денежный хвост: {formatBillingMoneyRemainder(summary)}</p> : null}
        </div>
        <div className="rounded-[1.1rem] border border-white/70 bg-white px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Доступно уроков</p>
          <p className="mt-1 text-xl font-black tracking-tight text-slate-900">{formatBillingBalance(summary)}</p>
          {formatBillingDebt(summary) ? <p className="mt-1 text-sm font-semibold text-slate-700">Задолженность: {formatBillingDebt(summary)}</p> : null}
        </div>
      </div>

      {formatBillingLessonPrice(summary) ? <p className="mt-3 text-sm text-slate-600">Цена урока: {formatBillingLessonPrice(summary)}</p> : null}
      {formatBillingMoneyRemainder(summary) ? <p className="mt-2 text-sm text-slate-600">Денежный остаток: {formatBillingMoneyRemainder(summary)}</p> : null}

      {summary.recentEntries.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-black text-slate-900">Последние операции</p>
          <div className="space-y-2">
            {summary.recentEntries.slice(0, 3).map((entry) => (
              <div key={entry.id} className="flex flex-col gap-1 rounded-2xl border border-[#e8eef8] bg-white px-3.5 py-3 text-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{getStudentBillingReasonLabel(entry.reason)}</p>
                  <p className="text-xs text-slate-500">
                    {getStudentBillingDirectionLabel(entry.entryDirection)}{entry.description ? ` · ${entry.description}` : ""}
                  </p>
                  {formatBillingEntryDetails(entry, summary.currency) ? <p className="text-xs text-slate-400">{formatBillingEntryDetails(entry, summary.currency)}</p> : null}
                </div>
                <p className={cn("font-black", entry.entryDirection === "credit" ? "text-emerald-600" : "text-slate-900")}>
                  {formatBillingEntryValue(entry, summary.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PaymentPlansSection({
  billingSummary,
  checkoutPlanId,
  featuredPlanId,
  handleCheckout,
  visiblePaymentPlans
}: {
  billingSummary: StudentBillingSummary | null;
  checkoutPlanId: string | null;
  featuredPlanId: string | null;
  handleCheckout: (planId: string) => Promise<void>;
  visiblePaymentPlans: PaymentPlan[];
}) {
  if (visiblePaymentPlans.length === 0) {
    return (
      <div className="mt-2">
        <StudentEmptyState title="Тарифы пока не опубликованы" description="Как только пакеты оплаты будут добавлены, они появятся здесь." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-black tracking-[-0.03em] text-[#12203b]">Пополнить</h2>
        <p className="text-sm text-[#60708e]">Для каждого варианта сразу показано, сколько уроков он добавит в вашем текущем режиме оплаты.</p>
      </div>
      <div className="space-y-3">
        <div className="mt-2 grid gap-4 xl:grid-cols-3">
          {visiblePaymentPlans.map((plan) => {
            const isFeatured = plan.id === featuredPlanId;
            return (
              <div
                key={plan.id}
                className={cn(
                  "group flex h-full flex-col rounded-[1.6rem] border p-5 transition-[transform,box-shadow,border-color,background-color] duration-200 md:p-6",
                  isFeatured
                    ? "border-indigo-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(238,242,255,0.92)_100%)] shadow-[0_18px_38px_rgba(99,102,241,0.14)] ring-1 ring-indigo-100"
                    : "border-[#e1e6ef] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-[0_14px_32px_rgba(15,23,42,0.07)]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-3">
                    <div className="flex min-h-8 flex-wrap items-center gap-2">
                      {plan.badge ? (
                        <span className={cn("rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]", isFeatured ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700")}>{plan.badge}</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">План</span>
                      )}
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{getPlanMetaLabel(plan)}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-slate-900">{plan.title}</h3>
                      {plan.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{plan.description}</p> : null}
                    </div>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <p className="text-[2rem] font-black tracking-tight text-slate-900">{formatAmount(plan.amount, plan.currency)}</p>
                  <p className="text-sm font-medium text-slate-500">Разовое пополнение</p>
                  <p className="text-sm text-slate-500">
                    {getPlanLessonPriceLabel(plan) ?? getMoneyPlanLessonEstimate(plan, billingSummary) ?? "После подтверждения запись сразу появится в истории операций."}
                  </p>
                  {plan.billingCreditType === "money" && !billingSummary?.lessonPriceAmount ? (
                    <p className="text-xs text-amber-600">Для расчёта уроков сначала должна быть настроена цена урока.</p>
                  ) : null}
                </div>
                <div className="mt-auto pt-6">
                  <Button
                    type="button"
                    className={cn("h-11 w-full rounded-2xl", isFeatured ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-900 text-white hover:bg-slate-800")}
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
  );
}

export function PaymentHistorySection({
  canCollapsePayments,
  checkoutPlanId,
  hasMorePayments,
  initialVisiblePaymentsCount,
  payments,
  setVisiblePaymentsCount,
  visiblePayments
}: {
  canCollapsePayments: boolean;
  checkoutPlanId: string | null;
  hasMorePayments: boolean;
  initialVisiblePaymentsCount: number;
  payments: StudentPayment[];
  setVisiblePaymentsCount: React.Dispatch<React.SetStateAction<number>>;
  visiblePayments: StudentPayment[];
}) {
  return (
    <section className="space-y-3 rounded-[1.8rem] border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] md:p-6">
      <div className="space-y-1">
        <h2 className="text-xl font-black tracking-tight text-slate-900">История оплат и списаний</h2>
        <p className="text-sm text-slate-500">Последние платежи и операции по урокам в спокойном хронологическом виде.</p>
      </div>

      {payments.length > 0 ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-[1.1rem] border border-[#e7ebf2] bg-[linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)]">
            {visiblePayments.map((item, index) => (
              <div key={`${item.id}-${index}`} className={cn("px-3.5 py-3.5 md:px-4 md:py-4", index !== visiblePayments.length - 1 && "border-b border-[#edf1f7]")}>
                <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="text-base font-black tracking-tight text-slate-900 md:text-[1.05rem]">{formatAmount(item.amount, item.currency)}</p>
                      <p className="truncate text-sm font-medium text-slate-700">{item.planTitle ?? item.description ?? "Оплата обучения"}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span>{formatTimestamp(item.paidAt ?? item.createdAt)}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>{item.providerPaymentId ? "Оплата через ЮKassa" : "Операция в истории"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:min-w-[220px] md:justify-end">
                    <p className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getStatusChipClass(item.status, item.isConfirmationExpired)}`}>
                      {getStatusLabel(item.status, item.isConfirmationExpired)}
                    </p>
                    {item.status === "pending" && item.confirmationUrl && !item.isConfirmationExpired ? (
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 rounded-xl bg-white px-3 text-xs font-semibold text-slate-900 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.35)] hover:bg-slate-50"
                        disabled={checkoutPlanId !== null}
                        onClick={() => {
                          if (!item.confirmationUrl) return;
                          window.location.assign(item.confirmationUrl);
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

          {payments.length > initialVisiblePaymentsCount ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-[#edf1f7] bg-slate-50/70 px-3.5 py-3 text-sm text-slate-600">
              <p>Показано {visiblePayments.length} из {payments.length}</p>
              <div className="flex items-center gap-2">
                {canCollapsePayments ? (
                  <Button type="button" variant="ghost" className="h-8 rounded-xl px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900" onClick={() => setVisiblePaymentsCount(initialVisiblePaymentsCount)}>
                    Свернуть
                  </Button>
                ) : null}
                {hasMorePayments ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                    onClick={() => setVisiblePaymentsCount((currentCount) => Math.min(currentCount + initialVisiblePaymentsCount, payments.length))}
                  >
                    Загрузить ещё
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <StudentEmptyState title="История оплат пуста" description="После первой успешной оплаты операции начнут отображаться в этой секции." />
      )}
    </section>
  );
}
