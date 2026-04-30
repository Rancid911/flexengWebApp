"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { useAsyncAction } from "@/hooks/use-async-action";
import {
  clearDashboardCache,
  homeCacheKey,
  notificationsCacheKey,
  profileCacheKey,
  writeDashboardCache,
  type ProfileCacheData
} from "@/lib/dashboard-cache";
import {
  SIDEBAR_COLLAPSED_PERSISTENCE_KEY,
  serializeSidebarCollapsed
} from "@/lib/dashboard/sidebar-persistence";
import type { UserRole } from "@/lib/auth/get-user-role";
import { clearRuntimeCache } from "@/lib/session-runtime-cache";
import { runAuthRequestWithLockRetry } from "@/lib/supabase/auth-request";
import { createClient } from "@/lib/supabase/client";

export type WorkspaceLayoutProfile = {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole | null;
};

type DashboardRouter = {
  replace: (href: string) => void;
  refresh: () => void;
};

const SIDEBAR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function notificationsRuntimeKey(userId: string) {
  return `dashboard:notifications:${userId}`;
}

function notificationsSummaryRuntimeKey(userId: string) {
  return `dashboard:notifications-summary:${userId}`;
}

export function useDashboardSidebarState(initialSidebarCollapsed: boolean | null) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialSidebarCollapsed ?? false);
  const [sidebarTransitionsEnabled, setSidebarTransitionsEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let frameId = 0;

    if (initialSidebarCollapsed === null) {
      const saved = window.localStorage.getItem(SIDEBAR_COLLAPSED_PERSISTENCE_KEY);
      if (saved === "0" || saved === "1") {
        frameId = window.requestAnimationFrame(() => {
          setSidebarCollapsed(saved === "1");
        });
      }
    }

    const transitionsFrameId = window.requestAnimationFrame(() => {
      setSidebarTransitionsEnabled(true);
    });

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.cancelAnimationFrame(transitionsFrameId);
    };
  }, [initialSidebarCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const persistedValue = serializeSidebarCollapsed(sidebarCollapsed);
    window.localStorage.setItem(SIDEBAR_COLLAPSED_PERSISTENCE_KEY, persistedValue);
    document.cookie = `${SIDEBAR_COLLAPSED_PERSISTENCE_KEY}=${persistedValue}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  }, [sidebarCollapsed]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  return {
    sidebarCollapsed,
    sidebarTransitionsEnabled,
    toggleSidebar
  };
}

export function useDashboardShellOverlays() {
  const pathname = usePathname();
  const [mobileMoreSheetOpen, setMobileMoreSheetOpen] = useState(false);
  const mobileMoreSheetCloseRef = useRef<HTMLButtonElement | null>(null);
  const mobileMoreSheetTriggerRef = useRef<HTMLButtonElement | null>(null);
  const lastInteractionWasKeyboardRef = useRef(false);

  const closeMobileMoreSheet = useCallback((options?: { restoreFocus?: boolean }) => {
    setMobileMoreSheetOpen(false);
    const shouldRestoreFocus = options?.restoreFocus ?? lastInteractionWasKeyboardRef.current;
    if (!shouldRestoreFocus) return;
    window.requestAnimationFrame(() => {
      mobileMoreSheetTriggerRef.current?.focus();
    });
  }, []);

  const openMobileMoreSheet = useCallback(() => {
    setMobileMoreSheetOpen(true);
  }, []);

  useEffect(() => {
    const handlePointerDown = () => {
      lastInteractionWasKeyboardRef.current = false;
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      lastInteractionWasKeyboardRef.current = true;
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280 && mobileMoreSheetOpen) {
        closeMobileMoreSheet({ restoreFocus: false });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [closeMobileMoreSheet, mobileMoreSheetOpen]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      closeMobileMoreSheet({ restoreFocus: false });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [closeMobileMoreSheet, pathname]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (mobileMoreSheetOpen) {
        closeMobileMoreSheet();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closeMobileMoreSheet, mobileMoreSheetOpen]);

  useEffect(() => {
    if (!mobileMoreSheetOpen) return;
    mobileMoreSheetCloseRef.current?.focus();
  }, [mobileMoreSheetOpen]);

  return {
    mobileMoreSheetOpen,
    mobileMoreSheetCloseRef,
    mobileMoreSheetTriggerRef,
    closeMobileMoreSheet,
    openMobileMoreSheet,
    setMobileMoreSheetOpen
  };
}

export function useDashboardProfileState(initialProfile: WorkspaceLayoutProfile) {
  const [email, setEmail] = useState(initialProfile.email);
  const [displayName, setDisplayName] = useState(initialProfile.displayName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialProfile.avatarUrl);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(initialProfile.role);
  const [hasProfileData, setHasProfileData] = useState(true);

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

  return {
    currentUserId: initialProfile.userId,
    email,
    displayName,
    avatarUrl,
    currentRole,
    hasProfileData
  };
}

export function useDashboardLogout(currentUserId: string | null, router: DashboardRouter) {
  const { pending: isLoggingOut, run: runLogout } = useAsyncAction();

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    await runLogout({
      action: async () => {
        const supabase = createClient();

        if (currentUserId) {
          clearDashboardCache(profileCacheKey(currentUserId));
          clearDashboardCache(homeCacheKey(currentUserId));
          clearDashboardCache(notificationsCacheKey(currentUserId));
          clearRuntimeCache(notificationsRuntimeKey(currentUserId));
          clearRuntimeCache(notificationsSummaryRuntimeKey(currentUserId));
        }

        const { error } = await runAuthRequestWithLockRetry(() => supabase.auth.signOut({ scope: "local" }), {
          timeoutMs: 6000,
          retries: 1
        });
        if (error) {
          console.error("SIGNOUT_ERROR", error);
        }
      },
      onError: (logoutError) => {
        console.error("SIGNOUT_ERROR", logoutError);
      },
      onSuccess: () => {
        router.replace("/");
        router.refresh();
        if (typeof window !== "undefined") {
          window.setTimeout(() => {
            if (window.location.pathname !== "/") {
              window.location.assign("/");
            }
          }, 150);
        }
      }
    });
  }, [currentUserId, isLoggingOut, router, runLogout]);

  return {
    isLoggingOut,
    handleLogout
  };
}
