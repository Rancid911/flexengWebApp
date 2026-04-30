"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAbortableRequest } from "@/hooks/use-abortable-request";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncFeedback } from "@/hooks/use-async-feedback";
import type { getStudentPayments } from "@/lib/payments/queries";
import type { PaymentPlan, PaymentStatusContext } from "@/lib/payments/types";
import type { StudentBillingSummary } from "@/lib/billing/types";

type StudentPayment = Awaited<ReturnType<typeof getStudentPayments>>[number];

const INITIAL_VISIBLE_PAYMENTS_COUNT = 5;

export function useStudentPaymentsState({
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
  const [payments, setPayments] = useState(initialPayments);
  const [billingSummary, setBillingSummary] = useState(initialBillingSummary);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusContext | null>(paymentStatusContext);
  const [visiblePaymentsCount, setVisiblePaymentsCount] = useState(INITIAL_VISIBLE_PAYMENTS_COUNT);
  const { error: paymentActionError, setErrorMessage: setPaymentActionError, clearError: clearPaymentActionError } = useAsyncFeedback();
  const { run: runPaymentsRefresh } = useAbortableRequest();
  const { run: runStatusPoll } = useAbortableRequest();
  const { pending: checkoutPending, run: runCheckout } = useAsyncAction();
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);

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

  const visiblePayments = useMemo(
    () => payments.slice(0, visiblePaymentsCount),
    [payments, visiblePaymentsCount]
  );

  const hasMorePayments = visiblePaymentsCount < payments.length;
  const canCollapsePayments = payments.length > INITIAL_VISIBLE_PAYMENTS_COUNT && !hasMorePayments;

  useEffect(() => {
    setPaymentStatus(paymentStatusContext);
  }, [paymentStatusContext]);

  useEffect(() => {
    setVisiblePaymentsCount(INITIAL_VISIBLE_PAYMENTS_COUNT);
    setPayments(initialPayments);
    setBillingSummary(initialBillingSummary);
  }, [initialBillingSummary, initialPayments]);

  const refreshPayments = useCallback(async () => {
    return await runPaymentsRefresh({
      request: async (signal) => {
        const response = await fetch("/api/payments", {
          cache: "no-store",
          signal
        });

        if (!response.ok) {
          throw new Error("Не удалось обновить историю платежей");
        }

        const payload = (await response.json()) as { payments?: StudentPayment[]; billingSummary?: StudentBillingSummary | null };
        const nextPayments = Array.isArray(payload.payments) ? payload.payments : [];
        return {
          billingSummary: payload.billingSummary ?? null,
          payments: nextPayments
        };
      },
      onSuccess: ({ billingSummary: nextBillingSummary, payments: nextPayments }) => {
        setPayments(nextPayments);
        setBillingSummary(nextBillingSummary);
      }
    });
  }, [runPaymentsRefresh]);

  const refreshBillingSummary = useCallback(async () => {
    return await runPaymentsRefresh({
      request: async (signal) => {
        const response = await fetch("/api/payments?includePayments=0&includeBillingSummary=1", {
          cache: "no-store",
          signal
        });

        if (!response.ok) {
          throw new Error("Не удалось обновить историю платежей");
        }

        const payload = (await response.json()) as { payments?: StudentPayment[]; billingSummary?: StudentBillingSummary | null };
        return {
          billingSummary: payload.billingSummary ?? null,
          payments
        };
      },
      onSuccess: ({ billingSummary: nextBillingSummary }) => {
        setBillingSummary(nextBillingSummary);
      }
    });
  }, [payments, runPaymentsRefresh]);

  useEffect(() => {
    if (initialBillingSummary !== null) return;

    void refreshBillingSummary().catch(() => {
      // Keep the initial payments list visible even if deferred billing summary refresh fails.
    });
  }, [initialBillingSummary, refreshBillingSummary]);

  useEffect(() => {
    if (!paymentStatusContext) return;
    if (paymentStatusContext.status === "pending" && !paymentStatusContext.isConfirmationExpired) return;

    void refreshPayments().catch(() => {
      // Ignore background refresh failures. Server-rendered banner state still drives the UI.
    });
  }, [paymentStatusContext, refreshPayments]);

  const pollPaymentStatus = useCallback(
    async (transactionId: string) => {
      return await runStatusPoll({
        request: async (signal) => {
          const response = await fetch(`/api/payments/yookassa/status?transactionId=${encodeURIComponent(transactionId)}`, {
            cache: "no-store",
            signal
          });

          if (!response.ok) {
            throw new Error("Не удалось обновить статус платежа");
          }

          return (await response.json()) as PaymentStatusContext;
        },
        onSuccess: async (payload) => {
          setPaymentStatus(payload);

          if (payload.status !== "pending" || payload.isConfirmationExpired) {
            await refreshPayments();
          }
        }
      });
    },
    [refreshPayments, runStatusPoll]
  );

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
          if (!payload) {
            return;
          }
          if (payload.status !== "pending" || payload.isConfirmationExpired) {
            return;
          }
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
    await runCheckout({
      onStart: () => {
        clearPaymentActionError();
        setCheckoutPlanId(planId);
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : "";
        setPaymentActionError(message || "Не удалось запустить оплату");
      },
      action: async () => {
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

        return payload.redirectUrl;
      },
      onSuccess: (redirectUrl) => {
        window.location.assign(redirectUrl);
      }
    });
    setCheckoutPlanId(null);
  }, [clearPaymentActionError, runCheckout, setPaymentActionError]);

  return {
    billingSummary,
    canCollapsePayments,
    checkoutPlanId: checkoutPending ? checkoutPlanId : null,
    featuredPlanId,
    handleCheckout,
    hasMorePayments,
    paymentActionError,
    paymentStatus,
    payments,
    setVisiblePaymentsCount,
    visiblePaymentPlans,
    visiblePayments,
    visiblePaymentsCount,
    initialVisiblePaymentsCount: INITIAL_VISIBLE_PAYMENTS_COUNT
  };
}
