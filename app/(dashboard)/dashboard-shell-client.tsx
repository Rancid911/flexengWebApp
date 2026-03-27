"use client";

import {
  LayoutDashboard,
  GraduationCap,
  Layers,
  ClipboardList,
  ShieldCheck,
  Settings,
  LogOut,
  Bell,
  BellOff,
  Wrench,
  Sparkles,
  Newspaper,
  ChevronLeft,
  X,
  Menu,
  BookOpen,
  ChartColumn,
  CreditCard,
  CalendarRange
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardGlobalSearch } from "@/components/search/dashboard-global-search";
import {
  clearDashboardCache,
  homeCacheKey,
  notificationsCacheKey,
  profileCacheKey,
  readDashboardCache,
  writeDashboardCache,
  type NotificationsCacheData,
  type ProfileCacheData
} from "@/lib/dashboard-cache";
import type { UserRole } from "@/lib/auth/get-user-role";
import { clearRuntimeCache, readRuntimeCache, writeRuntimeCache } from "@/lib/session-runtime-cache";
import { runAuthRequestWithLockRetry } from "@/lib/supabase/auth-request";
import { createClient } from "@/lib/supabase/client";
import type { UserNotificationDto } from "@/lib/admin/types";
import { mapUiErrorMessage } from "@/lib/ui-error-map";
import { cn } from "@/lib/utils";

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type MobileActionItem =
  | { id: string; label: string; href: string; icon: React.ComponentType<{ className?: string }>; kind: "link" }
  | { id: string; label: string; icon: React.ComponentType<{ className?: string }>; kind: "button"; danger?: boolean };

type LayoutProfileCache = {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole | null;
};

type DashboardShellClientProps = {
  initialProfile: LayoutProfileCache;
  appVersion: string;
  children: React.ReactNode;
};

const STORAGE_KEY = "flexengSidebarCollapsed";
const NOTIFICATIONS_CACHE_TTL_MS = 10 * 60 * 1000;
const NOTIFICATIONS_STALE_MS = 75_000;

const baseNavItems: NavItem[] = [
  { id: "dashboard", label: "Рабочий стол", href: "/dashboard", icon: LayoutDashboard },
  { id: "schedule", label: "Расписание", href: "/schedule", icon: CalendarRange },
  { id: "practice", label: "Практика", href: "/practice", icon: GraduationCap },
  { id: "homework", label: "Домашнее задание", href: "/homework", icon: ClipboardList },
  { id: "words", label: "Слова", href: "/words", icon: Layers },
  { id: "progress", label: "Прогресс", href: "/progress", icon: ChartColumn }
];

const adminNavItem: NavItem = { id: "admin", label: "Управление", href: "/admin", icon: ShieldCheck };

const adminPrimaryNavItems: NavItem[] = [
  { id: "dashboard", label: "Дашборд", href: "/dashboard", icon: LayoutDashboard },
  { id: "student-dashboard", label: "Рабочий стол", href: "/student-dashboard", icon: BookOpen },
  { id: "schedule", label: "Расписание", href: "/schedule", icon: CalendarRange },
  adminNavItem,
  { id: "practice", label: "Практика", href: "/practice", icon: GraduationCap },
  { id: "homework", label: "Домашнее задание", href: "/homework", icon: ClipboardList },
  { id: "words", label: "Слова", href: "/words", icon: Layers },
  { id: "progress", label: "Прогресс", href: "/progress", icon: ChartColumn }
];

const settingsNavItems: NavItem[] = [
  { id: "profile", label: "Профиль", href: "/settings/profile", icon: Settings },
  { id: "payments", label: "Оплата", href: "/settings/payments", icon: CreditCard }
];

function getSidebarItemClass(active: boolean, secondary = false) {
  return cn(
    "group flex items-center gap-3 rounded-2xl py-2.5 text-sm font-semibold transition-all duration-200",
    "justify-center px-2 xl:justify-start xl:px-3.5",
    active
      ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_100%)] text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.07)] ring-1 ring-white/90"
      : secondary
        ? "text-slate-500 hover:bg-white/70 hover:text-slate-800"
        : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
  );
}

