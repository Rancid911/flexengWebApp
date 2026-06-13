import { render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAdminDashboardHydrationSafeInitialState, useAdminDashboardMetrics } from "@/features/dashboard/client/use-admin-dashboard-metrics";
import type { AdminDashboardMetricsDto } from "@/lib/admin/types";
import { clearRuntimeCache } from "@/lib/session-runtime-cache";

const seededMetrics: AdminDashboardMetricsDto = {
  revenue_month: 123456,
  new_payments_7d: 7,
  active_students_7d: 12,
  active_teachers_7d: 3,
  avg_check_month: 4567,
  currency: "RUB"
};

function AdminDashboardMetricsProbe({ initialMetrics = null }: { initialMetrics?: AdminDashboardMetricsDto | null }) {
  const { metrics, hasData, loading, error } = useAdminDashboardMetrics(initialMetrics);

  return createElement(
    "div",
    null,
    createElement("span", { "data-testid": "revenue" }, metrics.revenue_month),
    createElement("span", { "data-testid": "has-data" }, hasData ? "true" : "false"),
    createElement("span", { "data-testid": "loading" }, loading ? "true" : "false"),
    createElement("span", { "data-testid": "error" }, error)
  );
}

describe("admin dashboard metrics hydration safety", () => {
  beforeEach(() => {
    clearRuntimeCache();
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it("can start from server-provided metrics without reading session storage during initial state", () => {
    const getItemSpy = vi.spyOn(window.sessionStorage.__proto__, "getItem");

    expect(getAdminDashboardHydrationSafeInitialState(seededMetrics)).toEqual({
      metrics: seededMetrics,
      hasData: true,
      loading: false,
      error: ""
    });
    expect(getItemSpy).not.toHaveBeenCalled();
  });

  it("does not fetch dashboard metrics when server-provided metrics exist", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ revenue_month: 999 })
    } as Response);

    render(createElement(AdminDashboardMetricsProbe, { initialMetrics: seededMetrics }));

    expect(screen.getByTestId("revenue")).toHaveTextContent("123456");
    expect(screen.getByTestId("has-data")).toHaveTextContent("true");
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    await waitFor(() => expect(window.sessionStorage.getItem("admin-dashboard-metrics:session:v1")).toContain("123456"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to the metrics API when no server metrics or cache exists", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => seededMetrics
    } as Response);

    render(createElement(AdminDashboardMetricsProbe));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith("/api/admin/dashboard/metrics", expect.objectContaining({ cache: "no-store" })));
    await waitFor(() => expect(screen.getByTestId("revenue")).toHaveTextContent("123456"));
    expect(screen.getByTestId("has-data")).toHaveTextContent("true");
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
  });
});
