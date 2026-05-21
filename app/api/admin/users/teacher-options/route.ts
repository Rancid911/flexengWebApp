import { NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { withAdminErrorHandling } from "@/lib/admin/http";
import { listAdminTeacherOptions } from "@/lib/admin/user-directory";
import { requirePermission } from "@/lib/permissions";

export const GET = withAdminErrorHandling(async () => {
  const actor = await requireStaffAdminApi();
  requirePermission(actor, "teachers.view");
  const items = await listAdminTeacherOptions();
  return NextResponse.json(items);
});
