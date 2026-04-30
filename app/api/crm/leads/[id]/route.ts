import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { deleteCrmLead, loadCrmLeadDetail, markCrmLeadViewed } from "@/lib/crm/queries";

export const GET = withAdminErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireStaffAdminApi();
  const { id } = await params;
  let detail = await loadCrmLeadDetail(id);
  if (!detail) throw new AdminHttpError(404, "CRM_LEAD_NOT_FOUND", "Lead not found");
  if (!detail.viewed_at) {
    await markCrmLeadViewed(id, actor.userId);
    detail = await loadCrmLeadDetail(id);
    if (!detail) throw new AdminHttpError(404, "CRM_LEAD_NOT_FOUND", "Lead not found");
  }
  return NextResponse.json(detail);
});

export const DELETE = withAdminErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireStaffAdminApi();
  const { id } = await params;
  const deleted = await deleteCrmLead(id);
  if (!deleted) throw new AdminHttpError(404, "CRM_LEAD_NOT_FOUND", "Lead not found");
  return NextResponse.json({ ok: true, id });
});
