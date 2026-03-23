import { NextResponse } from "next/server";

import { withAdminErrorHandling } from "@/lib/admin/http";
import { listVisibleNotificationsForUser } from "@/lib/notifications/server";

export const GET = withAdminErrorHandling(async () => {
  const { items } = await listVisibleNotificationsForUser();
  return NextResponse.json({ items });
});
