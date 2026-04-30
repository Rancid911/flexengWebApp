import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useDashboardNotificationsReadLifecycle } from "@/app/(workspace)/use-dashboard-notifications-read-lifecycle";

describe("useDashboardNotificationsReadLifecycle", () => {
  it("does not auto-refresh notifications during initial load", async () => {
    const refreshNotifications = vi.fn().mockResolvedValue(undefined);
    const restoreCachedNotifications = vi.fn(() => true);

    renderHook((props: { pathname: string }) =>
      useDashboardNotificationsReadLifecycle({
        currentUserId: "user-1",
        notificationsOpen: false,
        pathname: props.pathname,
        refreshNotifications,
        restoreCachedNotifications
      }),
      {
        initialProps: {
          pathname: "/dashboard"
        }
      }
    );

    await waitFor(() => expect(restoreCachedNotifications).not.toHaveBeenCalled());
    expect(refreshNotifications).not.toHaveBeenCalled();
  });

  it("refreshes only when the drawer opens", async () => {
    const refreshNotifications = vi.fn().mockResolvedValue(undefined);
    const restoreCachedNotifications = vi.fn(() => false);

    const { rerender } = renderHook(
      (props: { notificationsOpen: boolean; pathname: string }) =>
        useDashboardNotificationsReadLifecycle({
          currentUserId: "user-1",
          notificationsOpen: props.notificationsOpen,
          pathname: props.pathname,
          refreshNotifications,
          restoreCachedNotifications
        }),
      {
        initialProps: {
          notificationsOpen: false,
          pathname: "/dashboard"
        }
      }
    );

    rerender({ notificationsOpen: true, pathname: "/dashboard" });

    await waitFor(() => expect(refreshNotifications).toHaveBeenCalledTimes(1));
    expect(refreshNotifications).toHaveBeenCalledWith(expect.any(Function), { silent: false, onlyIfStale: false });
    expect(restoreCachedNotifications).toHaveBeenCalledTimes(1);

    refreshNotifications.mockClear();
    restoreCachedNotifications.mockClear();

    rerender({ notificationsOpen: true, pathname: "/schedule" });

    await waitFor(() => expect(refreshNotifications).toHaveBeenCalledTimes(0));
    expect(restoreCachedNotifications).not.toHaveBeenCalled();
  });
});
