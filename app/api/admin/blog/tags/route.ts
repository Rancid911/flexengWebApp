import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { createAdminBlogTag, listAdminBlogTags } from "@/lib/admin/blog.service";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { blogTagCreateSchema } from "@/lib/admin/validation";

export const GET = withAdminErrorHandling(async () => {
  await requireStaffAdminApi();
  const payload = await listAdminBlogTags();
  return NextResponse.json(payload);
});

export const POST = withAdminErrorHandling(async (request: NextRequest) => {
  const actor = await requireStaffAdminApi();
  const body = await request.json();
  const parsed = blogTagCreateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid tag payload", parsed.error.flatten());

  const payload = await createAdminBlogTag(actor, parsed.data);
  return NextResponse.json(payload, { status: 201 });
});
