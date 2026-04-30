"use client";

import {
  notificationsCacheKey,
  readDashboardCache,
  writeDashboardCache,
  type NotificationsCacheData
} from "@/lib/dashboard-cache";
import { readRuntimeCache, writeRuntimeCache } from "@/lib/session-runtime-cache";
import type { UserNotificationDto } from "@/lib/admin/types";

const NOTIFICATIONS_CACHE_TTL_MS = 10 * 60 * 1000;
export const NOTIFICATIONS_STALE_MS = 75_000;

export function notificationsRuntimeKey(userId: string) {
  return `dashboard:notifications:${userId}`;
}

export function isNotificationsSnapshotStale(snapshot: NotificationsCacheData | null) {
  if (!snapshot) return true;
  return Date.now() - snapshot.fetchedAt > NOTIFICATIONS_STALE_MS;
}

export function readCachedNotificationsSnapshot(currentUserId: string | null): NotificationsCacheData | null {
  if (typeof window === "undefined" || !currentUserId) return null;

  return (
    readRuntimeCache<NotificationsCacheData>(notificationsRuntimeKey(currentUserId), NOTIFICATIONS_CACHE_TTL_MS) ??
    readDashboardCache<NotificationsCacheData>(notificationsCacheKey(currentUserId))
  );
}

export function persistNotificationsSnapshot(currentUserId: string | null, snapshot: NotificationsCacheData, persist = true) {
  if (typeof window === "undefined" || !currentUserId || !persist) return;
  writeRuntimeCache(notificationsRuntimeKey(currentUserId), snapshot);
  writeDashboardCache(notificationsCacheKey(currentUserId), snapshot);
}

export function getCurrentNotificationsSnapshot(input: {
  notifications: UserNotificationDto[];
  notificationsSnapshot: NotificationsCacheData | null;
  unreadCount: number;
}) {
  if (input.notificationsSnapshot) return input.notificationsSnapshot;

  return {
    items: input.notifications,
    unreadCount: input.unreadCount,
    fetchedAt: Date.now()
  } satisfies NotificationsCacheData;
}
