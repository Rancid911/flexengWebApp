import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminApiPermissionMock = vi.fn();
const getAdminDashboardMetricsMock = vi.fn();
const listAdminTeacherOptionsMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  requireAdminApiPermission: async (...args: unknown[]) => {
    const actor = await requireAdminApiPermissionMock(...args);
    const permission = args[0];
    if (actor?.role === "teacher" || (actor?.role === "manager" && (permission === "users.manage" || permission === "roles.view"))) {
      throw { status: 403, code: "FORBIDDEN", message: "Permission denied" };
    }
    return actor;
  }
}));

vi.mock("@/lib/admin/dashboard-metrics", () => ({
  getAdminDashboardMetrics: (...args: unknown[]) => getAdminDashboardMetricsMock(...args)
}));

vi.mock("@/lib/admin/user-directory", () => ({
  listAdminTeacherOptions: (...args: unknown[]) => listAdminTeacherOptionsMock(...args)
}));

function resetMocks() {
  requireAdminApiPermissionMock.mockReset();
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

  it("loads dashboard metrics after roles view permission check", async () => {
    requireAdminApiPermissionMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
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
    expect(requireAdminApiPermissionMock).toHaveBeenCalledWith("roles.view");
    expect(getAdminDashboardMetricsMock).toHaveBeenCalledTimes(1);
  });

  it("does not load dashboard metrics for managers", async () => {
    requireAdminApiPermissionMock.mockResolvedValue({ userId: "manager-1", role: "manager" });

    const { GET } = await import("@/app/api/admin/dashboard/metrics/route");
    const response = await GET();

    await expectForbidden(response);
  });

  it("does not load dashboard metrics without roles view permission", async () => {
    requireAdminApiPermissionMock.mockResolvedValue({ userId: "teacher-1", role: "teacher" });

    const { GET } = await import("@/app/api/admin/dashboard/metrics/route");
    const response = await GET();

    await expectForbidden(response);
  });

  it("loads teacher options after admin teachers read permission check", async () => {
    requireAdminApiPermissionMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
    listAdminTeacherOptionsMock.mockResolvedValue([{ id: "teacher-1", name: "Teacher One" }]);

    const { GET } = await import("@/app/api/admin/users/teacher-options/route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(listAdminTeacherOptionsMock).toHaveBeenCalledTimes(1);
  });

  it("does not load teacher options without admin teachers read permission", async () => {
    requireAdminApiPermissionMock.mockResolvedValue({ userId: "teacher-1", role: "teacher" });

    const { GET } = await import("@/app/api/admin/users/teacher-options/route");
    const response = await GET();

    await expectForbidden(response);
  });
});
