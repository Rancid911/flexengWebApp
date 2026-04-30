import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearRuntimeCache } from "@/lib/session-runtime-cache";
import { writeNotificationsUnreadSummary } from "@/app/(workspace)/dashboard-notifications.api";

vi.mock("next/dynamic", async () => {
  const React = await import("react");

  return {
    default: (loader: () => Promise<unknown>) => {
      function DynamicComponent(props: Record<string, unknown>) {
        const [Component, setComponent] = React.useState<React.ComponentType<Record<string, unknown>> | null>(null);

        React.useEffect(() => {
          let active = true;

          void Promise.resolve(loader()).then((module) => {
            if (!active) return;
            const resolvedComponent =
              typeof module === "function"
                ? (module as React.ComponentType<Record<string, unknown>>)
                : ((module as Record<string, React.ComponentType<Record<string, unknown>>>).default ??
                  Object.values(module as Record<string, React.ComponentType<Record<string, unknown>>>)[0]);
            setComponent(() => resolvedComponent);
          });

          return () => {
            active = false;
          };
        }, []);

        if (!Component) return null;
        return <Component {...props} />;
      }

      return DynamicComponent;
    }
  };
});

vi.mock("@/components/search/dashboard-global-search", () => ({
  DashboardGlobalSearch: () => (
    <div data-testid="search-island">
      <input role="combobox" aria-controls="search-results" aria-expanded="true" />
    </div>
  )
}));

vi.mock("@/app/(workspace)/shell/workspace-notifications-panel", () => ({
  WorkspaceNotificationsPanel: ({
    open,
    onOpenChange,
    onUnreadCountChange
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUnreadCountChange?: (count: number) => void;
  }) => {
    React.useEffect(() => {
      onUnreadCountChange?.(33);
    }, [onUnreadCountChange]);

    return open ? (
      <div data-testid="notifications-panel">
        <button type="button" onClick={() => onOpenChange(false)}>
          close
        </button>
      </div>
    ) : null;
  }
}));

import { WorkspaceUtilities } from "@/app/(workspace)/shell/workspace-utilities";

describe("WorkspaceUtilities", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    clearRuntimeCache();
  });

  it("keeps search on the left and notifications pinned to the right", () => {
    const { container } = render(
      <WorkspaceUtilities
        currentUserId="user-1"
        utilitySlots={{
          search: "lazy",
          notifications: "lazy"
        }}
      />
    );

    const layout = container.firstElementChild;
    expect(layout).toHaveClass("w-full");

    const searchTrigger = screen.getByTestId("dashboard-search-trigger");
    const notificationsBell = screen.getByTestId("notifications-bell");
    const notificationsWrapper = notificationsBell.parentElement;

    expect(searchTrigger.closest("div")).toHaveClass("flex-1");
    expect(notificationsWrapper).toHaveClass("ml-auto");
    expect(layout?.firstElementChild).toContainElement(searchTrigger);
    expect(layout?.lastElementChild).toContainElement(notificationsBell);
  });

  it("uses white glass utility controls in CRM glass mode", () => {
    render(
      <WorkspaceUtilities
        currentUserId="user-1"
        utilitySlots={{
          search: "lazy",
          notifications: "lazy"
        }}
        crmGlassMode
      />
    );

    const searchTrigger = screen.getByTestId("dashboard-search-trigger");
    const notificationsBell = screen.getByTestId("notifications-bell");

    expect(searchTrigger).toHaveClass("bg-white/14");
    expect(searchTrigger).toHaveClass("text-white/80");
    expect(searchTrigger.querySelector("svg")).toHaveClass("text-white");
    expect(notificationsBell).toHaveClass("text-white");
    expect(notificationsBell).toHaveClass("hover:bg-white/14");
  });

  it("does not mount search or notifications islands before interaction", () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ unreadCount: 33 })
      }))
    );

    render(
      <WorkspaceUtilities
        currentUserId="user-1"
        utilitySlots={{
          search: "lazy",
          notifications: "lazy"
        }}
      />
    );

    expect(screen.getByTestId("dashboard-search-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("notifications-bell")).toBeInTheDocument();
    expect(screen.queryByTestId("search-island")).not.toBeInTheDocument();
    expect(screen.queryByTestId("notifications-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("notifications-unread-dot")).not.toBeInTheDocument();
  });

  it("loads unread summary in the background without mounting notifications panel", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ unreadCount: 33 })
    }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <WorkspaceUtilities
        currentUserId="user-1"
        utilitySlots={{
          search: "lazy",
          notifications: "lazy"
        }}
      />
    );

    expect(screen.queryByTestId("notifications-unread-dot")).not.toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(1200);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId("notifications-unread-dot")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/notifications/unread-summary", expect.objectContaining({ cache: "no-store" }));
    expect(screen.queryByTestId("notifications-panel")).not.toBeInTheDocument();
  });

  it("uses cached unread summary without a background request", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ unreadCount: 0 })
    }));
    vi.stubGlobal("fetch", fetchMock);
    writeNotificationsUnreadSummary("user-1", 33);

    render(
      <WorkspaceUtilities
        currentUserId="user-1"
        utilitySlots={{
          search: "lazy",
          notifications: "lazy"
        }}
      />
    );

    expect(screen.getByTestId("notifications-unread-dot")).toBeInTheDocument();
    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("notifications-panel")).not.toBeInTheDocument();
  });

  it("mounts lazy islands only after user interaction", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ unreadCount: 0 })
      }))
    );

    render(
      <WorkspaceUtilities
        currentUserId="user-1"
        utilitySlots={{
          search: "lazy",
          notifications: "lazy"
        }}
      />
    );

    fireEvent.click(screen.getByTestId("dashboard-search-trigger"));
    await waitFor(() => expect(screen.getByTestId("search-island")).toBeInTheDocument());

    fireEvent.click(screen.getByTestId("notifications-bell"));
    await waitFor(() => expect(screen.getByTestId("notifications-panel")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId("notifications-unread-dot")).toBeInTheDocument());
  });
});
