import { NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { loadCourseOptions } from "@/lib/admin/course-modules";
import { withAdminErrorHandling } from "@/lib/admin/http";

export const GET = withAdminErrorHandling(async () => {
  await requireStaffAdminApi();
  const items = await loadCourseOptions();
  return NextResponse.json(items);
});
