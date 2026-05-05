import { NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { getAdminDashboardMetrics } from "@/lib/admin/dashboard-metrics";
import { withAdminErrorHandling } from "@/lib/admin/http";

export const GET = withAdminErrorHandling(async () => {
  await requireStaffAdminApi();
  return NextResponse.json(await getAdminDashboardMetrics());
});
