"use client";

import { useCallback } from "react";

import { useKeyedAsyncAction } from "@/hooks/use-keyed-async-action";
import type { UserNotificationDto } from "@/lib/admin/types";
import type { NotificationsCacheData } from "@/lib/dashboard-cache";
import { mapUiErrorMessage } from "@/lib/ui-error-map";

import { dismissNotificationRequest, markNotificationReadRequest } from "./dashboard-notifications.api";

type UseDashboardNotificationMutationsParams = {
  applyNotificationsSnapshot: (snapshot: NotificationsCacheData, options?: { persist?: boolean }) => void;
  getCurrentSnapshot: () => NotificationsCacheData;
  loadNotifications: (setNotificationsError: (message: string) => void, options?: { silent?: boolean; onlyIfStale?: boolean }) => Promise<void>;
  setNotificationsError: (message: string) => void;
};

export function useDashboardNotificationMutations({
  applyNotificationsSnapshot,
  getCurrentSnapshot,
  loadNotifications,
  setNotificationsError,
}: UseDashboardNotificationMutationsParams) {
  const { pendingByKey: readingIds, run: runReadAction } = useKeyedAsyncAction();
  const { pendingByKey: dismissingIds, run: runDismissAction } = useKeyedAsyncAction();

  const dismissNotification = useCallback(
    async (notification: UserNotificationDto) => {
      if (dismissingIds[notification.id]) return;
      const prevSnapshot = getCurrentSnapshot();
      const nextSnapshot: NotificationsCacheData = {
        items: prevSnapshot.items.filter((item) => item.id !== notification.id),
        unreadCount: notification.is_read ? prevSnapshot.unreadCount : Math.max(0, prevSnapshot.unreadCount - 1),
        fetchedAt: Date.now()
      };

      await runDismissAction(notification.id, {
        onStart: () => {
          applyNotificationsSnapshot(nextSnapshot);
        },
        onError: (error) => {
          console.error("NOTIFICATIONS_DISMISS_ERROR", error);
          applyNotificationsSnapshot(prevSnapshot);
          setNotificationsError(
            mapUiErrorMessage(error instanceof Error ? error.message : "", "Не удалось скрыть уведомление. Попробуйте ещё раз.")
          );
        },
        action: async () => {
          if (!notification.is_read) {
            await markNotificationReadRequest(notification.id);
          }
          await dismissNotificationRequest(notification.id);
        },
        onSuccess: () => {
          void loadNotifications(setNotificationsError, { silent: true, onlyIfStale: false });
        }
      });
    },
    [applyNotificationsSnapshot, dismissingIds, getCurrentSnapshot, loadNotifications, runDismissAction, setNotificationsError]
  );

  const markNotificationRead = useCallback(
    async (notification: UserNotificationDto) => {
      if (notification.is_read || readingIds[notification.id] || dismissingIds[notification.id]) return;
      const prevSnapshot = getCurrentSnapshot();
      const nextSnapshot: NotificationsCacheData = {
        items: prevSnapshot.items.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)),
        unreadCount: Math.max(0, prevSnapshot.unreadCount - 1),
        fetchedAt: Date.now()
      };

      await runReadAction(notification.id, {
        onStart: () => {
          applyNotificationsSnapshot(nextSnapshot);
        },
        onError: (error) => {
          console.error("NOTIFICATIONS_READ_ERROR", error);
          applyNotificationsSnapshot(prevSnapshot);
        },
        action: async () => {
          await markNotificationReadRequest(notification.id);
        },
        onSuccess: () => {
          void loadNotifications(setNotificationsError, { silent: true, onlyIfStale: false });
        }
      });
    },
    [applyNotificationsSnapshot, dismissingIds, getCurrentSnapshot, loadNotifications, readingIds, runReadAction, setNotificationsError]
  );

  return {
    dismissNotification,
    dismissingIds,
    markNotificationRead,
    readingIds
  };
}
