import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { AdminHttpError, parsePagination, withAdminErrorHandling } from "@/lib/admin/http";
import { createAdminTest, listAdminTestMaterials } from "@/lib/admin/tests.service";
import { adminTestCreateSchema } from "@/lib/admin/validation";
import { requirePermission } from "@/lib/permissions";

export const GET = withAdminErrorHandling(async (request: NextRequest) => {
  const actor = await requireStaffAdminApi();
  requirePermission(actor, "learning.tests.manage");
  const result = await listAdminTestMaterials(parsePagination(new URL(request.url)));
  return NextResponse.json(result);
});

export const POST = withAdminErrorHandling(async (request: NextRequest) => {
  const actor = await requireStaffAdminApi();
  requirePermission(actor, "learning.tests.manage");
  const body = await request.json();
  const parsed = adminTestCreateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid test payload", parsed.error.flatten());

  const result = await createAdminTest(actor, parsed.data);
  return NextResponse.json(result, { status: 201 });
});
