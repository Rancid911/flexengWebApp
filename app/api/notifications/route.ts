import { NextResponse } from "next/server";

import { getAppActor } from "@/lib/auth/request-context";
import { listVisibleNotificationsForUser } from "@/lib/notifications/server";
import { requirePermission } from "@/lib/permissions";
import { HttpError, withApiErrorHandling } from "@/lib/server/http";

export const GET = withApiErrorHandling(async () => {
  const actor = await getAppActor();
  if (!actor) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
  }
  requirePermission(actor, "notifications.user.read");

  const { items, unreadCount } = await listVisibleNotificationsForUser(actor);
  return NextResponse.json({ items, unreadCount });
});
