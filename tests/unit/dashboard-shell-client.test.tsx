import { act, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WorkspaceShellClient } from "@/app/(workspace)/workspace-shell-client";

const navigationMockState = vi.hoisted(() => ({
  pathname: "/dashboard"
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMockState.pathname,
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() })
}));

vi.mock("@/app/(workspace)/use-dashboard-shell-state", () => ({
  useDashboardSidebarState: () => ({
    sidebarCollapsed: false,
    sidebarTransitionsEnabled: true,
    toggleSidebar: vi.fn()
  }),
  useDashboardShellOverlays: () => ({
    mobileMoreSheetOpen: false,
    mobileMoreSheetCloseRef: { current: null },
    mobileMoreSheetTriggerRef: { current: null },
    closeMobileMoreSheet: vi.fn(),
    openMobileMoreSheet: vi.fn(),
    setMobileMoreSheetOpen: vi.fn()
  }),
  useDashboardProfileState: (initialProfile: {
    userId: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    role: "admin" | "manager" | "teacher" | "student" | null;
  }) => ({
    currentUserId: initialProfile.userId,
    email: initialProfile.email,
    displayName: initialProfile.displayName,
    avatarUrl: initialProfile.avatarUrl,
    currentRole: initialProfile.role,
    hasProfileData: true
  }),
  useDashboardLogout: () => ({
    isLoggingOut: false,
    handleLogout: vi.fn()
  })
}));

