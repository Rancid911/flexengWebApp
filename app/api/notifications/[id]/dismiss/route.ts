import { NextResponse } from "next/server";

import { getAppActor } from "@/lib/auth/request-context";
import { dismissNotificationForUser } from "@/lib/notifications/server";
import { requirePermission } from "@/lib/permissions";
import { HttpError, withApiErrorHandling } from "@/lib/server/http";

export const POST = withApiErrorHandling(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await getAppActor();
  if (!actor) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
  }
  requirePermission(actor, "notifications.user.manage");

  const { id } = await params;
  const payload = await dismissNotificationForUser(id);
  return NextResponse.json(payload);
});
