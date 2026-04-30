import { NextRequest, NextResponse } from "next/server";

import { withAdminErrorHandling } from "@/lib/admin/http";
import { markNotificationReadForUser } from "@/lib/notifications/server";

export const POST = withAdminErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const payload = await markNotificationReadForUser(id);
  return NextResponse.json(payload);
});
