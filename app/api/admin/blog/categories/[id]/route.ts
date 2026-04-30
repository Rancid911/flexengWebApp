import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { deleteAdminBlogCategory, updateAdminBlogCategory } from "@/lib/admin/blog.service";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { blogCategoryUpdateSchema } from "@/lib/admin/validation";

export const PATCH = withAdminErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireStaffAdminApi();
  const { id } = await params;
  const body = await request.json();
  const parsed = blogCategoryUpdateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid category payload", parsed.error.flatten());

  const payload = await updateAdminBlogCategory(actor, id, parsed.data);
  return NextResponse.json(payload);
});

export const DELETE = withAdminErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireStaffAdminApi();
  const { id } = await params;
  const payload = await deleteAdminBlogCategory(actor, id);
  return NextResponse.json(payload);
});
