import { beforeEach, describe, expect, it, vi } from "vitest";

const requireStaffAdminApiMock = vi.fn();
const getAdminDashboardMetricsMock = vi.fn();
const listAdminTeacherOptionsMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  requireStaffAdminApi: () => requireStaffAdminApiMock()
}));

vi.mock("@/lib/admin/dashboard-metrics", () => ({
  getAdminDashboardMetrics: (...args: unknown[]) => getAdminDashboardMetricsMock(...args)
}));

vi.mock("@/lib/admin/user-directory", () => ({
  listAdminTeacherOptions: (...args: unknown[]) => listAdminTeacherOptionsMock(...args)
}));

function resetMocks() {
  requireStaffAdminApiMock.mockReset();
  getAdminDashboardMetricsMock.mockReset();
  listAdminTeacherOptionsMock.mockReset();
}

function expectNoReadHelperServicesCalled() {
  expect(getAdminDashboardMetricsMock).not.toHaveBeenCalled();
  expect(listAdminTeacherOptionsMock).not.toHaveBeenCalled();
}

async function expectForbidden(response: Response) {
  expect(response.status).toBe(403);
  await expect(response.json()).resolves.toMatchObject({
    code: "FORBIDDEN",
    message: "Permission denied"
  });
  expectNoReadHelperServicesCalled();
}

describe("admin read helper API routes", () => {
  beforeEach(() => {
    vi.resetModules();
    resetMocks();
  });

  it("loads dashboard metrics after admin dashboard read permission check", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
    getAdminDashboardMetricsMock.mockResolvedValue({
      revenue_month: 120000,
      new_payments_7d: 4,
      active_students_7d: 12,
      active_teachers_7d: 3,
      avg_check_month: 30000,
      currency: "RUB"
    });

    const { GET } = await import("@/app/api/admin/dashboard/metrics/route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(getAdminDashboardMetricsMock).toHaveBeenCalledTimes(1);
  });

  it("does not load dashboard metrics for managers", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "manager-1", role: "manager" });

    const { GET } = await import("@/app/api/admin/dashboard/metrics/route");
    const response = await GET();

    await expectForbidden(response);
  });

  it("does not load dashboard metrics without admin dashboard read permission", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "teacher-1", role: "teacher" });

    const { GET } = await import("@/app/api/admin/dashboard/metrics/route");
    const response = await GET();

    await expectForbidden(response);
  });

  it("loads teacher options after admin teachers read permission check", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
    listAdminTeacherOptionsMock.mockResolvedValue([{ id: "teacher-1", name: "Teacher One" }]);

    const { GET } = await import("@/app/api/admin/users/teacher-options/route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(listAdminTeacherOptionsMock).toHaveBeenCalledTimes(1);
  });

  it("does not load teacher options without admin teachers read permission", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "teacher-1", role: "teacher" });

    const { GET } = await import("@/app/api/admin/users/teacher-options/route");
    const response = await GET();

    await expectForbidden(response);
  });
});
