import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { afterMock } = vi.hoisted(() => ({
  afterMock: vi.fn()
}));

const requireAdminApiPermissionMock = vi.fn();
const listAdminPaymentControlMock = vi.fn();
const getAdminPaymentReminderSettingsMock = vi.fn();
const updateAdminPaymentReminderSettingsMock = vi.fn();
const syncAutomaticPaymentRemindersMock = vi.fn();
const sendStudentPaymentReminderMock = vi.fn();

vi.mock("next/server", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import("next/server");
  return {
    ...actual,
    after: afterMock
  };
});

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

vi.mock("@/lib/admin/payments-control", () => ({
  listAdminPaymentControl: (...args: unknown[]) => listAdminPaymentControlMock(...args),
  getAdminPaymentReminderSettings: (...args: unknown[]) => getAdminPaymentReminderSettingsMock(...args),
  updateAdminPaymentReminderSettings: (...args: unknown[]) => updateAdminPaymentReminderSettingsMock(...args),
  syncAutomaticPaymentReminders: (...args: unknown[]) => syncAutomaticPaymentRemindersMock(...args),
  sendStudentPaymentReminder: (...args: unknown[]) => sendStudentPaymentReminderMock(...args)
}));

function resetMocks() {
  requireAdminApiPermissionMock.mockReset();
  listAdminPaymentControlMock.mockReset();
  getAdminPaymentReminderSettingsMock.mockReset();
  updateAdminPaymentReminderSettingsMock.mockReset();
  syncAutomaticPaymentRemindersMock.mockReset();
  sendStudentPaymentReminderMock.mockReset();
  afterMock.mockReset();
}

function expectNoBillingServicesCalled() {
  expect(listAdminPaymentControlMock).not.toHaveBeenCalled();
  expect(getAdminPaymentReminderSettingsMock).not.toHaveBeenCalled();
  expect(updateAdminPaymentReminderSettingsMock).not.toHaveBeenCalled();
  expect(syncAutomaticPaymentRemindersMock).not.toHaveBeenCalled();
  expect(sendStudentPaymentReminderMock).not.toHaveBeenCalled();
  expect(afterMock).not.toHaveBeenCalled();
}

async function expectForbidden(response: Response) {
  expect(response.status).toBe(403);
  await expect(response.json()).resolves.toMatchObject({
    code: "FORBIDDEN",
    message: "Permission denied"
  });
  expectNoBillingServicesCalled();
}

describe("admin payments control API routes", () => {
  beforeEach(() => {
    vi.resetModules();
    resetMocks();
  });

  it("lists payment control rows after billing read permission check", async () => {
    requireAdminApiPermissionMock.mockResolvedValue({ userId: "manager-1", role: "manager" });
    listAdminPaymentControlMock.mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      pageSize: 5,
      stats: { total: 0, requiresAttention: 0, debt: 0, unconfigured: 0 }
    });

    const { GET } = await import("@/app/api/admin/payments-control/route");
    const response = await GET(new NextRequest("http://localhost/api/admin/payments-control?page=2&pageSize=5"));

    expect(response.status).toBe(200);
    expect(listAdminPaymentControlMock).toHaveBeenCalledTimes(1);
    const url = listAdminPaymentControlMock.mock.calls[0]?.[0] as URL;
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("does not list payment control rows without billing read permission", async () => {
    requireAdminApiPermissionMock.mockResolvedValue({ userId: "teacher-1", role: "teacher" });

    const { GET } = await import("@/app/api/admin/payments-control/route");
    const response = await GET(new NextRequest("http://localhost/api/admin/payments-control"));

    await expectForbidden(response);
  });

  it("reads payment reminder settings after billing read permission check", async () => {
    requireAdminApiPermissionMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
    getAdminPaymentReminderSettingsMock.mockResolvedValue({
      enabled: true,
      threshold_lessons: 1,
      updated_at: "2026-05-08T08:00:00.000Z"
    });

    const { GET } = await import("@/app/api/admin/payment-reminder-settings/route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(getAdminPaymentReminderSettingsMock).toHaveBeenCalledTimes(1);
  });

  it("does not read payment reminder settings without billing read permission", async () => {
    requireAdminApiPermissionMock.mockResolvedValue({ userId: "teacher-1", role: "teacher" });

    const { GET } = await import("@/app/api/admin/payment-reminder-settings/route");
    const response = await GET();

    await expectForbidden(response);
  });

  it("updates reminder settings and schedules sync after reminder management permission check", async () => {
    const actor = { userId: "admin-1", role: "admin" };
    requireAdminApiPermissionMock.mockResolvedValue(actor);
    updateAdminPaymentReminderSettingsMock.mockResolvedValue({
      enabled: false,
      threshold_lessons: 2,
      updated_at: "2026-05-08T08:00:00.000Z"
    });
    syncAutomaticPaymentRemindersMock.mockResolvedValue(undefined);

    const { PATCH } = await import("@/app/api/admin/payment-reminder-settings/route");
    const response = await PATCH(
      new NextRequest("http://localhost/api/admin/payment-reminder-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: false, threshold_lessons: 2.9 })
      })
    );

    expect(response.status).toBe(200);
    expect(updateAdminPaymentReminderSettingsMock).toHaveBeenCalledWith(actor, {
      enabled: false,
      threshold_lessons: 2
    });
    expect(afterMock).toHaveBeenCalledTimes(1);

    const scheduledSync = afterMock.mock.calls[0]?.[0] as (() => Promise<void>) | undefined;
    await scheduledSync?.();

    expect(syncAutomaticPaymentRemindersMock).toHaveBeenCalledWith(actor, {
      enabled: false,
      threshold_lessons: 2
    });
  });

  it("does not parse or update reminder settings without reminder management permission", async () => {
    requireAdminApiPermissionMock.mockResolvedValue({ userId: "teacher-1", role: "teacher" });

    const { PATCH } = await import("@/app/api/admin/payment-reminder-settings/route");
    const response = await PATCH(
      new NextRequest("http://localhost/api/admin/payment-reminder-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: true, threshold_lessons: 1 })
      })
    );

    await expectForbidden(response);
  });

  it("sends a manual reminder after reminder management permission check", async () => {
    const actor = { userId: "manager-1", role: "manager" };
    requireAdminApiPermissionMock.mockResolvedValue(actor);
    sendStudentPaymentReminderMock.mockResolvedValue({ ok: true });

    const { POST } = await import("@/app/api/admin/payments-control/reminders/route");
    const response = await POST(
      new NextRequest("http://localhost/api/admin/payments-control/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: " student-1 " })
      })
    );

    expect(response.status).toBe(200);
    expect(sendStudentPaymentReminderMock).toHaveBeenCalledWith(actor, "student-1");
  });

  it("does not send a manual reminder without reminder management permission", async () => {
    requireAdminApiPermissionMock.mockResolvedValue({ userId: "teacher-1", role: "teacher" });

    const { POST } = await import("@/app/api/admin/payments-control/reminders/route");
    const response = await POST(
      new NextRequest("http://localhost/api/admin/payments-control/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: "student-1" })
      })
    );

    await expectForbidden(response);
  });
});
