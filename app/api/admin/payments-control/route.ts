import { NextRequest, NextResponse } from "next/server";

import { withAdminErrorHandling } from "@/lib/admin/http";
import { requireStaffAdminApi } from "@/lib/admin/auth";
import { listAdminPaymentControl } from "@/lib/admin/payments-control";
import { measureServerTiming } from "@/lib/server/timing";

export const GET = withAdminErrorHandling(async (request: NextRequest) => {
  await requireStaffAdminApi();
  const payload = await measureServerTiming("admin-payments-route", async () => listAdminPaymentControl(new URL(request.url)));
  return NextResponse.json(payload);
});
