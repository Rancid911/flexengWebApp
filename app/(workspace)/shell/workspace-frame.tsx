"use client";

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type WorkspaceFrameProps = {
  sidebarCollapsed: boolean;
  sidebarTransitionsEnabled: boolean;
  displayName: string;
  roleLabel: string;
  avatarUrl: string | null;
  initials: string;
  hasProfileData: boolean;
  crmGlassMode?: boolean;
  crmBackgroundImageUrl?: string | null;
  children: React.ReactNode;
  navigation: React.ReactNode;
  mobileNavigationTrigger: React.ReactNode;
  utilities: React.ReactNode;
};

export function WorkspaceFrame({
  sidebarCollapsed,
  sidebarTransitionsEnabled,
  displayName,
  roleLabel,
  avatarUrl,
  initials,
  hasProfileData,
  crmGlassMode = false,
  crmBackgroundImageUrl = null,
  children,
  navigation,
  mobileNavigationTrigger,
  utilities
}: WorkspaceFrameProps) {
  const shellExpandEasingClass = "ease-[cubic-bezier(0.22,1,0.36,1)]";
  const shellCollapseEasingClass = "ease-[cubic-bezier(0.4,0,1,1)]";
  const shellEasingClass = sidebarCollapsed ? shellCollapseEasingClass : shellExpandEasingClass;
  const shellOffsetTransitionClass = sidebarTransitionsEnabled ? `transition-[left,margin-left] duration-300 ${shellEasingClass}` : "transition-none";

  const shellThemeVars = {
    "--background": "210 20% 97%",
    "--foreground": "222 26% 20%",
    "--card": "0 0% 100%",
    "--card-foreground": "222 26% 20%",
    "--popover": "0 0% 100%",
    "--popover-foreground": "222 26% 20%",
    "--primary": "247 63% 55%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "210 20% 94%",
    "--secondary-foreground": "222 26% 20%",
    "--muted": "210 16% 90%",
    "--muted-foreground": "220 8% 45%",
    "--accent": "210 14% 92%",
    "--accent-foreground": "222 26% 20%",
    "--border": "210 14% 86%",
    "--input": "210 14% 86%",
    "--ring": "247 63% 55%",
    "--sidebar": "210 20% 96%",
    "--sidebar-foreground": "222 26% 20%",
    "--sidebar-border": "210 14% 86%",
    "--sidebar-accent": "210 14% 92%"
  } as React.CSSProperties;

  return (
    <main
      data-testid="workspace-shell-root"
      className={cn("min-h-screen text-foreground", crmGlassMode && crmBackgroundImageUrl ? "bg-transparent" : "bg-[#f5f7f9]")}
      style={{
        ...shellThemeVars,
        ...(crmGlassMode && crmBackgroundImageUrl
          ? {
              backgroundImage: `url("${crmBackgroundImageUrl}")`,
              backgroundPosition: "center",
              backgroundSize: "cover",
              backgroundAttachment: "fixed"
            }
          : {})
      }}
    >
      {navigation}

      <header
        className={cn(
          "fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b px-4 md:px-6",
          crmGlassMode
            ? "border-transparent bg-white/10 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md"
            : "border-[#dfe3e6] bg-[#f5f7f9] shadow-none",
          "will-change-[left]",
          shellOffsetTransitionClass,
          "left-0",
          sidebarCollapsed ? "xl:left-20" : "xl:left-[15.25rem]"
        )}
      >
        <div data-testid="dashboard-header-left-actions" className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          {utilities}
        </div>

        <div data-testid="dashboard-header-right-actions" className="ml-4 flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden text-right sm:block">
            <p className={cn("text-sm font-semibold leading-tight", crmGlassMode ? "text-white" : "text-slate-800")}>{displayName || "Пользователь"}</p>
            <p className={cn("text-[10px] uppercase tracking-wider", crmGlassMode ? "text-white/70" : "text-slate-500")}>{roleLabel}</p>
          </div>
          {!hasProfileData ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
          ) : (
            <Link
              href="/settings/profile"
              aria-label="Перейти в профиль"
              title="Профиль"
              className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
            >
              <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                <AvatarFallback className={cn("p-0 text-sm font-bold", avatarUrl ? "bg-slate-100 text-transparent" : "")}>
                  {avatarUrl ? "" : initials}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
          {mobileNavigationTrigger}
        </div>
      </header>

      <section
        className={cn(
          "min-h-screen px-4 pb-6 pt-20 md:px-6 xl:pb-8",
          "will-change-[margin-left]",
          shellOffsetTransitionClass,
          "ml-0",
          sidebarCollapsed ? "xl:ml-20" : "xl:ml-[15.25rem]"
        )}
      >
        <div className="mx-0 w-full max-w-none">{children}</div>
      </section>
    </main>
  );
}