function getSidebarTokenClass(active: boolean, secondary = false) {
  return cn(
    "flex h-[2.125rem] w-[2.125rem] shrink-0 items-center justify-center rounded-2xl transition-all duration-200",
    "bg-slate-100 text-slate-600",
    active
      ? "bg-slate-200 text-slate-800 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65),0_8px_18px_rgba(15,23,42,0.08)]"
      : secondary
        ? "opacity-90 group-hover:opacity-100"
        : "group-hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]"
  );
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function notificationsRuntimeKey(userId: string) {
  return `dashboard:notifications:${userId}`;
}

function isNotificationsSnapshotStale(snapshot: NotificationsCacheData | null) {
  if (!snapshot) return true;
  return Date.now() - snapshot.fetchedAt > NOTIFICATIONS_STALE_MS;
}

function renderSidebarNavItem({
  item,
  active,
  secondary,
  sidebarCollapsed,
  labelMotionClass
}: {
  item: NavItem;
  active: boolean;
  secondary: boolean;
  sidebarCollapsed: boolean;
  labelMotionClass: string;
}) {
  return (
    <Link key={item.id} href={item.href} className={getSidebarItemClass(active, secondary)}>
      <span className={getSidebarTokenClass(active, secondary)}>
        <item.icon className="h-[1.125rem] w-[1.125rem] shrink-0" />
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
}

export default function DashboardShellClient({ initialProfile, appVersion, children }: DashboardShellClientProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [email, setEmail] = useState(initialProfile.email);
  const [displayName, setDisplayName] = useState(initialProfile.displayName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialProfile.avatarUrl);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(initialProfile.role);
  const [hasProfileData, setHasProfileData] = useState(true);
  const [currentUserId] = useState<string | null>(initialProfile.userId);
  const [sidebarState, setSidebarState] = useState({ collapsed: false, ready: false });
  const [sidebarTransitionsEnabled, setSidebarTransitionsEnabled] = useState(false);
  const [mobileMoreSheetOpen, setMobileMoreSheetOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifications, setNotifications] = useState<UserNotificationDto[]>([]);
  const [notificationsError, setNotificationsError] = useState("");
  const [hasNotificationsData, setHasNotificationsData] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readingIds, setReadingIds] = useState<Record<string, boolean>>({});
  const [dismissingIds, setDismissingIds] = useState<Record<string, boolean>>({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const notificationsLoadIdRef = useRef(0);
  const notificationsRequestInFlightRef = useRef(false);
  const notificationsSnapshotRef = useRef<NotificationsCacheData | null>(null);
  const mobileMoreSheetCloseRef = useRef<HTMLButtonElement | null>(null);
  const sidebarCollapsed = sidebarState.collapsed;
  const sidebarReady = sidebarState.ready;

  const readCachedNotifications = useCallback((): NotificationsCacheData | null => {
    if (typeof window === "undefined" || !currentUserId) return null;

    return (
      readRuntimeCache<NotificationsCacheData>(notificationsRuntimeKey(currentUserId), NOTIFICATIONS_CACHE_TTL_MS) ??
      readDashboardCache<NotificationsCacheData>(notificationsCacheKey(currentUserId))
    );
  }, [currentUserId]);

  const applyNotificationsSnapshot = useCallback(
    (snapshot: NotificationsCacheData, options?: { persist?: boolean }) => {
      notificationsSnapshotRef.current = snapshot;
      setNotifications(snapshot.items);
      setUnreadCount(snapshot.unreadCount);
      setHasNotificationsData(true);

      if (typeof window === "undefined" || !currentUserId || options?.persist === false) return;
      writeRuntimeCache(notificationsRuntimeKey(currentUserId), snapshot);
      writeDashboardCache(notificationsCacheKey(currentUserId), snapshot);
    },
    [currentUserId]
  );

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    setSidebarState({ collapsed: saved === "1", ready: true });
    const frameId = window.requestAnimationFrame(() => {
      setSidebarTransitionsEnabled(true);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sidebarReady) return;
    window.localStorage.setItem(STORAGE_KEY, sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed, sidebarReady]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setMobileMoreSheetOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setMobileMoreSheetOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  useLayoutEffect(() => {
    const cachedSnapshot = readCachedNotifications();
    if (!cachedSnapshot) return;
    applyNotificationsSnapshot(cachedSnapshot);
  }, [applyNotificationsSnapshot, readCachedNotifications]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMoreSheetOpen(false);
        setNotificationsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const loadNotifications = useCallback(
    async (options?: { silent?: boolean; onlyIfStale?: boolean }) => {
      if (!currentUserId) return;

      const cachedSnapshot = notificationsSnapshotRef.current ?? readCachedNotifications();
      if (options?.onlyIfStale && cachedSnapshot && !isNotificationsSnapshotStale(cachedSnapshot)) {
        return;
      }

      if (notificationsRequestInFlightRef.current) {
        return;
      }

      const requestId = ++notificationsLoadIdRef.current;
      notificationsRequestInFlightRef.current = true;
      if (!options?.silent && !cachedSnapshot) {
        setNotificationsLoading(true);
      }

      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load notifications");
        const payload = (await response.json()) as { items?: UserNotificationDto[]; unreadCount?: number };
        const items = Array.isArray(payload.items) ? payload.items : [];
        const snapshot: NotificationsCacheData = {
          items,
          unreadCount: typeof payload.unreadCount === "number" ? payload.unreadCount : items.filter((item) => !item.is_read).length,
          fetchedAt: Date.now()
        };

        if (requestId !== notificationsLoadIdRef.current) return;
        applyNotificationsSnapshot(snapshot);
        setNotificationsError("");
      } catch (error) {
        if (requestId !== notificationsLoadIdRef.current) return;
        const message = mapUiErrorMessage(error instanceof Error ? error.message : "", "Не удалось загрузить уведомления");
        setNotificationsError(message);
      } finally {
        if (requestId === notificationsLoadIdRef.current) {
          setNotificationsLoading(false);
          notificationsRequestInFlightRef.current = false;
        }
      }
    },
    [applyNotificationsSnapshot, currentUserId, readCachedNotifications]
  );

  async function dismissNotification(notification: UserNotificationDto) {
    if (dismissingIds[notification.id]) return;
    const prevSnapshot =
      notificationsSnapshotRef.current ??
      ({
        items: notifications,
        unreadCount,
        fetchedAt: Date.now()
      } satisfies NotificationsCacheData);
    const nextSnapshot: NotificationsCacheData = {
      items: prevSnapshot.items.filter((item) => item.id !== notification.id),
      unreadCount: notification.is_read ? prevSnapshot.unreadCount : Math.max(0, prevSnapshot.unreadCount - 1),
      fetchedAt: Date.now()
    };

    setDismissingIds((prev) => ({ ...prev, [notification.id]: true }));
    applyNotificationsSnapshot(nextSnapshot);

    try {
      const response = await fetch(`/api/notifications/${notification.id}/dismiss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string; code?: string } | null;
        throw new Error(payload?.message || payload?.code || "Failed to dismiss notification");
      }
      void loadNotifications({ silent: true, onlyIfStale: false });
    } catch (error) {
      console.error("NOTIFICATIONS_DISMISS_ERROR", error);
      applyNotificationsSnapshot(prevSnapshot);
      setNotificationsError(
        mapUiErrorMessage(error instanceof Error ? error.message : "", "Не удалось скрыть уведомление. Попробуйте ещё раз.")
      );
    } finally {
      setDismissingIds((prev) => {
        const next = { ...prev };
        delete next[notification.id];
        return next;
      });
    }
  }

  async function markNotificationRead(notification: UserNotificationDto) {
    if (notification.is_read || readingIds[notification.id] || dismissingIds[notification.id]) return;
    const prevSnapshot =
      notificationsSnapshotRef.current ??
      ({
        items: notifications,
        unreadCount,
        fetchedAt: Date.now()
      } satisfies NotificationsCacheData);
    const nextSnapshot: NotificationsCacheData = {
      items: prevSnapshot.items.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)),
      unreadCount: Math.max(0, prevSnapshot.unreadCount - 1),
      fetchedAt: Date.now()
    };

    setReadingIds((prev) => ({ ...prev, [notification.id]: true }));
    applyNotificationsSnapshot(nextSnapshot);

    try {
      const response = await fetch(`/api/notifications/${notification.id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string; code?: string } | null;
        throw new Error(payload?.message || payload?.code || "Failed to mark notification as read");
      }
      void loadNotifications({ silent: true, onlyIfStale: false });
    } catch (error) {
      console.error("NOTIFICATIONS_READ_ERROR", error);
      applyNotificationsSnapshot(prevSnapshot);
    } finally {
      setReadingIds((prev) => {
        const next = { ...prev };
        delete next[notification.id];
        return next;
      });
    }
  }

  useEffect(() => {
    void loadNotifications({ silent: Boolean(readCachedNotifications()) });
  }, [loadNotifications, readCachedNotifications]);

  useEffect(() => {
    void loadNotifications({ silent: true, onlyIfStale: true });
  }, [loadNotifications, pathname]);

  useEffect(() => {
    if (!notificationsOpen) return;
    void loadNotifications({ silent: true });
  }, [loadNotifications, notificationsOpen]);

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
      clearDashboardCache(notificationsCacheKey(currentUserId));
      clearRuntimeCache(notificationsRuntimeKey(currentUserId));
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
  const adminDashboardNavItem = adminPrimaryNavItems[0];
  const adminControlNavItem = adminPrimaryNavItems[2];
  const adminStudentNavItems = adminPrimaryNavItems.slice(1, 2).concat(adminPrimaryNavItems.slice(3));
  const desktopNavItems = useMemo(() => {
    if (!isAdmin) return baseNavItems;
    return adminPrimaryNavItems;
  }, [isAdmin]);
  const primaryMobileNavItems = useMemo(() => {
    if (!isAdmin) return baseNavItems;
    return adminPrimaryNavItems.slice(0, 5);
  }, [isAdmin]);
  const mobileSheetNavItems = useMemo(() => {
    const items: MobileActionItem[] = isAdmin
      ? [
          { id: "words", label: "Слова", href: "/words", icon: Layers, kind: "link" },
          { id: "progress", label: "Прогресс", href: "/progress", icon: ChartColumn, kind: "link" },
          { id: "profile", label: "Профиль", href: "/settings/profile", icon: Settings, kind: "link" },
          { id: "payments", label: "Оплата", href: "/settings/payments", icon: CreditCard, kind: "link" }
        ]
      : [
          { id: "profile", label: "Профиль", href: "/settings/profile", icon: Settings, kind: "link" },
          { id: "payments", label: "Оплата", href: "/settings/payments", icon: CreditCard, kind: "link" }
        ];
    items.push(
      { id: "logout", label: isLoggingOut ? "Выход..." : "Выход", icon: LogOut, kind: "button", danger: true }
    );
    return items;
  }, [isAdmin, isLoggingOut]);
  const mobileSheetLinkItems = useMemo(
    () => mobileSheetNavItems.filter((item): item is Extract<MobileActionItem, { kind: "link" }> => item.kind === "link"),
    [mobileSheetNavItems]
  );
  const mobileMoreActive = mobileSheetLinkItems.some((item) => isActivePath(pathname, item.href));
  const shellExpandEasingClass = "ease-[cubic-bezier(0.22,1,0.36,1)]";
  const shellCollapseEasingClass = "ease-[cubic-bezier(0.4,0,1,1)]";
  const shellEasingClass = sidebarCollapsed ? shellCollapseEasingClass : shellExpandEasingClass;
  const enableShellTransitions = sidebarReady && sidebarTransitionsEnabled;
  const sidebarTransitionClass = enableShellTransitions ? `transition-[width,transform] duration-300 ${shellEasingClass}` : "transition-none";
  const shellOffsetTransitionClass = enableShellTransitions ? `transition-[left,margin-left] duration-300 ${shellEasingClass}` : "transition-none";
  const labelMotionClass = sidebarCollapsed
    ? "transition-[opacity,transform] duration-220 ease-[cubic-bezier(0.4,0,1,1)]"
    : "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";
  const unreadBadgeClass = cn(
    "absolute right-[9px] top-[9px] h-2 w-2 rounded-full border border-white bg-red-500 shadow-sm"
  );
  const roleLabel =
    currentRole === "admin" ? "администратор" : currentRole === "manager" ? "менеджер" : currentRole === "teacher" ? "преподаватель" : "студент";

  useEffect(() => {
    if (!mobileMoreSheetOpen) return;
    mobileMoreSheetCloseRef.current?.focus();
  }, [mobileMoreSheetOpen]);

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

  function formatNotificationDate(value: string | null) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);
    const timePart = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(date);

    if (date >= todayStart) return `Сегодня ${timePart}`;
    if (date >= yesterdayStart && date < todayStart) return `Вчера ${timePart}`;
    return `${new Intl.DateTimeFormat("ru-RU", { dateStyle: "short" }).format(date)} ${timePart}`;
  }

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
      {mobileMoreSheetOpen ? (
        <button
          type="button"
          onClick={() => setMobileMoreSheetOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/30 xl:hidden"
          aria-label="Закрыть дополнительное меню"
        />
      ) : null}

      <aside
        data-testid="dashboard-sidebar"
        data-collapsed={sidebarCollapsed ? "true" : "false"}
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-[#dfe3e6] bg-slate-50 px-3 pb-4 pt-0 shadow-[inset_-1px_0_0_rgba(255,255,255,0.55)] transform-gpu will-change-transform xl:flex",
          sidebarTransitionClass,
          "w-[15.25rem]",
          sidebarCollapsed ? "xl:w-20" : "xl:w-[15.25rem]",
          "translate-x-0"
        )}
      >
        <nav className="flex flex-1 flex-col gap-1">
          <Link className="mb-0 flex h-16 min-h-16 items-center gap-3 rounded-xl px-2 py-0" href="/dashboard">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4e44d4_0%,#9895ff_100%)] text-white shadow-lg">
              <BookOpen className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div
              className={cn(
                "overflow-hidden whitespace-nowrap transition-[opacity,transform] duration-200",
                "hidden xl:block",
                sidebarCollapsed ? "xl:opacity-0 xl:-translate-x-1" : "xl:opacity-100 xl:translate-x-0"
              )}
            >
              <h1 className="text-xl font-bold leading-none text-indigo-700">Флексенг</h1>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">Учебный портал</p>
            </div>
          </Link>
          <div className="mb-1 h-6" />

          {isAdmin
            ? [
                renderSidebarNavItem({
                  item: adminDashboardNavItem,
                  active: isActivePath(pathname, adminDashboardNavItem.href),
                  secondary: false,
                  sidebarCollapsed,
                  labelMotionClass
                }),
                renderSidebarNavItem({
                  item: adminControlNavItem,
                  active: isActivePath(pathname, adminControlNavItem.href),
                  secondary: false,
                  sidebarCollapsed,
                  labelMotionClass
                }),
                <div key="admin-student-gap" aria-hidden="true" className="mt-2 h-2" />,
                ...adminStudentNavItems.map((item) =>
                  renderSidebarNavItem({
                    item,
                    active: isActivePath(pathname, item.href),
                    secondary: true,
                    sidebarCollapsed,
                    labelMotionClass
                  })
                )
              ]
            : desktopNavItems.map((item) =>
                renderSidebarNavItem({
                  item,
                  active: isActivePath(pathname, item.href),
                  secondary: item.id !== "dashboard",
                  sidebarCollapsed,
                  labelMotionClass
                })
              )}

          <div aria-hidden="true" className="mt-4 h-2" />

          {settingsNavItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={getSidebarItemClass(active, true)}
              >
                <span className={getSidebarTokenClass(active, true)}>
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
            onClick={() => setSidebarState((prev) => ({ ...prev, collapsed: !prev.collapsed }))}
            className="hidden items-center gap-3 rounded-2xl py-2.5 text-sm font-semibold text-slate-500 transition-all duration-200 hover:bg-white/70 hover:text-slate-900 xl:flex xl:justify-start xl:px-3.5"
            aria-label={sidebarCollapsed ? "Развернуть боковое меню" : "Свернуть боковое меню"}
          >
            <span className={getSidebarTokenClass(false, true)}>
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

          <button
            data-testid="logout-button"
            className="group flex items-center gap-3 rounded-2xl py-2.5 text-sm font-semibold text-slate-500 transition-all duration-200 hover:bg-white/70 hover:text-slate-900 justify-center px-2 xl:justify-start xl:px-3.5"
            onClick={handleLogout}
            type="button"
            disabled={isLoggingOut}
          >
            <span className="flex h-[2.125rem] w-[2.125rem] shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition-all duration-200 group-hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]">
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

          <div
            aria-label={`Версия проекта v${appVersion}`}
            className={cn(
              "hidden xl:block rounded-2xl bg-white/55 px-3.5 py-2 text-left text-[11px] font-medium tracking-[0.08em] text-slate-400 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]",
              labelMotionClass,
              sidebarCollapsed ? "xl:pointer-events-none xl:opacity-0 xl:-translate-x-1 xl:delay-0" : "xl:opacity-100 xl:translate-x-0 xl:delay-75"
            )}
          >
            {`v${appVersion}`}
          </div>
        </div>
      </aside>

      <header
        className={cn(
          "fixed right-0 top-0 z-30 flex h-16 items-center justify-between bg-white/80 px-4 shadow-[0_20px_40px_rgba(78,68,212,0.06)] backdrop-blur-md md:px-6",
          "will-change-[left]",
          shellOffsetTransitionClass,
          "left-0",
          sidebarCollapsed ? "xl:left-20" : "xl:left-[15.25rem]"
        )}
      >
        <div className="flex max-w-xl flex-1 items-center gap-3 sm:gap-4">
          <DashboardGlobalSearch />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            data-testid="notifications-bell"
            type="button"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className="relative rounded-full p-2 text-slate-500 transition-all hover:bg-indigo-50"
            aria-label="Открыть уведомления"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span data-testid="notifications-unread-dot" className={unreadBadgeClass} />
            ) : null}
          </button>

          <div className="ml-1 flex items-center gap-2 sm:ml-4 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-slate-800">{displayName || "Пользователь"}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">{roleLabel}</p>
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
          "min-h-screen px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-20 md:px-6 xl:pb-8",
          "will-change-[margin-left]",
          shellOffsetTransitionClass,
          "ml-0",
          sidebarCollapsed ? "xl:ml-20" : "xl:ml-[15.25rem]"
        )}
      >
        <div className="mx-0 w-full max-w-none">{children}</div>
      </section>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-[rgba(255,255,255,0.92)] px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_34px_rgba(15,23,42,0.08)] backdrop-blur-xl xl:hidden"
        aria-label="Основная навигация"
      >
        <div className="mx-auto grid max-w-3xl grid-cols-6 gap-1">
          {primaryMobileNavItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center text-[11px] font-semibold transition-all",
                  active ? "bg-indigo-50 text-indigo-700 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.14)]" : "text-slate-500 hover:bg-white"
                )}
                aria-current={active ? "page" : undefined}
              >
                <item.icon className={cn("h-[18px] w-[18px] shrink-0", active ? "stroke-[2.4]" : "stroke-[2.1]")} />
                <span className="leading-none">{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMoreSheetOpen(true)}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center text-[11px] font-semibold transition-all",
              mobileMoreActive || mobileMoreSheetOpen ? "bg-indigo-50 text-indigo-700 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.14)]" : "text-slate-500 hover:bg-white"
            )}
            aria-haspopup="dialog"
            aria-expanded={mobileMoreSheetOpen}
            aria-controls="mobile-more-sheet"
          >
            <Menu className={cn("h-[18px] w-[18px] shrink-0", mobileMoreActive || mobileMoreSheetOpen ? "stroke-[2.4]" : "stroke-[2.1]")} />
            <span className="leading-none">Ещё</span>
          </button>
        </div>
      </nav>

      <aside
        id="mobile-more-sheet"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] border-t border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.98)_100%)] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] xl:hidden",
          mobileMoreSheetOpen ? "translate-y-0" : "translate-y-[105%]"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Дополнительное меню"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />
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
            ref={mobileMoreSheetCloseRef}
            type="button"
            onClick={() => setMobileMoreSheetOpen(false)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            aria-label="Закрыть дополнительное меню"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="space-y-2" aria-label="Дополнительные действия">
          {mobileSheetNavItems.map((item) =>
            item.kind === "link" ? (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex min-h-12 items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-all",
                  isActivePath(pathname, item.href)
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-white/70 bg-white/80 text-slate-700 hover:border-slate-200 hover:bg-white"
                )}
              >
                <span className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </span>
                <ChevronLeft className="h-4 w-4 scale-x-[-1] text-slate-400" />
              </Link>
            ) : (
              <button
                key={item.id}
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={cn(
                  "flex min-h-12 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all",
                  item.danger
                    ? "border-red-100 bg-red-50/80 text-red-700 hover:bg-red-50"
                    : "border-white/70 bg-white/80 text-slate-700 hover:border-slate-200 hover:bg-white",
                  isLoggingOut ? "cursor-not-allowed opacity-60" : ""
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </button>
            )
          )}
        </nav>
      </aside>

      {notificationsOpen ? (
        <button
          type="button"
          aria-label="Закрыть уведомления"
          onClick={() => setNotificationsOpen(false)}
          className="fixed inset-0 z-40 bg-black/25"
        />
      ) : null}

      <aside
        data-testid="notifications-drawer"
        className={cn(
          "fixed right-0 top-0 z-50 h-dvh w-full max-w-md border-l border-border bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.18)] transition-transform duration-200 ease-out",
          notificationsOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Уведомления"
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div>
            <p className="text-base font-semibold text-slate-900">Уведомления</p>
            <p className="text-xs text-slate-500">Непрочитано: {unreadCount}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotificationsOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            aria-label="Закрыть уведомления"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-[calc(100dvh-4rem)] overflow-y-auto px-4 py-4">
          {notificationsLoading && !hasNotificationsData ? (
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

          {notificationsError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              <p>{notificationsError}</p>
              <button
                type="button"
                onClick={() => void loadNotifications()}
                className="mt-2 inline-flex rounded-md bg-white px-2 py-1 text-xs font-medium text-red-700 shadow-sm transition-colors hover:bg-red-100"
              >
                Повторить
              </button>
            </div>
          ) : null}

          {!notificationsLoading && hasNotificationsData && notifications.length === 0 && !notificationsError ? (
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
              const isProcessing = Boolean(dismissingIds[item.id] || readingIds[item.id]);
              return (
                <article
                  key={item.id}
                  className={cn(
                    "group rounded-xl border p-3 shadow-sm transition-all",
                    item.is_read ? "border-border bg-white hover:border-slate-300 hover:shadow-md" : cn("border-l-4", meta.unreadAccentClass, "hover:shadow-md")
                  )}
                  role={item.is_read ? undefined : "button"}
                  tabIndex={item.is_read ? -1 : 0}
                  aria-label={item.is_read ? undefined : `Отметить как прочитанное: ${item.title}`}
                  onClick={() => void markNotificationRead(item)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    void markNotificationRead(item);
                  }}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {!item.is_read ? <span className={cn("h-2 w-2 rounded-full", meta.dotClass)} /> : null}
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", meta.chipClass)}>
                        <Icon className="h-3.5 w-3.5" />
                        {meta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400">{formatNotificationDate(item.published_at || item.created_at)}</span>
                      <button
                        data-testid={`notification-dismiss-${item.id}`}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void dismissNotification(item);
                        }}
                        disabled={isProcessing}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-600 focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Скрыть уведомление"
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
    </main>
  );
}
