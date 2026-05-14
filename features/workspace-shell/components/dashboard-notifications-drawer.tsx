"use client";

import { useCallback, useRef } from "react";
import { BellOff, ClipboardList, Newspaper, Sparkles, Wrench, X } from "lucide-react";

import type { UserNotificationDto } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

type DashboardNotificationsDrawerProps = {
  open: boolean;
  loading: boolean;
  hasNotificationsData: boolean;
  error: string;
  notifications: UserNotificationDto[];
  unreadCount: number;
  dismissingIds: Record<string, boolean>;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onRetry: () => void;
  onDismiss: (notification: UserNotificationDto) => void;
  formatNotificationDate: (value: string | null) => string;
};

const notificationTypeMeta: Record<
  UserNotificationDto["type"],
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    chipClass: string;
    unreadAccentClass: string;
    dotClass: string;
  }
> = {
  maintenance: {
    label: "Техработы",
    icon: Wrench,
    chipClass: "bg-amber-100 text-amber-700",
    unreadAccentClass: "bg-amber-50/70 border-amber-300",
    dotClass: "bg-amber-500"
  },
  update: {
    label: "Обновления",
    icon: Sparkles,
    chipClass: "bg-indigo-100 text-indigo-700",
    unreadAccentClass: "bg-indigo-50/70 border-indigo-300",
    dotClass: "bg-indigo-500"
  },
  news: {
    label: "Новости",
    icon: Newspaper,
    chipClass: "bg-sky-100 text-sky-700",
    unreadAccentClass: "bg-sky-50/70 border-sky-300",
    dotClass: "bg-sky-500"
  },
  assignments: {
    label: "Задания",
    icon: ClipboardList,
    chipClass: "bg-emerald-100 text-emerald-700",
    unreadAccentClass: "bg-emerald-50/70 border-emerald-300",
    dotClass: "bg-emerald-500"
  }
};

export function DashboardNotificationsDrawer({
  open,
  loading,
  hasNotificationsData,
  error,
  notifications,
  unreadCount,
  dismissingIds,
  closeButtonRef,
  onClose,
  onRetry,
  onDismiss,
  formatNotificationDate
}: DashboardNotificationsDrawerProps) {
  const drawerRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab" || !drawerRef.current) return;

    const tabbableElements = Array.from(
      drawerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");

    if (tabbableElements.length === 0) return;

    const firstElement = tabbableElements[0];
    const lastElement = tabbableElements[tabbableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement | null;

    if (tabbableElements.length === 1) {
      event.preventDefault();
      firstElement.focus();
      return;
    }

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }, []);

  if (!open) {
    return null;
  }

  return (
    <>
      <button
        data-testid="notifications-backdrop"
        type="button"
        aria-label="Закрыть уведомления"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/25 xl:hidden"
      />

      <aside
        ref={drawerRef}
        data-testid="notifications-drawer"
        className="fixed right-0 top-0 z-50 h-dvh w-full max-w-md border-l border-border bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.18)] transition-[transform,opacity] duration-200 ease-out"
        role="dialog"
        aria-modal="true"
        aria-label="Уведомления"
        onKeyDown={handleKeyDown}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div>
            <p className="text-base font-semibold text-slate-900">Уведомления</p>
            <p className="text-xs text-slate-500">Непрочитано: {unreadCount}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            aria-label="Закрыть уведомления"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain px-4 py-4">
          {loading && !hasNotificationsData ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`notifications-drawer-skeleton-${index}`} className="animate-pulse rounded-xl border border-slate-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="h-5 w-24 rounded-full bg-slate-200" />
                    <div className="h-3 w-16 rounded bg-slate-200" />
                  </div>
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-full rounded bg-slate-200" />
                  <div className="mt-1 h-3 w-2/3 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : null}

          {error ? (
            <div role="alert" aria-live="assertive" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              <p>{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 inline-flex rounded-md bg-white px-2 py-1 text-xs font-medium text-red-700 shadow-sm transition-colors hover:bg-red-100"
              >
                Повторить
              </button>
            </div>
          ) : null}

          {!loading && hasNotificationsData && notifications.length === 0 && !error ? (
            <div className="rounded-lg border border-border bg-slate-50 px-3 py-5 text-center text-slate-500">
              <BellOff className="mx-auto h-5 w-5 text-slate-400" />
              <p className="mt-2 text-sm font-medium">Новых уведомлений нет</p>
              <p className="mt-1 text-xs text-slate-400">Когда появятся новые сообщения, они отобразятся здесь.</p>
            </div>
          ) : null}

          <div className="space-y-3">
            {notifications.map((item) => {
              const meta = notificationTypeMeta[item.type];
              const Icon = meta.icon;
              const isProcessing = Boolean(dismissingIds[item.id]);

              return (
                <article
                  key={item.id}
                  className={cn(
                    "group rounded-xl border p-3 shadow-sm transition-[background-color,border-color,box-shadow]",
                    item.is_read ? "border-border bg-white hover:border-slate-300 hover:shadow-md" : cn("border-l-4", meta.unreadAccentClass, "hover:shadow-md")
                  )}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {!item.is_read ? <span className={cn("h-2 w-2 rounded-full", meta.dotClass)} /> : null}
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", meta.chipClass)}>
                        <Icon className="h-3.5 w-3.5" />
                        {meta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">{formatNotificationDate(item.published_at || item.created_at)}</span>
                      <button
                        data-testid={`notification-dismiss-${item.id}`}
                        type="button"
                        onClick={() => onDismiss(item)}
                        disabled={isProcessing}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-[background-color,color,box-shadow] hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Убрать уведомление: ${item.title}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p
                      className="mt-1 text-sm text-slate-600"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}
                    >
                      {item.body}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
