import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/auth";
import { withAdminErrorHandling } from "@/lib/admin/http";
import { listAdminTeacherOptions } from "@/lib/admin/user-directory";

export const GET = withAdminErrorHandling(async () => {
  await requireAdminApiPermission("teachers.view");
  const items = await listAdminTeacherOptions();
  return NextResponse.json(items);
});
