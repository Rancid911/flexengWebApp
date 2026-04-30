"use client";

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useDashboardSidebarState } from "@/app/(workspace)/use-dashboard-shell-state";
import { SIDEBAR_COLLAPSED_PERSISTENCE_KEY } from "@/lib/dashboard/sidebar-persistence";

describe("useDashboardSidebarState", () => {
  afterEach(() => {
    window.localStorage.clear();
    document.cookie = `${SIDEBAR_COLLAPSED_PERSISTENCE_KEY}=; path=/; max-age=0; samesite=lax`;
  });

  it("initializes from server-provided collapsed state", () => {
    const { result } = renderHook(() => useDashboardSidebarState(true));

    expect(result.current.sidebarCollapsed).toBe(true);
  });

  it("toggles persisted state into localStorage and cookie", () => {
    const { result } = renderHook(() => useDashboardSidebarState(false));

    act(() => {
      result.current.toggleSidebar();
    });

    expect(result.current.sidebarCollapsed).toBe(true);
    expect(window.localStorage.getItem(SIDEBAR_COLLAPSED_PERSISTENCE_KEY)).toBe("1");
    expect(document.cookie).toContain(`${SIDEBAR_COLLAPSED_PERSISTENCE_KEY}=1`);
  });

  it("uses localStorage as fallback when server state is missing", async () => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_PERSISTENCE_KEY, "1");

    const { result } = renderHook(() => useDashboardSidebarState(null));

    await waitFor(() => {
      expect(result.current.sidebarCollapsed).toBe(true);
    });
  });
});
