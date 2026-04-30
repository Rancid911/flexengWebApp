"use client";

import { useCallback, useState } from "react";

import { formatDashboardNotificationDate } from "@/app/(workspace)/dashboard-notifications.api";
import { getCurrentNotificationsSnapshot } from "@/app/(workspace)/dashboard-notifications.snapshot";
import { useDashboardNotificationMutations } from "@/app/(workspace)/use-dashboard-notification-mutations";
import { useDashboardNotificationsReadLifecycle } from "@/app/(workspace)/use-dashboard-notifications-read-lifecycle";
import { useDashboardNotificationsQuery } from "@/app/(workspace)/use-dashboard-notifications-query";

export function useDashboardNotifications({
  currentUserId,
  notificationsOpen,
  pathname
}: {
  currentUserId: string | null;
  notificationsOpen: boolean;
  pathname: string;
}) {
  const [notificationsError, setNotificationsError] = useState("");
  const {
    applyNotificationsSnapshot,
    hasNotificationsData,
    loadNotifications,
    notifications,
    notificationsLoading,
    notificationsSnapshotRef,
    restoreCachedNotifications,
    unreadCount
  } = useDashboardNotificationsQuery({
    currentUserId
  });
  useDashboardNotificationsReadLifecycle({
    currentUserId,
    notificationsOpen,
    pathname,
    refreshNotifications: loadNotifications,
    restoreCachedNotifications
  });
  const getCurrentSnapshot = useCallback(
    () =>
      getCurrentNotificationsSnapshot({
        notifications,
        notificationsSnapshot: notificationsSnapshotRef.current,
        unreadCount
      }),
    [notifications, notificationsSnapshotRef, unreadCount]
  );
  const { dismissNotification, dismissingIds } = useDashboardNotificationMutations({
    applyNotificationsSnapshot,
    getCurrentSnapshot,
    loadNotifications,
    setNotificationsError
  });
  const handleLoadNotifications = useCallback(
    (options?: { silent?: boolean; onlyIfStale?: boolean }) => loadNotifications(setNotificationsError, options),
    [loadNotifications]
  );
  const formatNotificationDate = useCallback((value: string | null) => formatDashboardNotificationDate(value), []);

  return {
    dismissNotification,
    dismissingIds,
    formatNotificationDate,
    hasNotificationsData,
    loadNotifications: handleLoadNotifications,
    notifications,
    notificationsError,
    notificationsLoading,
    unreadCount
  };
}
