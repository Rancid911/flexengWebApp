import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { deleteAdminUser, updateAdminUser } from "@/lib/admin/user-service";
import { adminUserUpdateSchema } from "@/lib/admin/validation";

export const PATCH = withAdminErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireStaffAdminApi();
  const { id } = await params;

  const body = await request.json();
  if (body && typeof body === "object" && "role" in body) {
    throw new AdminHttpError(400, "ROLE_IMMUTABLE", "Role can only be set on create");
  }

  const parsed = adminUserUpdateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid user payload", parsed.error.flatten());

  return NextResponse.json(await updateAdminUser(actor, id, parsed.data));
});

export const DELETE = withAdminErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireStaffAdminApi();
  const { id } = await params;

  await deleteAdminUser(actor, id);

  return NextResponse.json({ ok: true });
});
