import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { deleteAdminWordCardSet, getAdminWordCardSet, updateAdminWordCardSet } from "@/lib/admin/word-card-sets.service";
import { adminWordCardSetUpdateSchema } from "@/lib/admin/validation";

export const GET = withAdminErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireStaffAdminApi();
  const { id } = await params;
  return NextResponse.json(await getAdminWordCardSet(id));
});

export const PATCH = withAdminErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireStaffAdminApi();
  const { id } = await params;
  const body = await request.json();
  const parsed = adminWordCardSetUpdateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid word card set payload", parsed.error.flatten());

  return NextResponse.json(await updateAdminWordCardSet(actor, id, parsed.data));
});

export const DELETE = withAdminErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireStaffAdminApi();
  const { id } = await params;
  return NextResponse.json(await deleteAdminWordCardSet(actor, id));
});