describe("WorkspaceShellClient", () => {
  const baseProps = {
    initialSidebarCollapsed: false,
    initialProfile: {
      userId: "user-1",
      displayName: "Student User",
      email: "student@example.com",
      avatarUrl: null,
      role: "student" as const
    },
    appVersion: "1.0.0",
    shellVariant: "student" as const
  };
  const adminProfile = {
    userId: "admin-1",
    displayName: "Admin User",
    email: "admin@example.com",
    avatarUrl: null,
    role: "admin" as const
  };
  const managerProfile = {
    userId: "manager-1",
    displayName: "Manager User",
    email: "manager@example.com",
    avatarUrl: null,
    role: "manager" as const
  };

  afterEach(() => {
    navigationMockState.pathname = "/dashboard";
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not render global search and notifications when disabled", () => {
    render(
      <WorkspaceShellClient {...baseProps}>
        <div>content</div>
      </WorkspaceShellClient>
    );

    expect(screen.queryByTestId("notifications-bell")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/поиск/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("dashboard-mobile-menu-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-header-right-actions")).toContainElement(screen.getByTestId("dashboard-mobile-menu-trigger"));
    expect(screen.getByTestId("dashboard-header-left-actions")).not.toContainElement(screen.getByTestId("dashboard-mobile-menu-trigger"));
    expect(screen.queryByRole("navigation", { name: "Основная навигация" })).not.toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("renders lazy utility triggers without eager interactive markup", () => {
    render(
      <WorkspaceShellClient
        {...baseProps}
        utilitySlots={{
          search: "lazy",
          notifications: "lazy"
        }}
      >
        <div>content</div>
      </WorkspaceShellClient>
    );

    expect(screen.getByTestId("dashboard-search-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("notifications-bell")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByTestId("notifications-drawer")).not.toBeInTheDocument();
  });

  it("passes CRM glass styling to mobile menu and utilities on the CRM page", () => {
    navigationMockState.pathname = "/crm";

    render(
      <WorkspaceShellClient
        {...baseProps}
        utilitySlots={{
          search: "lazy",
          notifications: "lazy"
        }}
        crmBackgroundImageUrl="https://example.com/crm-bg.jpg"
      >
        <div>content</div>
      </WorkspaceShellClient>
    );

    expect(screen.getByTestId("dashboard-mobile-menu-trigger")).toHaveClass("text-white");
    expect(screen.getByTestId("dashboard-mobile-menu-trigger")).toHaveClass("bg-white/14");
    expect(screen.getByTestId("dashboard-search-trigger")).toHaveClass("text-white/80");
    expect(screen.getByTestId("notifications-bell")).toHaveClass("text-white");
  });

  it("shows CRM unread badge in the staff shell outside the CRM page", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ unreadCount: 4 })
    } as Response);

    render(
      <WorkspaceShellClient {...baseProps} initialProfile={adminProfile} shellVariant="staff">
        <div>staff content</div>
      </WorkspaceShellClient>
    );

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith("/api/crm/unread-summary", expect.objectContaining({ cache: "no-store" })));
    const crmLink = screen.getByRole("link", { name: /CRM/ });
    expect(crmLink).toBeInTheDocument();
    expect(await within(crmLink).findByText("4")).toBeInTheDocument();
    expect(screen.getAllByTestId("workspace-nav-badge")).toHaveLength(1);
  });

  it.each(["/dashboard", "/schedule", "/admin", "/admin/students", "/admin/teachers", "/admin/payments", "/settings/profile"])(
    "keeps the CRM unread badge on the CRM item when %s is active",
    async (pathname) => {
      navigationMockState.pathname = pathname;
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ unreadCount: 4 })
      } as Response);

      render(
        <WorkspaceShellClient {...baseProps} initialProfile={adminProfile} shellVariant="staff">
          <div>staff content</div>
        </WorkspaceShellClient>
      );

      const crmLink = screen.getByRole("link", { name: /CRM/ });
      expect(await within(crmLink).findByTestId("workspace-nav-badge")).toHaveTextContent("4");
      expect(screen.getAllByTestId("workspace-nav-badge")).toHaveLength(1);
    }
  );

  it("shows CRM unread badge on the shared admin dashboard route", async () => {
    navigationMockState.pathname = "/dashboard";
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ unreadCount: 4 })
    } as Response);

    render(
      <WorkspaceShellClient {...baseProps} initialProfile={adminProfile} shellVariant="shared">
        <div>admin dashboard</div>
      </WorkspaceShellClient>
    );

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith("/api/crm/unread-summary", expect.objectContaining({ cache: "no-store" })));
    const crmLink = screen.getByRole("link", { name: /CRM/ });
    expect(await within(crmLink).findByTestId("workspace-nav-badge")).toHaveTextContent("4");
    expect(screen.getAllByTestId("workspace-nav-badge")).toHaveLength(1);
  });

  it("shows CRM unread badge on the shared manager schedule route", async () => {
    navigationMockState.pathname = "/schedule";
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ unreadCount: 5 })
    } as Response);

    render(
      <WorkspaceShellClient {...baseProps} initialProfile={managerProfile} shellVariant="shared">
        <div>manager schedule</div>
      </WorkspaceShellClient>
    );

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith("/api/crm/unread-summary", expect.objectContaining({ cache: "no-store" })));
    const crmLink = screen.getByRole("link", { name: /CRM/ });
    expect(await within(crmLink).findByTestId("workspace-nav-badge")).toHaveTextContent("5");
    expect(screen.getAllByTestId("workspace-nav-badge")).toHaveLength(1);
  });

  it("does not fetch CRM unread summary for shared student and teacher shells", () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ unreadCount: 4 })
    } as Response);

    const { unmount } = render(
      <WorkspaceShellClient {...baseProps} shellVariant="shared">
        <div>student dashboard</div>
      </WorkspaceShellClient>
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: /CRM/ })).not.toBeInTheDocument();

    unmount();

    render(
      <WorkspaceShellClient
        {...baseProps}
        initialProfile={{ ...baseProps.initialProfile, role: "teacher" as const }}
        shellVariant="shared"
      >
        <div>teacher dashboard</div>
      </WorkspaceShellClient>
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: /CRM/ })).not.toBeInTheDocument();
  });

  it("polls CRM unread summary every 60 seconds in the staff shell", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: true, json: async () => ({ unreadCount: 1 }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ unreadCount: 2 }) } as Response);

    render(
      <WorkspaceShellClient {...baseProps} initialProfile={adminProfile} shellVariant="shared">
        <div>staff content</div>
      </WorkspaceShellClient>
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const crmLink = screen.getByRole("link", { name: /CRM/ });
    expect(within(crmLink).getByTestId("workspace-nav-badge")).toHaveTextContent("2");
    expect(screen.getAllByTestId("workspace-nav-badge")).toHaveLength(1);
  });

  it("updates the CRM badge through the unread summary event without moving it to the active item", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ unreadCount: 1 })
    } as Response);

    render(
      <WorkspaceShellClient {...baseProps} initialProfile={adminProfile} shellVariant="staff">
        <div>staff content</div>
      </WorkspaceShellClient>
    );

    await waitFor(() => expect(screen.getAllByTestId("workspace-nav-badge")).toHaveLength(1));

    act(() => {
      window.dispatchEvent(new CustomEvent("crm:unread-summary-change", { detail: { unreadCount: 7 } }));
    });

    const crmLink = screen.getByRole("link", { name: /CRM/ });
    expect(within(crmLink).getByTestId("workspace-nav-badge")).toHaveTextContent("7");
    expect(screen.getAllByTestId("workspace-nav-badge")).toHaveLength(1);
  });

  it("does not poll CRM unread summary for non-staff shells", () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ unreadCount: 4 })
    } as Response);

    render(
      <WorkspaceShellClient {...baseProps}>
        <div>content</div>
      </WorkspaceShellClient>
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
