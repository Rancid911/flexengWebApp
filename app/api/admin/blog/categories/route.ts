import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { createAdminBlogCategory, listAdminBlogCategories } from "@/lib/admin/blog.service";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { blogCategoryCreateSchema } from "@/lib/admin/validation";

export const GET = withAdminErrorHandling(async () => {
  await requireStaffAdminApi();
  const payload = await listAdminBlogCategories();
  return NextResponse.json(payload);
});

export const POST = withAdminErrorHandling(async (request: NextRequest) => {
  const actor = await requireStaffAdminApi();
  const body = await request.json();
  const parsed = blogCategoryCreateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid category payload", parsed.error.flatten());

  const payload = await createAdminBlogCategory(actor, parsed.data);
  return NextResponse.json(payload, { status: 201 });
});
