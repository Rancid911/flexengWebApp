import { describe, expect, it } from "vitest";

import {
  clearDashboardCache,
  notificationsCacheKey,
  readDashboardCache,
  writeDashboardCache,
  type NotificationsCacheData
} from "@/lib/dashboard-cache";

describe("lib/dashboard-cache", () => {
  it("stores and reads notifications snapshots by user-specific key", () => {
    const key = notificationsCacheKey("user-123");
    const snapshot: NotificationsCacheData = {
      items: [
        {
          id: "notification-1",
          title: "Новость",
          body: "Новое сообщение",
          type: "news",
          published_at: "2026-03-26T10:00:00.000Z",
          expires_at: null,
          created_at: "2026-03-26T09:59:00.000Z",
          is_read: false
        }
      ],
      unreadCount: 1,
      fetchedAt: Date.now()
    };

    clearDashboardCache(key);
    writeDashboardCache(key, snapshot);

    expect(readDashboardCache<NotificationsCacheData>(key)).toEqual(snapshot);
  });

  it("clears stored notifications snapshots", () => {
    const key = notificationsCacheKey("user-456");
    const snapshot: NotificationsCacheData = {
      items: [],
      unreadCount: 0,
      fetchedAt: Date.now()
    };

    writeDashboardCache(key, snapshot);
    clearDashboardCache(key);

    expect(readDashboardCache<NotificationsCacheData>(key)).toBeNull();
  });
});
