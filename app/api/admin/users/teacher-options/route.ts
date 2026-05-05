import { NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { withAdminErrorHandling } from "@/lib/admin/http";
import { listAdminTeacherOptions } from "@/lib/admin/user-directory";

export const GET = withAdminErrorHandling(async () => {
  await requireStaffAdminApi();
  const items = await listAdminTeacherOptions();
  return NextResponse.json(items);
});
