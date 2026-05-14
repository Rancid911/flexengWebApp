import { NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { getCrmUnreadNewRequestsCount } from "@/lib/crm/queries";
import { requirePermission } from "@/lib/permissions";

export const GET = withAdminErrorHandling(async () => {
  const actor = await requireStaffAdminApi();
  requirePermission(actor, "crm.leads.read");
  try {
    return NextResponse.json({ unreadCount: await getCrmUnreadNewRequestsCount() });
  } catch (error) {
    throw new AdminHttpError(500, "CRM_UNREAD_SUMMARY_FAILED", "Failed to fetch CRM unread summary", error instanceof Error ? error.message : error);
  }
});
