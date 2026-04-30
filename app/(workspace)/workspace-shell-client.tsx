"use client";

import { LogOut, Menu } from "lucide-react";
import { startTransition, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { WorkspaceFrame } from "@/app/(workspace)/shell/workspace-frame";
import { WorkspaceNavigationView } from "@/app/(workspace)/shell/workspace-navigation-view";
import { WorkspaceUtilities } from "@/app/(workspace)/shell/workspace-utilities";
import type { DashboardMobileActionItem } from "@/app/(workspace)/dashboard-mobile-actions-sheet";
import {
  useDashboardLogout,
  useDashboardProfileState,
  useDashboardShellOverlays,
  useDashboardSidebarState,
  type WorkspaceLayoutProfile
} from "@/app/(workspace)/use-dashboard-shell-state";
import { getWorkspaceNavConfig } from "@/app/(workspace)/workspace-navigation";
import type { WorkspaceNavItem, WorkspaceShellVariant, WorkspaceUtilitySlots } from "@/app/(workspace)/workspace-shell.types";
import { cn } from "@/lib/utils";

const CRM_UNREAD_SUMMARY_EVENT = "crm:unread-summary-change";
export const CRM_BACKGROUND_IMAGE_EVENT = "crm:background-image-change";
const CRM_UNREAD_SUMMARY_POLL_INTERVAL_MS = 60_000;

async function fetchCrmUnreadSummary() {
  const response = await fetch("/api/crm/unread-summary", { cache: "no-store" });
  if (!response.ok) return 0;
  const payload = (await response.json()) as { unreadCount?: number };
  return typeof payload.unreadCount === "number" ? payload.unreadCount : 0;
}

function clearNavItemBadge<T extends WorkspaceNavItem>(item: T): T {
  if (!("badgeCount" in item)) return item;
  const nextItem = { ...item };
  delete nextItem.badgeCount;
  return nextItem;
}

function applyCrmUnreadBadge<T extends WorkspaceNavItem>(items: T[], unreadCount: number): T[] {
  return items.map((item) => {
    if (item.id === "crm" && unreadCount > 0) {
      return { ...item, badgeCount: unreadCount };
    }

    return clearNavItemBadge(item);
  });
}

export type WorkspaceShellClientProps = {
  initialSidebarCollapsed: boolean | null;
  initialProfile: WorkspaceLayoutProfile;
  shellVariant: WorkspaceShellVariant;
  utilitySlots?: WorkspaceUtilitySlots;
  crmBackgroundImageUrl?: string | null;
  children: React.ReactNode;
};

export function WorkspaceShellClient({
  initialSidebarCollapsed,
  initialProfile,
  shellVariant,
  utilitySlots,
  crmBackgroundImageUrl,
  children
}: WorkspaceShellClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarCollapsed, sidebarTransitionsEnabled, toggleSidebar } = useDashboardSidebarState(initialSidebarCollapsed);
  const {
    mobileMoreSheetOpen,
    mobileMoreSheetCloseRef,
    mobileMoreSheetTriggerRef,
    closeMobileMoreSheet,
    openMobileMoreSheet
  } = useDashboardShellOverlays();
  const { currentUserId, email, displayName, avatarUrl, currentRole, hasProfileData } = useDashboardProfileState(initialProfile);
  const { isLoggingOut, handleLogout } = useDashboardLogout(currentUserId, router);
  const [crmUnreadCount, setCrmUnreadCount] = useState(0);
  const [crmBackgroundImageOverride, setCrmBackgroundImageOverride] = useState<string | null | undefined>(undefined);
  const canShowCrmBadge = currentRole === "admin" || currentRole === "manager";
  const activeCrmBackgroundImageUrl = crmBackgroundImageOverride === undefined ? crmBackgroundImageUrl ?? null : crmBackgroundImageOverride;
  const crmGlassMode = pathname === "/crm" && Boolean(activeCrmBackgroundImageUrl);

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || email[0]?.toUpperCase() || "U";

  const navConfig = useMemo(() => {
    const config = getWorkspaceNavConfig(shellVariant, currentRole);
    if (!canShowCrmBadge) return config;

    return {
      ...config,
      primary: applyCrmUnreadBadge(config.primary, crmUnreadCount),
      secondary: applyCrmUnreadBadge(config.secondary, crmUnreadCount),
      mobileMore: applyCrmUnreadBadge(config.mobileMore, crmUnreadCount)
    };
  }, [canShowCrmBadge, crmUnreadCount, currentRole, shellVariant]);
  const labelMotionClass = sidebarCollapsed
    ? "transition-[opacity,transform] duration-220 ease-[cubic-bezier(0.4,0,1,1)]"
    : "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";
  const shellExpandEasingClass = "ease-[cubic-bezier(0.22,1,0.36,1)]";
  const shellCollapseEasingClass = "ease-[cubic-bezier(0.4,0,1,1)]";
  const shellEasingClass = sidebarCollapsed ? shellCollapseEasingClass : shellExpandEasingClass;
  const sidebarTransitionClass = sidebarTransitionsEnabled ? `transition-[width,transform] duration-300 ${shellEasingClass}` : "transition-none";
  const roleLabel =
    currentRole === "admin" ? "администратор" : currentRole === "manager" ? "менеджер" : currentRole === "teacher" ? "преподаватель" : "студент";

  useEffect(() => {
    if (!canShowCrmBadge) {
      return;
    }

    let cancelled = false;

    const updateUnreadSummary = () => {
      void fetchCrmUnreadSummary()
        .then((count) => {
          if (!cancelled) {
            startTransition(() => setCrmUnreadCount(count));
          }
        })
        .catch(() => {
          // CRM badge is non-critical; the CRM page still loads normally.
        });
    };

    updateUnreadSummary();
    const intervalId = window.setInterval(updateUnreadSummary, CRM_UNREAD_SUMMARY_POLL_INTERVAL_MS);

    const handleSummaryChange = (event: Event) => {
      const detail = event instanceof CustomEvent ? event.detail : null;
      if (detail && typeof detail.unreadCount === "number") {
        startTransition(() => setCrmUnreadCount(detail.unreadCount));
        return;
      }
      updateUnreadSummary();
    };

    window.addEventListener(CRM_UNREAD_SUMMARY_EVENT, handleSummaryChange);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener(CRM_UNREAD_SUMMARY_EVENT, handleSummaryChange);
    };
  }, [canShowCrmBadge]);

  useEffect(() => {
    const handleCrmBackgroundChange = (event: Event) => {
      const detail = event instanceof CustomEvent ? event.detail : null;
      const nextUrl = typeof detail?.backgroundImageUrl === "string" && detail.backgroundImageUrl.trim() ? detail.backgroundImageUrl : null;
      startTransition(() => setCrmBackgroundImageOverride(nextUrl));
    };

    window.addEventListener(CRM_BACKGROUND_IMAGE_EVENT, handleCrmBackgroundChange);
    return () => window.removeEventListener(CRM_BACKGROUND_IMAGE_EVENT, handleCrmBackgroundChange);
  }, []);

  const mobileSheetNavItems = useMemo(() => {
    const uniqueLinkItems = new Map<string, (typeof navConfig.primary)[number]>();
    for (const item of [...navConfig.primary, ...navConfig.mobileMore]) {
      uniqueLinkItems.set(item.href, item);
    }

    const items: DashboardMobileActionItem[] = Array.from(uniqueLinkItems.values()).map((item) => ({
      ...item,
      kind: "link" as const
    }));

    items.push({
      id: "logout",
      label: isLoggingOut ? "Выход..." : "Выход",
      icon: LogOut,
      kind: "button" as const,
      danger: true
    });

    return items;
  }, [isLoggingOut, navConfig]);

  return (
    <>
      <WorkspaceFrame
        sidebarCollapsed={sidebarCollapsed}
        sidebarTransitionsEnabled={sidebarTransitionsEnabled}
        displayName={displayName}
        roleLabel={roleLabel}
        avatarUrl={avatarUrl}
        initials={initials}
        hasProfileData={hasProfileData}
        crmGlassMode={crmGlassMode}
        crmBackgroundImageUrl={crmGlassMode ? activeCrmBackgroundImageUrl : null}
        navigation={
          <WorkspaceNavigationView
            navConfig={navConfig}
            sidebarCollapsed={sidebarCollapsed}
            labelMotionClass={labelMotionClass}
            sidebarTransitionClass={sidebarTransitionClass}
            isLoggingOut={isLoggingOut}
            currentRole={currentRole}
            mobileMoreSheetOpen={mobileMoreSheetOpen}
            mobileMoreSheetCloseRef={mobileMoreSheetCloseRef}
            hasProfileData={hasProfileData}
            avatarUrl={avatarUrl}
            displayName={displayName}
            roleLabel={roleLabel}
            email={email}
            initials={initials}
            mobileSheetNavItems={mobileSheetNavItems}
            crmGlassMode={crmGlassMode}
            onToggleSidebar={toggleSidebar}
            onCloseMobileMoreSheet={() => closeMobileMoreSheet()}
            onLogout={handleLogout}
          />
        }
        utilities={
          <WorkspaceUtilities
            currentUserId={currentUserId}
            utilitySlots={utilitySlots}
            crmGlassMode={crmGlassMode}
          />
        }
        mobileNavigationTrigger={
          <button
            ref={mobileMoreSheetTriggerRef}
            type="button"
            data-testid="dashboard-mobile-menu-trigger"
            onClick={openMobileMoreSheet}
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-[background-color,border-color,color,box-shadow] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 xl:hidden",
              crmGlassMode
                ? "border-white/25 bg-white/14 text-white hover:border-white/40 hover:bg-white/20 focus-visible:ring-offset-transparent"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            )}
            aria-label={mobileMoreSheetOpen ? "Закрыть мобильное меню" : "Открыть мобильное меню"}
            aria-haspopup="dialog"
            aria-expanded={mobileMoreSheetOpen}
            aria-controls="mobile-more-sheet"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        }
      >
        {children}
      </WorkspaceFrame>
    </>
  );
}

export default WorkspaceShellClient;
