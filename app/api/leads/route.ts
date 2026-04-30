import { NextRequest, NextResponse } from "next/server";

import { createPublicCrmLead } from "@/lib/crm/public-leads.service";
import { publicLeadCreateSchema } from "@/lib/crm/validation";
import { validationError, withApiErrorHandling } from "@/lib/server/http";

export const POST = withApiErrorHandling(async (request: NextRequest) => {
  const body = await request.json().catch(() => null);
  const parsed = publicLeadCreateSchema.safeParse(body);

  if (!parsed.success) {
    throw validationError("Invalid lead payload", parsed.error.flatten());
  }

  return NextResponse.json(await createPublicCrmLead(parsed.data), { status: 201 });
});
