import { AdminHttpError } from "@/lib/admin/http";
import { toUserNotificationDto } from "@/lib/admin/notifications";
import type { UserNotificationDto } from "@/lib/admin/types";
import { createClient } from "@/lib/supabase/server";

type NotificationState = {
  notification_id: string;
  read_at: string | null;
  dismissed_at: string | null;
};

export async function getAuthedSupabase() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new AdminHttpError(401, "UNAUTHORIZED", "Authentication required");
  }
  return { supabase, userId: user.id };
}

export async function listVisibleNotificationsForUser(limit = 100): Promise<{ items: UserNotificationDto[]; unreadCount: number }> {
  const { supabase, userId } = await getAuthedSupabase();
  const nowIso = new Date().toISOString();

  const { data: notifications, error: notificationsError } = await supabase
    .from("notifications")
    .select("id, title, body, type, published_at, expires_at, created_at")
    .eq("is_active", true)
    .lte("published_at", nowIso)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (notificationsError) {
    throw new AdminHttpError(500, "NOTIFICATIONS_FETCH_FAILED", "Failed to fetch notifications", notificationsError.message);
  }

  if (!notifications || notifications.length === 0) {
    return { items: [], unreadCount: 0 };
  }

  const notificationIds = notifications.map((item) => String(item.id));
  const { data: states, error: statesError } = await supabase
    .from("notification_user_state")
    .select("notification_id, read_at, dismissed_at")
    .eq("user_id", userId)
    .in("notification_id", notificationIds);

  if (statesError) {
    throw new AdminHttpError(500, "NOTIFICATIONS_FETCH_FAILED", "Failed to fetch notification state", statesError.message);
  }

  const stateMap = new Map<string, NotificationState>();
  for (const rawState of (states ?? []) as NotificationState[]) {
    stateMap.set(rawState.notification_id, rawState);
  }

  const items: UserNotificationDto[] = [];
  let unreadCount = 0;

  for (const row of notifications as Record<string, unknown>[]) {
    const id = String(row.id);
    const state = stateMap.get(id) ?? null;
    if (state?.dismissed_at) continue;
    const dto = toUserNotificationDto(row, state);
    items.push(dto);
    if (!dto.is_read) unreadCount += 1;
  }

  return { items, unreadCount };
}
