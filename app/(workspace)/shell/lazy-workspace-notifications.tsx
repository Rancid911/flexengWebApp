"use client";

import dynamic from "next/dynamic";
import { Bell } from "lucide-react";
import { startTransition, useEffect, useRef, useState } from "react";

import { fetchNotificationsUnreadSummary, readNotificationsUnreadSummary } from "@/app/(workspace)/dashboard-notifications.api";
import { cn } from "@/lib/utils";

const NotificationsPanel = dynamic(
  () => import("@/app/(workspace)/shell/workspace-notifications-panel").then((module) => module.WorkspaceNotificationsPanel),
  { ssr: false }
);

type LazyWorkspaceNotificationsProps = {
  currentUserId: string | null;
  pathname: string;
  crmGlassMode?: boolean;
};

export function LazyWorkspaceNotifications({ currentUserId, pathname, crmGlassMode = false }: LazyWorkspaceNotificationsProps) {
  const [activated, setActivated] = useState(false);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => readNotificationsUnreadSummary(currentUserId)?.unreadCount ?? 0);
  const [summaryLoaded, setSummaryLoaded] = useState(() => Boolean(readNotificationsUnreadSummary(currentUserId)));
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const bellButtonClass = cn(
    "relative rounded-full p-2 transition-[background-color,color,box-shadow]",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2",
    crmGlassMode ? "text-white hover:bg-white/14 focus-visible:ring-offset-transparent" : "text-slate-500 hover:bg-indigo-50"
  );
  const handleUnreadCountChange = (count: number) => {
    startTransition(() => {
      setUnreadCount(count);
      setSummaryLoaded(true);
    });
  };

  useEffect(() => {
    const cachedSummary = readNotificationsUnreadSummary(currentUserId);
    startTransition(() => {
      setUnreadCount(cachedSummary?.unreadCount ?? 0);
      setSummaryLoaded(Boolean(cachedSummary));
    });
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId || summaryLoaded) return;

    const abortController = new AbortController();
    let cancelled = false;
    let idleId: number | null = null;
    let timeoutId: number | null = null;

    const loadUnreadSummary = () => {
      void fetchNotificationsUnreadSummary(currentUserId, abortController.signal)
        .then((summary) => {
          if (cancelled) return;
          startTransition(() => {
            setUnreadCount(summary.unreadCount);
            setSummaryLoaded(true);
          });
        })
        .catch(() => {
          // Badge preloading is a non-blocking enhancement; drawer loading still reports errors on click.
        });
    };

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(loadUnreadSummary, { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(loadUnreadSummary, 1200);
    }

    return () => {
      cancelled = true;
      abortController.abort();
      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [currentUserId, summaryLoaded]);

  return (
    <>
      <button
        ref={triggerRef}
        data-testid="notifications-bell"
        type="button"
        onClick={() => {
          setActivated(true);
          setOpen((current) => !current || !activated);
        }}
        className={bellButtonClass}
        aria-label="Открыть уведомления"
      >
        <Bell className="h-5 w-5" />
        {summaryLoaded && unreadCount > 0 ? (
          <span
            data-testid="notifications-unread-dot"
            className={cn("absolute right-[0.4rem] top-[0.4rem] h-1.5 w-1.5 rounded-full bg-rose-500", crmGlassMode ? "" : "ring-1 ring-[#f5f7f9]")}
            aria-hidden="true"
          />
        ) : null}
      </button>

      {activated ? (
        <NotificationsPanel
          currentUserId={currentUserId}
          pathname={pathname}
          open={open}
          triggerRef={triggerRef}
          onOpenChange={setOpen}
          onUnreadCountChange={handleUnreadCountChange}
        />
      ) : null}
    </>
  );
}
