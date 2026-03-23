"use client";

import {
  LayoutDashboard,
  GraduationCap,
  ClipboardCheck,
  Layers,
  ClipboardList,
  ShieldCheck,
  Settings,
  LogOut,
  Search,
  Bell,
  ChevronLeft,
  Menu,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { clearDashboardCache, homeCacheKey, profileCacheKey, writeDashboardCache, type ProfileCacheData } from "@/lib/dashboard-cache";
import type { UserRole } from "@/lib/auth/get-user-role";
import { runAuthRequestWithLockRetry } from "@/lib/supabase/auth-request";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type LayoutProfileCache = {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole | null;
};

type DashboardShellClientProps = {
  initialProfile: LayoutProfileCache;
  children: React.ReactNode;
};

const STORAGE_KEY = "flexengSidebarCollapsed";

const baseNavItems: NavItem[] = [
  { id: "dashboard", label: "Рабочий стол", href: "/dashboard", icon: LayoutDashboard },
  { id: "learning", label: "Мои курсы", href: "/learning", icon: GraduationCap },
  { id: "tests", label: "Тесты", href: "/tests", icon: ClipboardCheck },
  { id: "flashcards", label: "Карточки", href: "/flashcards", icon: Layers },
  { id: "assignments", label: "Домашние задания", href: "/assignments", icon: ClipboardList }
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardShellClient({ initialProfile, children }: DashboardShellClientProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [email, setEmail] = useState(initialProfile.email);
  const [displayName, setDisplayName] = useState(initialProfile.displayName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialProfile.avatarUrl);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(initialProfile.role);
  const [hasProfileData, setHasProfileData] = useState(true);
  const [currentUserId] = useState<string | null>(initialProfile.userId);
  const [sidebarState, setSidebarState] = useState({ collapsed: false, ready: false });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const sidebarCollapsed = sidebarState.collapsed;
  const sidebarReady = sidebarState.ready;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    setSidebarState({ collapsed: saved === "1", ready: true });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sidebarReady) return;
    window.localStorage.setItem(STORAGE_KEY, sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed, sidebarReady]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    writeDashboardCache(profileCacheKey(initialProfile.userId), {
      displayName: initialProfile.displayName,
      email: initialProfile.email,
      avatarUrl: initialProfile.avatarUrl,
      role: initialProfile.role
    });
  }, [initialProfile]);

  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<ProfileCacheData>).detail;
      if (!detail) return;
      setDisplayName(detail.displayName);
      setEmail(detail.email);
      setAvatarUrl(detail.avatarUrl);
      if (detail.role === "admin" || detail.role === "manager" || detail.role === "teacher" || detail.role === "student") {
        setCurrentRole(detail.role);
      }
      setHasProfileData(true);
    };

    window.addEventListener("dashboard:profile-updated", handleProfileUpdated as EventListener);
    return () => window.removeEventListener("dashboard:profile-updated", handleProfileUpdated as EventListener);
  }, []);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    const supabase = createClient();

    if (currentUserId) {
      clearDashboardCache(profileCacheKey(currentUserId));
      clearDashboardCache(homeCacheKey(currentUserId));
    }

    try {
      const { error } = await runAuthRequestWithLockRetry(() => supabase.auth.signOut({ scope: "local" }), {
        timeoutMs: 6000,
        retries: 1
      });
      if (error) {
        console.error("SIGNOUT_ERROR", error);
      }
    } catch (logoutError) {
      console.error("SIGNOUT_ERROR", logoutError);
    } finally {
      router.replace("/");
      router.refresh();
      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          if (window.location.pathname !== "/") {
            window.location.assign("/");
          }
        }, 150);
      }
      setIsLoggingOut(false);
    }
  }

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || email[0]?.toUpperCase() || "U";

  const isAdmin = currentRole === "admin";
  const navItems = useMemo(() => {
    if (!isAdmin) return baseNavItems;
    return [...baseNavItems, { id: "admin", label: "Управление", href: "/admin", icon: ShieldCheck }];
  }, [isAdmin]);
  const shellTransitionClass = sidebarReady ? "transition-all duration-300" : "transition-none";

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
    <main className={cn("min-h-screen bg-[#f5f7f9] text-foreground", sidebarReady ? "opacity-100" : "opacity-0")} style={shellThemeVars}>
      {mobileSidebarOpen ? (
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/35 sm:hidden"
          aria-label="Закрыть меню"
        />
      ) : null}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[#dfe3e6] bg-slate-50 px-3 pb-4 pt-3",
          shellTransitionClass,
          "w-[15.25rem] sm:w-[5.75rem]",
          sidebarCollapsed ? "xl:w-20" : "xl:w-[15.25rem]",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-[110%] sm:translate-x-0"
        )}
      >
        <nav className="flex flex-1 flex-col gap-1">
          <Link className="mb-2 flex items-center gap-3 rounded-xl px-2 py-2.5" href="/dashboard">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4e44d4_0%,#9895ff_100%)] text-white shadow-lg">
              <BookOpen className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div
              className={cn(
                "overflow-hidden whitespace-nowrap transition-all duration-200",
                "hidden xl:block",
                sidebarCollapsed ? "xl:max-w-0 xl:opacity-0 xl:-translate-x-1" : "xl:max-w-[180px] xl:opacity-100 xl:translate-x-0"
              )}
            >
              <h1 className="text-xl font-bold leading-none text-indigo-700">Флексенг</h1>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">Учебный портал</p>
            </div>
          </Link>

          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl py-3 text-sm font-semibold transition-all",
                  "justify-center px-2 sm:justify-center sm:px-2 xl:justify-start xl:px-4",
                  active
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:bg-white/80 hover:text-indigo-600"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap transition-all duration-200",
                    "hidden xl:inline-block",
                    sidebarCollapsed ? "xl:max-w-0 xl:opacity-0 xl:-translate-x-1" : "xl:max-w-[160px] xl:opacity-100 xl:translate-x-0"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setSidebarState((prev) => ({ ...prev, collapsed: !prev.collapsed }))}
            className="hidden items-center gap-3 rounded-xl px-4 py-3 text-slate-500 transition-colors hover:bg-white/80 xl:flex"
            aria-label={sidebarCollapsed ? "Развернуть боковое меню" : "Свернуть боковое меню"}
          >
            <span className="flex h-5 w-5 items-center justify-center">
              <ChevronLeft
                className={cn(
                  "h-5 w-5 shrink-0 transform-gpu stroke-[2.25] transition-transform",
                  sidebarCollapsed ? "scale-x-[-1]" : "scale-x-100"
                )}
              />
            </span>
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap transition-all duration-200",
                sidebarCollapsed ? "max-w-0 opacity-0 -translate-x-1" : "max-w-[160px] opacity-100 translate-x-0"
              )}
            >
              {sidebarCollapsed ? "Развернуть" : "Свернуть"}
            </span>
          </button>

          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-xl py-3 text-slate-500 transition-all hover:bg-white/80 hover:text-indigo-600",
              "justify-center px-2 sm:justify-center sm:px-2 xl:justify-start xl:px-4",
              isActivePath(pathname, "/settings") ? "bg-white text-indigo-700 shadow-sm" : ""
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap transition-all duration-200",
                "hidden xl:inline-block",
                sidebarCollapsed ? "xl:max-w-0 xl:opacity-0 xl:-translate-x-1" : "xl:max-w-[160px] xl:opacity-100 xl:translate-x-0"
              )}
            >
              Настройки
            </span>
          </Link>

          <button
            className="flex items-center justify-center gap-3 rounded-xl px-2 py-3 text-slate-500 transition-all hover:bg-white/80 hover:text-indigo-600 xl:justify-start xl:px-4"
            onClick={handleLogout}
            type="button"
            disabled={isLoggingOut}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span
              className={cn(
                "hidden overflow-hidden whitespace-nowrap transition-all duration-200 xl:inline-block",
                sidebarCollapsed ? "xl:max-w-0 xl:opacity-0 xl:-translate-x-1" : "xl:max-w-[160px] xl:opacity-100 xl:translate-x-0"
              )}
            >
              {isLoggingOut ? "Выход..." : "Выход"}
            </span>
          </button>
        </div>
      </aside>

      <header
        className={cn(
          "fixed right-0 top-0 z-30 flex h-16 items-center justify-between bg-white/80 px-4 shadow-[0_20px_40px_rgba(78,68,212,0.06)] backdrop-blur-md md:px-6",
          shellTransitionClass,
          "left-0 sm:left-[5.75rem]",
          sidebarCollapsed ? "xl:left-20" : "xl:left-[15.25rem]"
        )}
      >
        <div className="flex max-w-xl flex-1 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen((prev) => !prev)}
            className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-white/70 sm:hidden"
            aria-label={mobileSidebarOpen ? "Закрыть меню" : "Открыть меню"}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-10 border-none bg-[#eef1f3] pl-10 pr-4 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-200"
              placeholder="Поиск курсов, заметок или преподавателей..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button type="button" className="relative rounded-full p-2 text-slate-500 transition-all hover:bg-indigo-50">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
          </button>

          <div className="ml-1 flex items-center gap-2 sm:ml-4 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-slate-800">{displayName || "Пользователь"}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                {currentRole === "admin" ? "администратор" : currentRole === "manager" ? "менеджер" : currentRole === "teacher" ? "преподаватель" : "студент"}
              </p>
            </div>
            {!hasProfileData ? (
              <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
            ) : (
              <Avatar className="h-9 w-9">
                <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                <AvatarFallback className={cn("p-0 text-sm font-bold", avatarUrl ? "bg-slate-100 text-transparent" : "")}>
                  {avatarUrl ? "" : initials}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </header>

      <section
        className={cn(
          "min-h-screen px-4 pb-8 pt-20 md:px-6",
          shellTransitionClass,
          "ml-0 sm:ml-[5.75rem]",
          sidebarCollapsed ? "xl:ml-20" : "xl:ml-[15.25rem]"
        )}
      >
        <div className="mx-0 w-full max-w-none">{children}</div>
      </section>
    </main>
  );
}
