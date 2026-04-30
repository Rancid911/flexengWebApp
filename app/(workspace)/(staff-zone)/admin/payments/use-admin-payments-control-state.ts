"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { fetchJson } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.utils";
import { useAbortableRequest } from "@/hooks/use-abortable-request";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncFeedback } from "@/hooks/use-async-feedback";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type {
  AdminPaymentControlFilter,
  AdminPaymentControlResponse,
  AdminPaymentReminderSettingsDto
} from "@/lib/admin/types";

function pageCount(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function useAdminPaymentsControlState({
  initialData,
  initialSettings
}: {
  initialData: AdminPaymentControlResponse;
  initialSettings: AdminPaymentReminderSettingsDto;
}) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const [filter, setFilter] = useState<AdminPaymentControlFilter>("all");
  const [page, setPage] = useState(initialData.page);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const { error, successMessage, setErrorMessage, setSuccessMessage, clearError, clearFeedback } = useAsyncFeedback();
  const { run: runPaymentsQuery } = useAbortableRequest();
  const { pending: settingsSaving, run: runSettingsAction } = useAsyncAction();
  const { pending: reminderPending, run: runReminderAction } = useAsyncAction();
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const didSkipInitialFetchRef = useRef(false);

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const updateFilter = (value: AdminPaymentControlFilter) => {
    setFilter(value);
    setPage(1);
  };

  useEffect(() => {
    if (!didSkipInitialFetchRef.current && !debouncedQuery && filter === "all" && page === initialData.page) {
      didSkipInitialFetchRef.current = true;
      return;
    }

    void runPaymentsQuery({
      onStart: () => {
        setLoading(true);
        clearError();
      },
      onSuccess: (next) => {
        setData(next);
        setLoading(false);
      },
      onError: (requestError) => {
        setErrorMessage(requestError instanceof Error ? requestError.message : "Не удалось загрузить контроль платежей");
        setLoading(false);
      },
      request: async () => {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(initialData.pageSize),
          q: debouncedQuery,
          filter
        });

        return await fetchJson<AdminPaymentControlResponse>(`/api/admin/payments-control?${params.toString()}`);
      }
    });
  }, [clearError, debouncedQuery, filter, initialData.page, initialData.pageSize, page, runPaymentsQuery, setErrorMessage]);

  const currentPageCount = useMemo(() => pageCount(data.total, data.pageSize), [data.pageSize, data.total]);

  const saveSettings = async () => {
    await runSettingsAction({
      onStart: clearError,
      onError: (requestError) => {
        setErrorMessage(requestError instanceof Error ? requestError.message : "Не удалось сохранить настройки");
      },
      action: () =>
        fetchJson<AdminPaymentReminderSettingsDto>("/api/admin/payment-reminder-settings", {
          method: "PATCH",
          body: JSON.stringify(settings)
        }),
      onSuccess: (next) => {
        setSettings(next);
        setSuccessMessage("Настройки сохранены. Напоминания пересчитаны для студентов в зоне внимания.");
      }
    });
  };

  const sendReminder = async (studentId: string) => {
    await runReminderAction({
      onStart: () => {
        setSendingReminderId(studentId);
        clearFeedback();
      },
      onError: (requestError) => {
        setErrorMessage(requestError instanceof Error ? requestError.message : "Не удалось отправить напоминание");
      },
      action: () =>
        fetchJson("/api/admin/payments-control/reminders", {
          method: "POST",
          body: JSON.stringify({ studentId })
        }),
      onSuccess: () => {
        setSuccessMessage("Напоминание отправлено.");
      }
    });
    setSendingReminderId(null);
  };

  return {
    data,
    query,
    filter,
    page,
    loading,
    error,
    settings,
    settingsSaving,
    sendingReminderId: reminderPending ? sendingReminderId : null,
    successMessage,
    currentPageCount,
    setQuery: updateQuery,
    setFilter: updateFilter,
    setPage,
    setSettings,
    saveSettings,
    sendReminder
  };
}
