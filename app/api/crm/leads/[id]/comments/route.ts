import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { createCrmLeadComment } from "@/lib/crm/queries";
import { crmLeadCommentCreateSchema } from "@/lib/crm/validation";

export const POST = withAdminErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireStaffAdminApi();
  const { id } = await params;
  const body = await request.json();
  const parsed = crmLeadCommentCreateSchema.safeParse(body);
  if (!parsed.success) {
    throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid lead comment payload", parsed.error.flatten());
  }

  const detail = await createCrmLeadComment({ leadId: id, body: parsed.data.body, actorUserId: actor.userId });
  if (!detail) throw new AdminHttpError(404, "CRM_LEAD_NOT_FOUND", "Lead not found");
  return NextResponse.json(detail, { status: 201 });
});
