import { NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { loadCrmBoard } from "@/lib/crm/queries";
import { requirePermission } from "@/lib/permissions";

export const GET = withAdminErrorHandling(async () => {
  const actor = await requireStaffAdminApi();
  requirePermission(actor, "crm.leads.view");
  try {
    return NextResponse.json(await loadCrmBoard());
  } catch (error) {
    throw new AdminHttpError(500, "CRM_LEADS_FETCH_FAILED", "Failed to fetch CRM leads", error instanceof Error ? error.message : error);
  }
});
