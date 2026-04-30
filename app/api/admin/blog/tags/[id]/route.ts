import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { deleteAdminBlogTag, updateAdminBlogTag } from "@/lib/admin/blog.service";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { blogTagUpdateSchema } from "@/lib/admin/validation";

export const PATCH = withAdminErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireStaffAdminApi();
  const { id } = await params;
  const body = await request.json();
  const parsed = blogTagUpdateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid tag payload", parsed.error.flatten());

  const payload = await updateAdminBlogTag(actor, id, parsed.data);
  return NextResponse.json(payload);
});

export const DELETE = withAdminErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireStaffAdminApi();
  const { id } = await params;
  const payload = await deleteAdminBlogTag(actor, id);
  return NextResponse.json(payload);
});
