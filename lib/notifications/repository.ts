import type { createClient } from "@/lib/supabase/server";

export type NotificationsRepositoryClient = Awaited<ReturnType<typeof createClient>>;

export function createNotificationsRepository(client: NotificationsRepositoryClient) {
  return {
    loadProfile(userId: string) {
      return client.from("profiles").select("role, created_at").eq("id", userId).maybeSingle();
    },

    listActiveNotifications(params: { nowIso: string; accountCreatedAt: string | null; limit: number; summaryOnly?: boolean }) {
      let query = client
        .from("notifications")
        .select(params.summaryOnly ? "id, published_at, target_roles, target_user_ids" : "id, title, body, type, published_at, expires_at, created_at, target_roles, target_user_ids")
        .eq("is_active", true)
        .lte("published_at", params.nowIso);

      if (params.accountCreatedAt) {
        query = query.gte("published_at", params.accountCreatedAt);
      }

      return query.order("published_at", { ascending: false }).limit(params.limit);
    },

    loadStates(userId: string, notificationIds: string[]) {
      return client
        .from("notification_user_state")
        .select("notification_id, read_at, dismissed_at")
        .eq("user_id", userId)
        .in("notification_id", notificationIds);
    },

    loadNotification(id: string) {
      return client.from("notifications").select("id").eq("id", id).maybeSingle();
    },

    upsertReadState(params: { notificationId: string; userId: string; readAt: string }) {
      return client.from("notification_user_state").upsert(
        {
          notification_id: params.notificationId,
          user_id: params.userId,
          read_at: params.readAt
        },
        { onConflict: "notification_id,user_id" }
      );
    },

    upsertDismissState(params: { notificationId: string; userId: string; readAt: string; dismissedAt: string }) {
      return client.from("notification_user_state").upsert(
        {
          notification_id: params.notificationId,
          user_id: params.userId,
          read_at: params.readAt,
          dismissed_at: params.dismissedAt
        },
        { onConflict: "notification_id,user_id" }
      );
    }
  };
}
