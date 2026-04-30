"use client";

import { ChevronLeft, LogOut, Settings, BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { DashboardMobileActionsSheet, type DashboardMobileActionItem } from "@/app/(workspace)/dashboard-mobile-actions-sheet";
import type { WorkspaceNavConfig, WorkspaceNavItem } from "@/app/(workspace)/workspace-shell.types";
import { getWorkspaceBrandStyles } from "@/app/(workspace)/shell/workspace-brand";
import { getActiveWorkspaceNavItemId, isWorkspaceNavItemActive } from "@/app/(workspace)/workspace-navigation";
import type { UserRole } from "@/lib/auth/get-user-role";
import { cn } from "@/lib/utils";

function getSidebarItemClass(active: boolean, secondary = false, crmGlassMode = false) {
  return cn(
    "group flex items-center gap-3 rounded-2xl py-2.5 text-sm font-semibold transition-[background-color,color,box-shadow] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2",
    "justify-center px-2 xl:justify-start xl:px-3.5",
    crmGlassMode
      ? active
        ? "text-white"
        : secondary
          ? "text-white/55 hover:bg-white/10 hover:text-white"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      : active
        ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_100%)] text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.07)] ring-1 ring-white/90"
        : secondary
          ? "text-slate-500 hover:bg-white/70 hover:text-slate-800"
          : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
  );
}

function getSidebarTokenClass(active: boolean, secondary = false, crmGlassMode = false) {
  return cn(
    "flex h-[2.125rem] w-[2.125rem] shrink-0 items-center justify-center rounded-2xl transition-[background-color,color,opacity,box-shadow] duration-200",
    crmGlassMode
      ? cn(
          "text-white",
          active
            ? "bg-transparent text-white"
            : secondary
              ? "opacity-70 group-hover:bg-white/10 group-hover:opacity-100"
              : "opacity-80 group-hover:bg-white/10 group-hover:opacity-100"
        )
      : cn(
          "bg-slate-100 text-slate-600",
          active
            ? "bg-slate-200 text-slate-800 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65),0_8px_18px_rgba(15,23,42,0.08)]"
            : secondary
              ? "opacity-90 group-hover:opacity-100"
              : "group-hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]"
        )
  );
}

function formatBadgeCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

function NavBadge({ count, collapsed = false }: { count: number; collapsed?: boolean }) {
  if (count <= 0) return null;

  return (
    <span
      data-testid="workspace-nav-badge"
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold leading-5 text-white shadow-sm",
        collapsed && "absolute -right-1 -top-1 h-5 min-w-5 px-1"
      )}
      aria-label={`Непросмотренных заявок: ${count}`}
    >
      {formatBadgeCount(count)}
    </span>
  );
}

function renderSidebarNavItem({
  item,
  active,
  secondary,
  sidebarCollapsed,
  labelMotionClass,
  crmGlassMode
}: {
  item: WorkspaceNavItem;
  active: boolean;
  secondary: boolean;
  sidebarCollapsed: boolean;
  labelMotionClass: string;
  crmGlassMode: boolean;
}) {
  return (
    <Link key={item.id} href={item.href} className={getSidebarItemClass(active, secondary, crmGlassMode)}>
      <span className={cn(getSidebarTokenClass(active, secondary, crmGlassMode), "relative")}>
        <item.icon className="h-[1.125rem] w-[1.125rem] shrink-0" />
        {item.badgeCount && sidebarCollapsed ? <NavBadge count={item.badgeCount} collapsed /> : null}
      </span>
      <span
        className={cn(
          "min-w-0 overflow-hidden whitespace-nowrap",
          labelMotionClass,
          "hidden xl:flex xl:items-center xl:gap-2",
          sidebarCollapsed ? "xl:opacity-0 xl:-translate-x-1 xl:delay-0" : "xl:opacity-100 xl:translate-x-0 xl:delay-75"
        )}
      >
        <span>{item.label}</span>
        {item.badgeCount && !sidebarCollapsed ? <NavBadge count={item.badgeCount} /> : null}
      </span>
    </Link>
  );
}

