import { NextRequest, NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/auth";
import { AdminHttpError, parsePagination, withAdminErrorHandling } from "@/lib/admin/http";
import { createAdminNotification, listAdminNotifications } from "@/lib/admin/notifications.service";
import { adminNotificationCreateSchema } from "@/lib/admin/validation";

export const GET = withAdminErrorHandling(async (request: NextRequest) => {
  await requireAdminApiPermission("notifications.manage");
  const { page, pageSize, q } = parsePagination(new URL(request.url));
  const payload = await listAdminNotifications({ page, pageSize, q });
  return NextResponse.json(payload);
});

export const POST = withAdminErrorHandling(async (request: NextRequest) => {
  const actor = await requireAdminApiPermission("notifications.manage");
  const body = await request.json();
  const parsed = adminNotificationCreateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid notification payload", parsed.error.flatten());

  const payload = await createAdminNotification(actor, parsed.data);
  return NextResponse.json(payload, { status: 201 });
});
