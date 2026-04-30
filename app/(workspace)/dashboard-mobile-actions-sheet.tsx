"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, X } from "lucide-react";

import { isWorkspaceNavItemActive } from "@/app/(workspace)/workspace-navigation";
import type { WorkspaceNavItem } from "@/app/(workspace)/workspace-shell.types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";
import { cn } from "@/lib/utils";

const MOBILE_MENU_ANIMATION_MS = 200;
const SETTINGS_NAV_ITEM_IDS = new Set(["profile", "payments"]);

function formatBadgeCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

export type DashboardMobileActionItem =
  | ({ kind: "link" } & WorkspaceNavItem)
  | { id: string; label: string; icon: React.ComponentType<{ className?: string }>; kind: "button"; danger?: boolean };

type DashboardMobileActionsSheetProps = {
  open: boolean;
  pathname: string;
  hasProfileData: boolean;
  avatarUrl: string | null;
  displayName: string;
  roleLabel: string;
  email: string;
  initials: string;
  items: DashboardMobileActionItem[];
  isLoggingOut: boolean;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onLogout: () => void;
};

export function DashboardMobileActionsSheet({
  open,
  pathname,
  hasProfileData,
  avatarUrl,
  displayName,
  roleLabel,
  email,
  initials,
  items,
  isLoggingOut,
  closeButtonRef,
  onClose,
  onLogout
}: DashboardMobileActionsSheetProps) {
  const sheetRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [openSections, setOpenSections] = useState({ learning: true, settings: false });
  const closeTimeoutRef = useRef<number | null>(null);

  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) {
      const timeoutId = window.setTimeout(() => {
        setVisible(false);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const frameId = window.requestAnimationFrame(() => {
      setOpenSections({ learning: true, settings: false });
      setVisible(true);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const closeWithAnimation = useCallback(() => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    setVisible(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null;
      onClose();
    }, MOBILE_MENU_ANIMATION_MS);
  }, [onClose]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeWithAnimation();
      return;
    }

    if (event.key !== "Tab" || !sheetRef.current) return;

    const tabbableElements = Array.from(
      sheetRef.current.querySelectorAll<HTMLElement>(
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
  }, [closeWithAnimation]);

  if (!open) {
    return null;
  }

  const linkItems = items.filter((item): item is Extract<DashboardMobileActionItem, { kind: "link" }> => item.kind === "link");
  const learningItems = linkItems.filter((item) => !SETTINGS_NAV_ITEM_IDS.has(item.id));
  const settingsItems = linkItems.filter((item) => SETTINGS_NAV_ITEM_IDS.has(item.id));
  const logoutItem = items.find((item): item is Extract<DashboardMobileActionItem, { kind: "button" }> => item.kind === "button");

  const renderNavLink = (item: Extract<DashboardMobileActionItem, { kind: "link" }>) => (
    <Link
      key={item.id}
      href={item.href}
      onClick={closeWithAnimation}
      className={cn(
        "flex min-h-12 items-center rounded-2xl border px-4 py-3 text-sm font-semibold transition-[transform,background-color,border-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2",
        isWorkspaceNavItemActive(pathname, item)
          ? "border-indigo-200 bg-indigo-50 text-indigo-700"
          : "border-white/70 bg-white/80 text-slate-700 hover:border-slate-200 hover:bg-white focus-visible:border-indigo-200 focus-visible:bg-indigo-50"
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <item.icon className="h-5 w-5 shrink-0" />
        <span className="truncate">{item.label}</span>
      </span>
      {item.badgeCount && item.badgeCount > 0 ? (
        <span
          className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-rose-500 px-2 text-[11px] font-bold leading-6 text-white"
          aria-label={`Непросмотренных заявок: ${item.badgeCount}`}
        >
          {formatBadgeCount(item.badgeCount)}
        </span>
      ) : null}
    </Link>
  );

  const renderSection = (
    sectionId: "learning" | "settings",
    label: string,
    sectionItems: Array<Extract<DashboardMobileActionItem, { kind: "link" }>>
  ) => {
    if (sectionItems.length === 0) return null;

    const expanded = openSections[sectionId];
    const contentId = `dashboard-mobile-menu-section-${sectionId}`;

    return (
      <div className="space-y-2">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500 transition-[background-color,color,box-shadow] hover:bg-white/80 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
          onClick={() => setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }))}
          aria-expanded={expanded}
          aria-controls={contentId}
        >
          {label}
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expanded ? "rotate-180" : "rotate-0")} aria-hidden="true" />
        </button>
        {expanded ? (
          <div id={contentId} className="ml-3 space-y-2 pl-2">
            {sectionItems.map(renderNavLink)}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <button
        type="button"
        data-testid="dashboard-mobile-menu-backdrop"
        aria-label="Закрыть дополнительное меню"
        onClick={closeWithAnimation}
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] transition-opacity duration-200 ease-out motion-reduce:duration-75 xl:hidden",
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        ref={sheetRef}
        id="mobile-more-sheet"
        data-state={visible ? "open" : "closed"}
        className={cn(
          "fixed inset-x-0 top-0 z-50 mx-auto flex max-h-[calc(100dvh-0.75rem)] max-w-3xl origin-top flex-col overflow-hidden rounded-b-[1.5rem] border-b border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.98)_100%)] px-4 pb-4 pt-4 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl xl:hidden",
          "motion-safe:transition-[opacity,transform,clip-path] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:duration-75",
          visible
            ? "translate-y-0 opacity-100 [clip-path:inset(0_0_0_0_round_0_0_1.5rem_1.5rem)]"
            : "pointer-events-none -translate-y-2 opacity-0 [clip-path:inset(0_0_100%_0_round_0_0_1.5rem_1.5rem)]"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Дополнительное меню"
        onKeyDown={handleKeyDown}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {!hasProfileData ? (
              <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200" />
            ) : (
              <Avatar className="h-12 w-12 border border-white/80 shadow-sm">
                <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                <AvatarFallback className={cn("p-0 text-sm font-bold", avatarUrl ? "bg-slate-100 text-transparent" : "")}>
                  {avatarUrl ? "" : initials}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{displayName || "Пользователь"}</p>
              <p className="truncate text-xs text-slate-500">{roleLabel}</p>
              <p className="truncate text-xs text-slate-400">{email}</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeWithAnimation}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-[color,background-color,border-color,box-shadow] hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            aria-label="Закрыть дополнительное меню"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto overscroll-contain pb-1">
          <nav className="space-y-2" aria-label="Дополнительные действия">
            {renderSection("learning", "Обучение", learningItems)}
            {renderSection("settings", "Настройки", settingsItems)}
            {logoutItem ? (
              <button
                key={logoutItem.id}
                type="button"
                onClick={onLogout}
                disabled={isLoggingOut}
                className={cn(
                  "flex min-h-12 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-[transform,background-color,border-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2",
                  logoutItem.danger
                    ? "border-red-100 bg-red-50/80 text-red-700 hover:bg-red-50 focus-visible:border-red-200 focus-visible:bg-red-50"
                    : "border-white/70 bg-white/80 text-slate-700 hover:border-slate-200 hover:bg-white focus-visible:border-indigo-200 focus-visible:bg-indigo-50",
                  isLoggingOut ? "cursor-not-allowed opacity-60" : ""
                )}
              >
                <logoutItem.icon className="h-5 w-5 shrink-0" />
                {logoutItem.label}
              </button>
            ) : null}
          </nav>
        </div>
      </aside>
    </>
  );
}
