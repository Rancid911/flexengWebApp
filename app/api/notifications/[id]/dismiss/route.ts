import { NextRequest, NextResponse } from "next/server";

import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { getAuthedSupabase } from "@/lib/notifications/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const POST = withAdminErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { userId } = await getAuthedSupabase();
  const supabase = createAdminClient();

  const nowIso = new Date().toISOString();
  const { data: notification, error: notificationError } = await supabase.from("notifications").select("id").eq("id", id).maybeSingle();
  if (notificationError) throw new AdminHttpError(500, "NOTIFICATION_DISMISS_FAILED", "Failed to access notification", notificationError.message);
  if (!notification) throw new AdminHttpError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");

  const { error: stateError } = await supabase.from("notification_user_state").upsert(
    {
      notification_id: id,
      user_id: userId,
      read_at: nowIso,
      dismissed_at: nowIso
    },
    { onConflict: "notification_id,user_id" }
  );
  if (stateError) throw new AdminHttpError(500, "NOTIFICATION_DISMISS_FAILED", "Failed to dismiss notification", stateError.message);

  return NextResponse.json({ ok: true });
});
