import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/auth";
import { loadCourseModuleOptions } from "@/lib/admin/course-modules";
import { withAdminErrorHandling } from "@/lib/admin/http";

export const GET = withAdminErrorHandling(async () => {
  await requireAdminApiPermission("content.manage");
  const items = await loadCourseModuleOptions();
  return NextResponse.json(items);
});
