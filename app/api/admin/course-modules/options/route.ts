import { NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { loadCourseModuleOptions } from "@/lib/admin/course-modules";
import { withAdminErrorHandling } from "@/lib/admin/http";
import { requirePermission } from "@/lib/permissions";

export const GET = withAdminErrorHandling(async () => {
  const actor = await requireStaffAdminApi();
  requirePermission(actor, "learning.content.manage");
  const items = await loadCourseModuleOptions();
  return NextResponse.json(items);
});
