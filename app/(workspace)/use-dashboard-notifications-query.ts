"use client";

import { useCallback, useRef, useState } from "react";

import { type NotificationsCacheData } from "@/lib/dashboard-cache";
import { mapUiErrorMessage } from "@/lib/ui-error-map";
import { useAbortableRequest } from "@/hooks/use-abortable-request";

import { fetchNotificationsSnapshot, writeNotificationsUnreadSummary } from "./dashboard-notifications.api";
import {
  isNotificationsSnapshotStale,
  persistNotificationsSnapshot,
  readCachedNotificationsSnapshot
} from "@/app/(workspace)/dashboard-notifications.snapshot";

export function useDashboardNotificationsQuery({
  currentUserId
}: {
  currentUserId: string | null;
}) {
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationsCacheData["items"]>([]);
  const [hasNotificationsData, setHasNotificationsData] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsSnapshotRef = useRef<NotificationsCacheData | null>(null);
  const { run: runNotificationsLoad } = useAbortableRequest();

  const readCachedNotifications = useCallback((): NotificationsCacheData | null => {
    return readCachedNotificationsSnapshot(currentUserId);
  }, [currentUserId]);

  const applyNotificationsSnapshot = useCallback(
    (snapshot: NotificationsCacheData, options?: { persist?: boolean }) => {
      notificationsSnapshotRef.current = snapshot;
      setNotifications(snapshot.items);
      setUnreadCount(snapshot.unreadCount);
      setHasNotificationsData(true);
      writeNotificationsUnreadSummary(currentUserId, snapshot.unreadCount);

      persistNotificationsSnapshot(currentUserId, snapshot, options?.persist !== false);
    },
    [currentUserId]
  );

  const restoreCachedNotifications = useCallback(() => {
    const cachedSnapshot = readCachedNotifications();
    if (!cachedSnapshot) return false;
    queueMicrotask(() => {
      applyNotificationsSnapshot(cachedSnapshot, { persist: false });
    });
    return true;
  }, [applyNotificationsSnapshot, readCachedNotifications]);

  const loadNotifications = useCallback(
    async (setNotificationsError: (message: string) => void, options?: { silent?: boolean; onlyIfStale?: boolean }) => {
      if (!currentUserId) return;

      const cachedSnapshot = notificationsSnapshotRef.current ?? readCachedNotifications();
      if (options?.onlyIfStale && cachedSnapshot && !isNotificationsSnapshotStale(cachedSnapshot)) {
        return;
      }

      await runNotificationsLoad({
        onStart: () => {
          if (!options?.silent && !cachedSnapshot) {
            setNotificationsLoading(true);
          }
        },
        onSuccess: (snapshot: NotificationsCacheData) => {
          applyNotificationsSnapshot(snapshot);
          setNotificationsError("");
          setNotificationsLoading(false);
        },
        onError: (error) => {
          const message = mapUiErrorMessage(error instanceof Error ? error.message : "", "Не удалось загрузить уведомления");
          setNotificationsError(message);
          setNotificationsLoading(false);
        },
        request: (signal) => fetchNotificationsSnapshot(currentUserId, signal)
      });
    },
    [applyNotificationsSnapshot, currentUserId, readCachedNotifications, runNotificationsLoad]
  );

  return {
    applyNotificationsSnapshot,
    hasNotificationsData,
    loadNotifications,
    notifications,
    notificationsLoading,
    notificationsSnapshotRef,
    restoreCachedNotifications,
    unreadCount
  };
}
