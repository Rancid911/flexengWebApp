import { NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { getAdminDashboardMetrics } from "@/lib/admin/dashboard-metrics";
import { withAdminErrorHandling } from "@/lib/admin/http";
import { requirePermission } from "@/lib/permissions";

export const GET = withAdminErrorHandling(async () => {
  const actor = await requireStaffAdminApi();
  requirePermission(actor, "admin.dashboard.read");
  return NextResponse.json(await getAdminDashboardMetrics());
});
