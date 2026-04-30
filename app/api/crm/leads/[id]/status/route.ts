import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { updateCrmLeadStatus } from "@/lib/crm/queries";
import { isCrmLeadStatus } from "@/lib/crm/stages";
import { crmLeadStatusUpdateSchema } from "@/lib/crm/validation";

export const PATCH = withAdminErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireStaffAdminApi();
  const { id } = await params;
  const body = await request.json();
  const parsed = crmLeadStatusUpdateSchema.safeParse(body);
  if (!parsed.success || !isCrmLeadStatus(parsed.data.status)) {
    throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid lead status payload", parsed.success ? undefined : parsed.error.flatten());
  }

  const detail = await updateCrmLeadStatus({ leadId: id, status: parsed.data.status, actorUserId: actor.userId });
  if (!detail) throw new AdminHttpError(404, "CRM_LEAD_NOT_FOUND", "Lead not found");
  return NextResponse.json(detail);
});
