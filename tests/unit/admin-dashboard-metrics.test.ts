import { describe, expect, it } from "vitest";

import { getAdminDashboardHydrationSafeInitialState } from "@/app/(workspace)/(shared-zone)/dashboard/use-admin-dashboard-metrics";

describe("admin dashboard metrics hydration safety", () => {
  it("uses deterministic defaults for the initial render", () => {
    window.sessionStorage.setItem(
      "admin-dashboard-metrics:session:v1",
      JSON.stringify({
        cachedAt: Date.now(),
        metrics: {
          revenue_month: 999999,
          new_payments_7d: 99,
          active_students_7d: 99,
          active_teachers_7d: 99,
          avg_check_month: 99999,
          currency: "USD"
        }
      })
    );

    expect(getAdminDashboardHydrationSafeInitialState()).toEqual({
      metrics: {
        revenue_month: 0,
        new_payments_7d: 0,
        active_students_7d: 0,
        active_teachers_7d: 0,
        avg_check_month: 0,
        currency: "RUB"
      },
      hasData: false,
      loading: true,
      error: ""
    });
  });
});
