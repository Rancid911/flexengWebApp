import { NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { loadCourseOptions } from "@/lib/admin/course-modules";
import { withAdminErrorHandling } from "@/lib/admin/http";
import { createAdminClient } from "@/lib/supabase/admin";

export const GET = withAdminErrorHandling(async () => {
  await requireStaffAdminApi();
  const supabase = createAdminClient();
  const items = await loadCourseOptions(supabase);
  return NextResponse.json(items);
});
