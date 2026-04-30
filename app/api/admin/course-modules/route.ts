import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { createCourseModuleOption } from "@/lib/admin/course-modules";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { adminCourseModuleCreateSchema } from "@/lib/admin/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export const POST = withAdminErrorHandling(async (request: NextRequest) => {
  await requireStaffAdminApi();
  const supabase = createAdminClient();
  const body = await request.json();
  const parsed = adminCourseModuleCreateSchema.safeParse(body);
  if (!parsed.success) {
    throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid course module payload", parsed.error.flatten());
  }

  const item = await createCourseModuleOption(supabase, parsed.data);
  return NextResponse.json(item, { status: 201 });
});
