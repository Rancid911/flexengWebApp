import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { AdminHttpError, parsePagination, withAdminErrorHandling } from "@/lib/admin/http";
import { createAdminBlogPost, listAdminBlogPosts } from "@/lib/admin/blog.service";
import { blogPostCreateSchema } from "@/lib/admin/validation";

export const GET = withAdminErrorHandling(async (request: NextRequest) => {
  await requireStaffAdminApi();
  const { page, pageSize, q } = parsePagination(new URL(request.url));
  const payload = await listAdminBlogPosts({ page, pageSize, q });
  return NextResponse.json(payload);
});

export const POST = withAdminErrorHandling(async (request: NextRequest) => {
  const actor = await requireStaffAdminApi();
  const body = await request.json();
  const parsed = blogPostCreateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid blog post payload", parsed.error.flatten());

  const payload = await createAdminBlogPost(actor, parsed.data);
  return NextResponse.json(payload, { status: 201 });
});
