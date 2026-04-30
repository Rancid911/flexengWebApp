import { NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { withAdminErrorHandling } from "@/lib/admin/http";
import { loadTeacherOptions } from "@/lib/admin/users";
import { createAdminClient } from "@/lib/supabase/admin";

export const GET = withAdminErrorHandling(async () => {
  await requireStaffAdminApi();
  const supabase = createAdminClient();
  const items = await loadTeacherOptions(supabase);
  return NextResponse.json(items);
});