type WorkspaceNavigationViewProps = {
  navConfig: WorkspaceNavConfig;
  sidebarCollapsed: boolean;
  labelMotionClass: string;
  sidebarTransitionClass: string;
  isLoggingOut: boolean;
  currentRole: UserRole | null;
  mobileMoreSheetOpen: boolean;
  mobileMoreSheetCloseRef: React.RefObject<HTMLButtonElement | null>;
  hasProfileData: boolean;
  avatarUrl: string | null;
  displayName: string;
  roleLabel: string;
  email: string;
  initials: string;
  mobileSheetNavItems: DashboardMobileActionItem[];
  crmGlassMode?: boolean;
  onToggleSidebar: () => void;
  onCloseMobileMoreSheet: () => void;
  onLogout: () => void;
};

export function WorkspaceNavigationView({
  navConfig,
  sidebarCollapsed,
  labelMotionClass,
  sidebarTransitionClass,
  isLoggingOut,
  currentRole,
  mobileMoreSheetOpen,
  mobileMoreSheetCloseRef,
  hasProfileData,
  avatarUrl,
  displayName,
  roleLabel,
  email,
  initials,
  mobileSheetNavItems,
  crmGlassMode = false,
  onToggleSidebar,
  onCloseMobileMoreSheet,
  onLogout
}: WorkspaceNavigationViewProps) {
  const pathname = usePathname();
  const brandStyles = getWorkspaceBrandStyles(currentRole);
  const activePrimaryItemId = getActiveWorkspaceNavItemId(pathname, navConfig.primary);

  return (
    <>
      <aside
        data-testid="dashboard-sidebar"
        data-collapsed={sidebarCollapsed ? "true" : "false"}
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r px-3 pb-4 pt-0 transform-gpu will-change-transform xl:flex",
          crmGlassMode
            ? "border-transparent bg-white/5 shadow-[0_10px_28px_rgba(15,23,42,0.1)] backdrop-blur-md"
            : "border-[#dfe3e6] bg-slate-50 shadow-[inset_-1px_0_0_rgba(255,255,255,0.55)]",
          sidebarTransitionClass,
          "w-[15.25rem]",
          sidebarCollapsed ? "xl:w-20" : "xl:w-[15.25rem]",
          "translate-x-0"
        )}
      >
        <nav className="flex flex-1 flex-col gap-1">
          <Link
            className={cn(
              "mb-0 flex h-16 min-h-16 items-center gap-3 rounded-xl px-2 py-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              brandStyles.focusRingClassName
            )}
            href="/"
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white",
                crmGlassMode ? "bg-transparent" : brandStyles.iconContainerClassName
              )}
            >
              <BookOpen className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div
              className={cn(
                "overflow-hidden whitespace-nowrap transition-[opacity,transform] duration-200",
                "hidden xl:block",
                sidebarCollapsed ? "xl:opacity-0 xl:-translate-x-1" : "xl:opacity-100 xl:translate-x-0"
              )}
            >
              <h1 className={cn("text-xl font-bold leading-none", crmGlassMode ? "text-white" : brandStyles.titleClassName)}>Флексенг</h1>
              <p className={cn("mt-1 text-[10px] uppercase tracking-wide", crmGlassMode ? "text-white/60" : "text-slate-500")}>Учебный портал</p>
            </div>
          </Link>
          <div className="mb-1 h-6" />

          {navConfig.primary.map((item) =>
            renderSidebarNavItem({
              item,
              active: activePrimaryItemId === item.id,
              secondary: item.id !== "dashboard" && navConfig.secondary.length > 0,
              sidebarCollapsed,
              labelMotionClass,
              crmGlassMode
            })
          )}

          <div aria-hidden="true" className="mt-4 h-2" />

          {navConfig.secondary.map((item) => {
            const active = isWorkspaceNavItemActive(pathname, item);
            return (
              <Link key={item.id} href={item.href} className={getSidebarItemClass(active, true, crmGlassMode)}>
                <span className={getSidebarTokenClass(active, true, crmGlassMode)}>
                  <item.icon className="h-[1.0625rem] w-[1.0625rem] shrink-0" />
                </span>
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap",
                    labelMotionClass,
                    "hidden xl:inline-block",
                    sidebarCollapsed ? "xl:opacity-0 xl:-translate-x-1 xl:delay-0" : "xl:opacity-100 xl:translate-x-0 xl:delay-75"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1 pt-6">
          <button
            data-testid="sidebar-toggle"
            type="button"
            onClick={onToggleSidebar}
            className={cn(
              "hidden items-center gap-3 rounded-2xl py-2.5 text-sm font-semibold transition-[background-color,color,box-shadow] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 xl:flex xl:justify-start xl:px-3.5",
              crmGlassMode ? "text-white/55 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
            )}
            aria-label={sidebarCollapsed ? "Развернуть боковое меню" : "Свернуть боковое меню"}
          >
            <span className={getSidebarTokenClass(false, true, crmGlassMode)}>
              <ChevronLeft
                className={cn(
                  "h-[1.125rem] w-[1.125rem] shrink-0 transform-gpu stroke-[2.25] transition-transform",
                  sidebarCollapsed ? "scale-x-[-1]" : "scale-x-100"
                )}
              />
            </span>
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap",
                labelMotionClass,
                "hidden xl:inline-block",
                sidebarCollapsed ? "xl:opacity-0 xl:-translate-x-1 xl:delay-0" : "xl:opacity-100 xl:translate-x-0 xl:delay-75"
              )}
            >
              {sidebarCollapsed ? "Развернуть" : "Свернуть"}
            </span>
          </button>

          {navConfig.showBottomProfileLink ? (
            <Link href="/settings/profile" className={getSidebarItemClass(pathname === "/settings/profile", true, crmGlassMode)}>
              <span className={getSidebarTokenClass(pathname === "/settings/profile", true, crmGlassMode)}>
                <Settings className="h-[1.0625rem] w-[1.0625rem] shrink-0" />
              </span>
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap",
                  labelMotionClass,
                  "hidden xl:inline-block",
                  sidebarCollapsed ? "xl:opacity-0 xl:-translate-x-1 xl:delay-0" : "xl:opacity-100 xl:translate-x-0 xl:delay-75"
                )}
              >
                Профиль
              </span>
            </Link>
          ) : null}

          <button
            data-testid="logout-button"
            className={cn(
              "group flex items-center gap-3 rounded-2xl py-2.5 text-sm font-semibold transition-[background-color,color,box-shadow] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 justify-center px-2 xl:justify-start xl:px-3.5",
              crmGlassMode ? "text-white/55 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
            )}
            onClick={onLogout}
            type="button"
            disabled={isLoggingOut}
          >
            <span
              className={cn(
                "flex h-[2.125rem] w-[2.125rem] shrink-0 items-center justify-center rounded-2xl transition-[background-color,color,box-shadow] duration-200",
                crmGlassMode
                  ? "bg-transparent text-white/70 group-hover:bg-white/10 group-hover:text-white"
                  : "bg-slate-100 text-slate-600 group-hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]"
              )}
            >
              <LogOut className="h-[1.125rem] w-[1.125rem] shrink-0" />
            </span>
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap",
                labelMotionClass,
                "hidden xl:inline-block",
                sidebarCollapsed ? "xl:opacity-0 xl:-translate-x-1 xl:delay-0" : "xl:opacity-100 xl:translate-x-0 xl:delay-75"
              )}
            >
              {isLoggingOut ? "Выход..." : "Выход"}
            </span>
          </button>

        </div>
      </aside>

      <DashboardMobileActionsSheet
        open={mobileMoreSheetOpen}
        pathname={pathname}
        hasProfileData={hasProfileData}
        avatarUrl={avatarUrl}
        displayName={displayName}
        roleLabel={roleLabel}
        email={email}
        initials={initials}
        items={mobileSheetNavItems}
        isLoggingOut={isLoggingOut}
        closeButtonRef={mobileMoreSheetCloseRef}
        onClose={onCloseMobileMoreSheet}
        onLogout={onLogout}
      />
    </>
  );
}
