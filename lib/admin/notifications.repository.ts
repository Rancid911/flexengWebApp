import { createAdminClient } from "@/lib/supabase/admin";

export type AdminNotificationsRepositoryClient = ReturnType<typeof createAdminClient>;

export const ADMIN_NOTIFICATION_SELECT =
  "id, title, body, type, is_active, target_roles, published_at, expires_at, created_by, created_at, updated_at";

export function createAdminNotificationsRepository(client: AdminNotificationsRepositoryClient = createAdminClient()) {
  return {
    listNotifications(params: { from: number; to: number; q?: string | null }) {
      let query = client
        .from("notifications")
        .select(ADMIN_NOTIFICATION_SELECT, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(params.from, params.to);

      if (params.q) query = query.or(`title.ilike.%${params.q}%,body.ilike.%${params.q}%,type.ilike.%${params.q}%`);
      return query;
    },

    createNotification(payload: Record<string, unknown>) {
      return client.from("notifications").insert(payload).select(ADMIN_NOTIFICATION_SELECT).single();
    },

    loadNotification(id: string) {
      return client.from("notifications").select(ADMIN_NOTIFICATION_SELECT).eq("id", id).maybeSingle();
    },

    updateNotification(id: string, payload: Record<string, unknown>) {
      return client.from("notifications").update(payload).eq("id", id).select(ADMIN_NOTIFICATION_SELECT).single();
    },

    deleteNotification(id: string) {
      return client.from("notifications").delete().eq("id", id);
    }
  };
}
