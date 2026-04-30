"use client";

import { useCallback, type FormEvent } from "react";

import { defaultNotificationForm, type NotificationForm } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import type { DataDeps, NotificationFormSetter, RefreshDeps } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console-action-types";
import { fetchJson } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.utils";
import { useAdminActionRunner } from "@/app/(workspace)/(staff-zone)/admin/ui/use-admin-action-runner";
import type { AdminNotificationDto } from "@/lib/admin/types";

function toIsoDateTimeOrNull(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export function useAdminNotificationsActions({
  editingNotification,
  refresh,
  data,
  setActionError,
  setEditingNotification,
  setNotificationForm,
  setNotificationsDrawerOpen
}: {
  editingNotification: AdminNotificationDto | null;
  refresh: Pick<RefreshDeps, "notificationsPage" | "notificationsPageCount" | "notificationsQuery" | "prefetchNeighbors">;
  data: Pick<DataDeps, "invalidateCacheForQuery" | "loadNotificationsPageData">;
  setActionError: (value: string) => void;
  setEditingNotification: (value: AdminNotificationDto | null) => void;
  setNotificationForm: NotificationFormSetter;
  setNotificationsDrawerOpen: (value: boolean) => void;
}) {
  const { pending: submittingNotification, runWithActionError } = useAdminActionRunner(setActionError);

  const openCreateNotificationDrawer = useCallback(() => {
    setEditingNotification(null);
    setNotificationForm(defaultNotificationForm);
    setNotificationsDrawerOpen(true);
  }, [setEditingNotification, setNotificationForm, setNotificationsDrawerOpen]);

  const startEditingNotification = useCallback(
    (item: AdminNotificationDto, nextForm: NotificationForm) => {
      setEditingNotification(item);
      setNotificationForm(nextForm);
      setNotificationsDrawerOpen(true);
    },
    [setEditingNotification, setNotificationForm, setNotificationsDrawerOpen]
  );

  const submitNotification = useCallback(
    async (event: FormEvent, notificationForm: NotificationForm) => {
      event.preventDefault();
      if (submittingNotification) return;
      await runWithActionError({
        fallbackMessage: "Не удалось сохранить уведомление",
        action: async () => {
          const payload = {
            title: notificationForm.title.trim(),
            body: notificationForm.body.trim(),
            type: notificationForm.type,
            is_active: notificationForm.is_active,
            target_roles: notificationForm.target_roles.includes("all") ? ["all"] : notificationForm.target_roles,
            published_at: toIsoDateTimeOrNull(notificationForm.published_at) ?? new Date().toISOString(),
            expires_at: toIsoDateTimeOrNull(notificationForm.expires_at)
          };

          if (editingNotification) {
            await fetchJson(`/api/admin/notifications/${editingNotification.id}`, { method: "PATCH", body: JSON.stringify(payload) });
          } else {
            await fetchJson("/api/admin/notifications", { method: "POST", body: JSON.stringify(payload) });
          }

          setNotificationsDrawerOpen(false);
          setEditingNotification(null);
          setNotificationForm(defaultNotificationForm);
          data.invalidateCacheForQuery("notifications", refresh.notificationsQuery);
          await data.loadNotificationsPageData(refresh.notificationsPage, refresh.notificationsQuery, { revalidate: true });
          refresh.prefetchNeighbors("notifications", refresh.notificationsPage, refresh.notificationsPageCount, refresh.notificationsQuery);
        }
      });
    },
    [data, editingNotification, refresh, runWithActionError, setEditingNotification, setNotificationForm, setNotificationsDrawerOpen, submittingNotification]
  );

  const deleteNotification = useCallback(
    async (id: string) => {
      if (!window.confirm("Удалить уведомление?")) return;
      await runWithActionError({
        fallbackMessage: "Не удалось удалить уведомление",
        action: async () => {
          await fetchJson(`/api/admin/notifications/${id}`, { method: "DELETE" });
          data.invalidateCacheForQuery("notifications", refresh.notificationsQuery);
          await data.loadNotificationsPageData(refresh.notificationsPage, refresh.notificationsQuery, { revalidate: true });
          refresh.prefetchNeighbors("notifications", refresh.notificationsPage, refresh.notificationsPageCount, refresh.notificationsQuery);
        }
      });
    },
    [data, refresh, runWithActionError]
  );

  return { deleteNotification, openCreateNotificationDrawer, startEditingNotification, submitNotification, submittingNotification };
}
