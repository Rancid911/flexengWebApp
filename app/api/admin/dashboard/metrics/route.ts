import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import type { AdminDashboardMetricsDto } from "@/lib/admin/types";
import { createAdminClient } from "@/lib/supabase/admin";

type MetricsRow = {
  revenue_month: number | string | null;
  new_payments_7d: number | string | null;
  active_students_7d: number | string | null;
  active_teachers_7d: number | string | null;
  avg_check_month: number | string | null;
  currency: string | null;
};

function toNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export const GET = withAdminErrorHandling(async () => {
  await requireStaffAdminApi();
  const loadMetrics = unstable_cache(
    async (): Promise<AdminDashboardMetricsDto> => {
      const supabase = createAdminClient();
      const { data, error } = await supabase.rpc("admin_dashboard_metrics", {
        period_anchor: new Date().toISOString()
      });
      if (error) {
        throw new AdminHttpError(500, "DASHBOARD_METRICS_FETCH_FAILED", "Failed to fetch admin dashboard metrics", error.message);
      }

      const row = (Array.isArray(data) ? (data[0] as MetricsRow | undefined) : undefined) ?? null;
      return {
        revenue_month: toNumber(row?.revenue_month),
        new_payments_7d: toNumber(row?.new_payments_7d),
        active_students_7d: toNumber(row?.active_students_7d),
        active_teachers_7d: toNumber(row?.active_teachers_7d),
        avg_check_month: toNumber(row?.avg_check_month),
        currency: row?.currency?.trim() ? row.currency : "RUB"
      };
    },
    ["admin-dashboard-metrics"],
    { revalidate: 60, tags: ["admin-dashboard-metrics"] }
  );

  const payload = await loadMetrics();

  return NextResponse.json(payload);
});
