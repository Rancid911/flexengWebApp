"use client";

import { useEffect, useRef } from "react";

import { DashboardNotificationsDrawer } from "@/app/(workspace)/dashboard-notifications-drawer";
import { useDashboardNotifications } from "@/app/(workspace)/use-dashboard-notifications-state";

type WorkspaceNotificationsPanelProps = {
  currentUserId: string | null;
  pathname: string;
  open: boolean;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onOpenChange: (open: boolean) => void;
  onUnreadCountChange?: (count: number) => void;
};

export function WorkspaceNotificationsPanel({
  currentUserId,
  pathname,
  open,
  triggerRef,
  onOpenChange,
  onUnreadCountChange
}: WorkspaceNotificationsPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousPathnameRef = useRef(pathname);
  const previousOpenRef = useRef(open);
  const {
    notificationsLoading,
    notifications,
    notificationsError,
    hasNotificationsData,
    unreadCount,
    dismissingIds,
    dismissNotification,
    loadNotifications,
    formatNotificationDate
  } = useDashboardNotifications({ currentUserId, notificationsOpen: open, pathname });

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [onUnreadCountChange, unreadCount]);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      onOpenChange(false);
    }
    previousPathnameRef.current = pathname;
  }, [onOpenChange, pathname]);

  useEffect(() => {
    if (previousOpenRef.current && !open) {
      window.requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
    previousOpenRef.current = open;
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onOpenChange, open]);

  return (
    <DashboardNotificationsDrawer
      open={open}
      loading={notificationsLoading}
      hasNotificationsData={hasNotificationsData}
      error={notificationsError}
      notifications={notifications}
      unreadCount={unreadCount}
      dismissingIds={dismissingIds}
      closeButtonRef={closeButtonRef}
      onClose={() => onOpenChange(false)}
      onRetry={() => void loadNotifications()}
      onDismiss={(notification) => void dismissNotification(notification)}
      formatNotificationDate={formatNotificationDate}
    />
  );
}
