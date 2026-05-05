import { NextResponse } from "next/server";

import { markNotificationReadForUser } from "@/lib/notifications/server";
import { withApiErrorHandling } from "@/lib/server/http";

export const POST = withApiErrorHandling(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const payload = await markNotificationReadForUser(id);
  return NextResponse.json(payload);
});
