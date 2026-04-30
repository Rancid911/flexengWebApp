import { describe, expect, it } from "vitest";

import { getCurrentNotificationsSnapshot, isNotificationsSnapshotStale } from "@/app/(workspace)/dashboard-notifications.snapshot";

describe("dashboard notifications snapshot helpers", () => {
  it("prefers the existing snapshot for optimistic mutations", () => {
    const snapshot = {
      items: [{ id: "n1", title: "A", body: "B", type: "update", target_roles: ["all"], is_active: true, is_read: false, published_at: null, expires_at: null, created_at: null, updated_at: null }],
      unreadCount: 1,
      fetchedAt: 100
    };

    expect(
      getCurrentNotificationsSnapshot({
        notifications: [],
        notificationsSnapshot: snapshot,
        unreadCount: 0
      })
    ).toBe(snapshot);
  });

  it("builds a fallback snapshot from current items when cache is absent", () => {
    const result = getCurrentNotificationsSnapshot({
      notifications: [{ id: "n2", title: "A", body: "B", type: "update", target_roles: ["all"], is_active: true, is_read: true, published_at: null, expires_at: null, created_at: null, updated_at: null }],
      notificationsSnapshot: null,
      unreadCount: 0
    });

    expect(result.items).toHaveLength(1);
    expect(result.unreadCount).toBe(0);
    expect(typeof result.fetchedAt).toBe("number");
  });

  it("marks old snapshots as stale", () => {
    expect(isNotificationsSnapshotStale(null)).toBe(true);
    expect(isNotificationsSnapshotStale({ items: [], unreadCount: 0, fetchedAt: Date.now() })).toBe(false);
    expect(isNotificationsSnapshotStale({ items: [], unreadCount: 0, fetchedAt: Date.now() - 100_000 })).toBe(true);
  });
});
