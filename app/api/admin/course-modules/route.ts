import { NextRequest, NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/auth";
import { createCourseModuleOption } from "@/lib/admin/course-modules";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { adminCourseModuleCreateSchema } from "@/lib/admin/validation";

export const POST = withAdminErrorHandling(async (request: NextRequest) => {
  await requireAdminApiPermission("content.manage");
  const body = await request.json();
  const parsed = adminCourseModuleCreateSchema.safeParse(body);
  if (!parsed.success) {
    throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid course module payload", parsed.error.flatten());
  }

  const item = await createCourseModuleOption(parsed.data);
  return NextResponse.json(item, { status: 201 });
});
