"use client";

import { useStudentPaymentsState } from "@/app/(workspace)/(student-zone)/settings/use-student-payments-state";
import {
  BillingSummaryCard,
  PaymentHero,
  PaymentHistorySection,
  PaymentPlansSection
} from "@/app/(workspace)/(student-zone)/settings/payments-client-sections";
import {
  formatAmount,
  formatTimestamp,
  getPlanMetaLabel,
  getStatusChipClass,
  getStatusLabel
} from "@/app/(workspace)/(student-zone)/settings/payments-client-formatters";
import { StatusMessage } from "@/components/ui/status-message";
import type { StudentBillingSummary } from "@/lib/billing/types";
import type { getStudentPayments } from "@/lib/payments/queries";
import type { PaymentPlan, PaymentStatusContext } from "@/lib/payments/types";
import { cn } from "@/lib/utils";

type StudentPayment = Awaited<ReturnType<typeof getStudentPayments>>[number];

export { formatAmount, formatTimestamp, getPlanMetaLabel, getStatusChipClass, getStatusLabel };

export function PaymentsClient({
  initialPayments,
  initialBillingSummary,
  initialPlans,
  paymentStatusContext
}: {
  initialPayments: StudentPayment[];
  initialBillingSummary: StudentBillingSummary | null;
  initialPlans: PaymentPlan[];
  paymentStatusContext: PaymentStatusContext | null;
}) {
  const {
    billingSummary,
    canCollapsePayments,
    checkoutPlanId,
    featuredPlanId,
    handleCheckout,
    hasMorePayments,
    paymentActionError,
    paymentStatus,
    payments,
    setVisiblePaymentsCount,
    visiblePaymentPlans,
    visiblePayments,
    initialVisiblePaymentsCount
  } = useStudentPaymentsState({
    initialPayments,
    initialBillingSummary,
    initialPlans,
    paymentStatusContext
  });

  return (
    <div className="space-y-5 pb-8">
      <section className="space-y-6">
        <section className="space-y-5 rounded-[1.8rem] border border-[#dfe5ef] bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] p-5 shadow-[0_14px_32px_rgba(15,23,42,0.05)] md:p-6">
          <PaymentHero />

          <div className="space-y-3">
            <BillingSummaryCard summary={billingSummary} />

            {paymentStatus ? (
              <StatusMessage
                tone={paymentStatus.tone === "success" ? "success" : paymentStatus.tone === "warning" ? "warning" : "error"}
                className={cn(
                  "rounded-[1.2rem]",
                  paymentStatus.tone === "success"
                    ? "bg-emerald-50/90 text-emerald-900"
                    : paymentStatus.tone === "warning"
                      ? "bg-amber-50/90 text-amber-900"
                      : paymentStatus.tone === "danger"
                        ? "bg-red-50/90 text-red-900"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                )}
              >
                <p className="font-semibold">{paymentStatus.label}</p>
                <p className="mt-1 text-sm/6">{paymentStatus.description}</p>
              </StatusMessage>
            ) : null}

            {paymentActionError ? (
              <StatusMessage className="rounded-[1.2rem] bg-red-50/90 text-red-900">
                <p className="font-semibold">Не удалось перейти к оплате</p>
                <p className="mt-1 text-sm/6">{paymentActionError}</p>
              </StatusMessage>
            ) : null}
          </div>

          <PaymentPlansSection
            billingSummary={billingSummary}
            checkoutPlanId={checkoutPlanId}
            featuredPlanId={featuredPlanId}
            handleCheckout={handleCheckout}
            visiblePaymentPlans={visiblePaymentPlans}
          />
        </section>

        <PaymentHistorySection
          canCollapsePayments={canCollapsePayments}
          checkoutPlanId={checkoutPlanId}
          hasMorePayments={hasMorePayments}
          initialVisiblePaymentsCount={initialVisiblePaymentsCount}
          payments={payments}
          setVisiblePaymentsCount={setVisiblePaymentsCount}
          visiblePayments={visiblePayments}
        />
      </section>
    </div>
  );
}
