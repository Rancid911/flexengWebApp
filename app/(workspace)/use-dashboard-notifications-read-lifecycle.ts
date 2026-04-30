"use client";

import { useEffect, useRef } from "react";

type UseDashboardNotificationsReadLifecycleArgs = {
  currentUserId: string | null;
  notificationsOpen: boolean;
  pathname: string;
  refreshNotifications: (setNotificationsError: (message: string) => void, options?: { silent?: boolean; onlyIfStale?: boolean }) => Promise<void>;
  restoreCachedNotifications: () => boolean;
};

export function useDashboardNotificationsReadLifecycle({
  currentUserId,
  notificationsOpen,
  pathname,
  refreshNotifications,
  restoreCachedNotifications
}: UseDashboardNotificationsReadLifecycleArgs) {
  void pathname;
  const previousOpenRef = useRef(notificationsOpen);

  useEffect(() => {
    previousOpenRef.current = false;
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    const drawerJustOpened = notificationsOpen && !previousOpenRef.current;

    if (drawerJustOpened) {
      const hadCachedSnapshot = restoreCachedNotifications();
      void refreshNotifications(() => {}, { silent: hadCachedSnapshot, onlyIfStale: hadCachedSnapshot });
    }

    previousOpenRef.current = notificationsOpen;
  }, [currentUserId, notificationsOpen, refreshNotifications, restoreCachedNotifications]);
}
