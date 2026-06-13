import type { AppActor } from "@/lib/auth/request-context";
import { HttpError } from "@/lib/server/http";
import { toUserNotificationDto } from "@/lib/admin/notifications";
import type { UserNotificationDto } from "@/lib/admin/types";
import { isNotificationVisibleForActor } from "@/lib/notifications/audience";
import { createNotificationsRepository } from "@/lib/notifications/repository";
import { measureServerTiming } from "@/lib/server/timing";
import type { AccessMode } from "@/lib/supabase/access";
import { runAuthRequestWithLockRetry } from "@/lib/supabase/auth-request";
import { createClient } from "@/lib/supabase/server";

type NotificationState = {
  notification_id: string;
  read_at: string | null;
  dismissed_at: string | null;
};

function asRecordRows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function asNotificationStates(value: unknown): NotificationState[] {
  return Array.isArray(value) ? (value as NotificationState[]) : [];
}

export const NOTIFICATIONS_SERVER_ACCESS_MODE: AccessMode = "user_scoped";

export async function getAuthedSupabase() {
  void NOTIFICATIONS_SERVER_ACCESS_MODE;
  const supabase = await measureServerTiming("notifications-auth-client", async () => await createClient());
  const {
    data: { user },
    error
  } = await measureServerTiming("notifications-auth-user", async () =>
    await runAuthRequestWithLockRetry(() => supabase.auth.getUser())
  );
  if (error || !user) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
  }
  return { supabase, userId: user.id, userCreatedAt: user.created_at ?? null };
}

async function loadNotificationContext(actor: AppActor, limit: number, summaryOnly = false) {
  const { supabase, userId, userCreatedAt } = await getAuthedSupabase();
  if (userId !== actor.userId) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
  }
  const repository = createNotificationsRepository(supabase);
  const nowIso = new Date().toISOString();
  const { data: profile } = await measureServerTiming("notifications-profile-created-at", async () => await repository.loadProfileCreatedAt(userId));
  const accountCreatedAt = typeof profile?.created_at === "string" ? profile.created_at : userCreatedAt;

  const { data: notifications, error: notificationsError } = await measureServerTiming(
    summaryOnly ? "notifications-summary-list" : "notifications-list",
    async () => await repository.listActiveNotifications({ nowIso, accountCreatedAt, limit, summaryOnly })
  );
  if (notificationsError) {
    throw new HttpError(
      500,
      "NOTIFICATIONS_FETCH_FAILED",
      summaryOnly ? "Failed to fetch notifications summary" : "Failed to fetch notifications",
      notificationsError.message
    );
  }

  const rows = asRecordRows(notifications);
  if (rows.length === 0) {
    return { rows, states: [] as NotificationState[], actor, userId };
  }

  const notificationIds = rows.map((item) => String(item.id));
  const { data: states, error: statesError } = await measureServerTiming(
    summaryOnly ? "notifications-summary-state" : "notifications-state",
    async () => await repository.loadStates(userId, notificationIds)
  );
  if (statesError) {
    throw new HttpError(
      500,
      "NOTIFICATIONS_FETCH_FAILED",
      summaryOnly ? "Failed to fetch notification summary state" : "Failed to fetch notification state",
      statesError.message
    );
  }

  return { rows, states: asNotificationStates(states), actor, userId };
}

export async function listVisibleNotificationsForUser(actor: AppActor, limit = 100): Promise<{ items: UserNotificationDto[]; unreadCount: number }> {
  const { rows, states } = await loadNotificationContext(actor, limit);
  if (rows.length === 0) return { items: [], unreadCount: 0 };

  const stateMap = new Map<string, NotificationState>();
  for (const rawState of states) {
    stateMap.set(rawState.notification_id, rawState);
  }

  const items: UserNotificationDto[] = [];
  let unreadCount = 0;

  for (const row of rows) {
    const id = String(row.id);
    if (!isNotificationVisibleForActor(row, actor)) continue;
    const state = stateMap.get(id) ?? null;
    if (state?.dismissed_at) continue;
    const dto = toUserNotificationDto(row, state);
    items.push(dto);
    if (!dto.is_read) unreadCount += 1;
  }

  return { items, unreadCount };
}

export async function getUnreadNotificationsSummaryForUser(actor: AppActor, limit = 100): Promise<{ unreadCount: number }> {
  const { rows, states } = await loadNotificationContext(actor, limit, true);
  if (rows.length === 0) return { unreadCount: 0 };

  const stateMap = new Map<string, NotificationState>();
  for (const rawState of states) {
    stateMap.set(rawState.notification_id, rawState);
  }

  let unreadCount = 0;

  for (const row of rows) {
    const id = String(row.id);
    if (!isNotificationVisibleForActor(row, actor)) continue;

    const state = stateMap.get(id) ?? null;
    if (state?.dismissed_at || state?.read_at) continue;
    unreadCount += 1;
  }

  return { unreadCount };
}

export async function markNotificationReadForUser(id: string): Promise<{ ok: true }> {
  const { supabase, userId } = await getAuthedSupabase();
  const repository = createNotificationsRepository(supabase);
  const nowIso = new Date().toISOString();
  const { data: notification, error: notificationError } = await repository.loadNotification(id);
  if (notificationError) throw new HttpError(500, "NOTIFICATION_READ_FAILED", "Failed to access notification", notificationError.message);
  if (!notification) throw new HttpError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");

  const { error: stateError } = await repository.upsertReadState({ notificationId: id, userId, readAt: nowIso });
  if (stateError) throw new HttpError(500, "NOTIFICATION_READ_FAILED", "Failed to mark notification as read", stateError.message);

  return { ok: true };
}

export async function dismissNotificationForUser(id: string): Promise<{ ok: true }> {
  const { supabase, userId } = await getAuthedSupabase();
  const repository = createNotificationsRepository(supabase);
  const nowIso = new Date().toISOString();
  const { data: notification, error: notificationError } = await repository.loadNotification(id);
  if (notificationError) throw new HttpError(500, "NOTIFICATION_DISMISS_FAILED", "Failed to access notification", notificationError.message);
  if (!notification) throw new HttpError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");

  const { error: stateError } = await repository.upsertDismissState({ notificationId: id, userId, readAt: nowIso, dismissedAt: nowIso });
  if (stateError) throw new HttpError(500, "NOTIFICATION_DISMISS_FAILED", "Failed to dismiss notification", stateError.message);

  return { ok: true };
}
