"use client";

import { useEffect, useState } from "react";

import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncFeedback } from "@/hooks/use-async-feedback";
import type { StudentBillingSummary } from "@/lib/billing/types";

async function parseApiResponse(response: Response) {
  if (response.ok) return response.json();
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
  throw new Error(payload?.message || "Не удалось выполнить запрос");
}

export function useStudentBillingSettingsState({
  studentId,
  initialBillingSummary,
  loadOnMount = false
}: {
  studentId: string;
  initialBillingSummary: StudentBillingSummary | null;
  loadOnMount?: boolean;
}) {
  const [billingSummary, setBillingSummary] = useState(initialBillingSummary);
  const [billingLoading, setBillingLoading] = useState(loadOnMount && initialBillingSummary == null);
  const [billingMode, setBillingMode] = useState(initialBillingSummary?.currentMode ?? "");
  const [lessonPriceAmount, setLessonPriceAmount] = useState(
    initialBillingSummary?.lessonPriceAmount != null ? String(initialBillingSummary.lessonPriceAmount) : ""
  );
  const [adjustmentType, setAdjustmentType] = useState<"lesson" | "money">("lesson");
  const [adjustmentDirection, setAdjustmentDirection] = useState<"credit" | "debit">("credit");
  const [adjustmentValue, setAdjustmentValue] = useState("");
  const [adjustmentDescription, setAdjustmentDescription] = useState("");
  const { error: billingError, setErrorMessage: setBillingError, clearError: clearBillingError } = useAsyncFeedback();
  const { pending: billingSaving, run: runBillingAction } = useAsyncAction();
  const { pending: adjustmentSaving, run: runAdjustmentAction } = useAsyncAction();

  useEffect(() => {
    setBillingSummary(initialBillingSummary);
    setBillingLoading(loadOnMount && initialBillingSummary == null);
  }, [initialBillingSummary, loadOnMount]);

  useEffect(() => {
    if (!loadOnMount || initialBillingSummary != null) return;

    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(`/api/students/${studentId}/billing`, { cache: "no-store" });
        const summary = (await parseApiResponse(response)) as StudentBillingSummary;
        if (cancelled) return;

        setBillingSummary(summary);
        setBillingMode(summary.currentMode ?? "");
        setLessonPriceAmount(summary.lessonPriceAmount != null ? String(summary.lessonPriceAmount) : "");
      } catch (requestError) {
        if (!cancelled) {
          setBillingError(requestError instanceof Error ? requestError.message : "Не удалось загрузить данные об оплате");
        }
      } finally {
        if (!cancelled) {
          setBillingLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialBillingSummary, loadOnMount, setBillingError, studentId]);

  const saveBillingSettings = async () => {
    await runBillingAction({
      onStart: clearBillingError,
      onError: (requestError) => {
        setBillingError(requestError instanceof Error ? requestError.message : "Не удалось сохранить настройки списания");
      },
      action: async () => {
        const response = await fetch(`/api/students/${studentId}/billing`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            billingMode: billingMode || null,
            lessonPriceAmount: billingMode === "per_lesson_price" && lessonPriceAmount.trim() ? Number(lessonPriceAmount) : null
          })
        });
        return (await parseApiResponse(response)) as StudentBillingSummary;
      },
      onSuccess: (nextSummary) => {
        setBillingSummary(nextSummary);
        setBillingMode(nextSummary.currentMode ?? "");
        setLessonPriceAmount(nextSummary.lessonPriceAmount != null ? String(nextSummary.lessonPriceAmount) : "");
      }
    });
  };

  const createAdjustment = async () => {
    await runAdjustmentAction({
      onStart: clearBillingError,
      onError: (requestError) => {
        setBillingError(requestError instanceof Error ? requestError.message : "Не удалось сохранить корректировку");
      },
      action: async () => {
        const response = await fetch(`/api/students/${studentId}/billing/adjustments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unitType: adjustmentType,
            direction: adjustmentDirection,
            value: Number(adjustmentValue),
            description: adjustmentDescription.trim() || null
          })
        });
        return (await parseApiResponse(response)) as StudentBillingSummary;
      },
      onSuccess: (nextSummary) => {
        setBillingSummary(nextSummary);
        setAdjustmentValue("");
        setAdjustmentDescription("");
      }
    });
  };

  return {
    billingSummary,
    billingLoading,
    billingMode,
    lessonPriceAmount,
    billingError,
    billingSaving,
    adjustmentType,
    adjustmentDirection,
    adjustmentValue,
    adjustmentDescription,
    adjustmentSaving,
    setBillingMode,
    setLessonPriceAmount,
    setAdjustmentType,
    setAdjustmentDirection,
    setAdjustmentValue,
    setAdjustmentDescription,
    saveBillingSettings,
    createAdjustment
  };
}
