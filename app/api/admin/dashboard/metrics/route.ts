import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/auth";
import { getAdminDashboardMetrics } from "@/lib/admin/dashboard-metrics";
import { withAdminErrorHandling } from "@/lib/admin/http";

export const GET = withAdminErrorHandling(async () => {
  await requireAdminApiPermission("roles.view");
  return NextResponse.json(await getAdminDashboardMetrics());
});
