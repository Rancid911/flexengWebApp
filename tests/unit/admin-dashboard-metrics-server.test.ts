import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
}));

describe("admin dashboard metrics server loader", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("loads metrics through the user-scoped RPC client", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: [
        {
          revenue_month: "120000.50",
          new_payments_7d: "4",
          active_students_7d: "12",
          active_teachers_7d: "3",
          avg_check_month: "30000.13",
          currency: "RUB"
        }
      ],
      error: null
    });
    createClientMock.mockResolvedValue({ rpc: rpcMock });

    const { getAdminDashboardMetrics } = await import("@/lib/admin/dashboard-metrics");
    const result = await getAdminDashboardMetrics();

    expect(rpcMock).toHaveBeenCalledWith("admin_dashboard_metrics", {
      period_anchor: expect.any(String)
    });
    expect(result).toEqual({
      revenue_month: 120000.5,
      new_payments_7d: 4,
      active_students_7d: 12,
      active_teachers_7d: 3,
      avg_check_month: 30000.13,
      currency: "RUB"
    });
  });

  it("throws the existing admin error when the RPC fails", async () => {
    createClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "permission denied" }
      })
    });

    const { getAdminDashboardMetrics } = await import("@/lib/admin/dashboard-metrics");

    await expect(getAdminDashboardMetrics()).rejects.toMatchObject({
      code: "DASHBOARD_METRICS_FETCH_FAILED",
      message: "Failed to fetch admin dashboard metrics"
    });
  });
});
