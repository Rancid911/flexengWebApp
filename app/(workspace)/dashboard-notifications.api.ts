"use client";

import type { UserNotificationDto } from "@/lib/admin/types";
import type { NotificationsCacheData } from "@/lib/dashboard-cache";
import { formatRuShortDate, formatRuTime, getMoscowDayKey } from "@/lib/dates/format-ru-date";
import { readRuntimeCache, writeRuntimeCache } from "@/lib/session-runtime-cache";

const NOTIFICATIONS_SUMMARY_TTL_MS = 10 * 60 * 1000;

export function notificationsSummaryRuntimeKey(userId: string) {
  return `dashboard:notifications-summary:${userId}`;
}

export function readNotificationsUnreadSummary(currentUserId: string | null): { unreadCount: number } | null {
  if (!currentUserId) return null;
  return readRuntimeCache<{ unreadCount: number }>(notificationsSummaryRuntimeKey(currentUserId), NOTIFICATIONS_SUMMARY_TTL_MS);
}

export function writeNotificationsUnreadSummary(currentUserId: string | null, unreadCount: number): void {
  if (!currentUserId) return;
  writeRuntimeCache(notificationsSummaryRuntimeKey(currentUserId), { unreadCount });
}

export async function fetchNotificationsSnapshot(currentUserId: string | null, signal?: AbortSignal): Promise<NotificationsCacheData> {
  const response = await fetch("/api/notifications", { cache: "no-store", signal });
  if (!response.ok) {
    throw new Error("Failed to load notifications");
  }

  const payload = (await response.json()) as { items?: UserNotificationDto[]; unreadCount?: number };
  const items = Array.isArray(payload.items) ? payload.items : [];

  const snapshot = {
    items,
    unreadCount: typeof payload.unreadCount === "number" ? payload.unreadCount : items.filter((item) => !item.is_read).length,
    fetchedAt: Date.now()
  };
  writeNotificationsUnreadSummary(currentUserId, snapshot.unreadCount);
  return snapshot;
}

export async function fetchNotificationsUnreadSummary(currentUserId: string | null, signal?: AbortSignal): Promise<{ unreadCount: number }> {
  const cached = readNotificationsUnreadSummary(currentUserId);
  if (cached) {
    return cached;
  }

  const response = await fetch("/api/notifications/unread-summary", { cache: "no-store", signal });
  if (!response.ok) {
    throw new Error("Failed to load notifications summary");
  }

  const payload = (await response.json()) as { unreadCount?: number };
  const summary = {
    unreadCount: typeof payload.unreadCount === "number" ? payload.unreadCount : 0
  };
  writeNotificationsUnreadSummary(currentUserId, summary.unreadCount);
  return summary;
}

async function postNotificationAction(pathname: string) {
  const response = await fetch(pathname, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });

  if (response.ok) return;

  const payload = (await response.json().catch(() => null)) as { message?: string; code?: string } | null;
  throw new Error(payload?.message || payload?.code || "Failed to update notification");
}

export async function dismissNotificationRequest(notificationId: string) {
  await postNotificationAction(`/api/notifications/${notificationId}/dismiss`);
}

export async function markNotificationReadRequest(notificationId: string) {
  await postNotificationAction(`/api/notifications/${notificationId}/read`);
}

export function formatDashboardNotificationDate(value: string | null) {
  if (!value) return "";
  const dateKey = getMoscowDayKey(value);
  const timePart = formatRuTime(value);
  if (!dateKey || !timePart) return "";

  const todayKey = getMoscowDayKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getMoscowDayKey(yesterday);

  if (dateKey === todayKey) return `Сегодня ${timePart}`;
  if (dateKey === yesterdayKey) return `Вчера ${timePart}`;

  const shortDate = formatRuShortDate(value);
  return shortDate ? `${shortDate} ${timePart}` : "";
}
