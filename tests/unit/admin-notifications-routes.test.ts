import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireStaffAdminApiMock = vi.fn();
const listAdminNotificationsMock = vi.fn();
const createAdminNotificationMock = vi.fn();
const updateAdminNotificationMock = vi.fn();
const deleteAdminNotificationMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  requireStaffAdminApi: () => requireStaffAdminApiMock()
}));

vi.mock("@/lib/admin/notifications.service", () => ({
  listAdminNotifications: (...args: unknown[]) => listAdminNotificationsMock(...args),
  createAdminNotification: (...args: unknown[]) => createAdminNotificationMock(...args),
  updateAdminNotification: (...args: unknown[]) => updateAdminNotificationMock(...args),
  deleteAdminNotification: (...args: unknown[]) => deleteAdminNotificationMock(...args)
}));

function resetMocks() {
  requireStaffAdminApiMock.mockReset();
  listAdminNotificationsMock.mockReset();
  createAdminNotificationMock.mockReset();
  updateAdminNotificationMock.mockReset();
  deleteAdminNotificationMock.mockReset();
}

function expectNoNotificationServicesCalled() {
  expect(listAdminNotificationsMock).not.toHaveBeenCalled();
  expect(createAdminNotificationMock).not.toHaveBeenCalled();
  expect(updateAdminNotificationMock).not.toHaveBeenCalled();
  expect(deleteAdminNotificationMock).not.toHaveBeenCalled();
}

async function expectForbidden(response: Response) {
  expect(response.status).toBe(403);
  await expect(response.json()).resolves.toMatchObject({
    code: "FORBIDDEN",
    message: "Permission denied"
  });
  expectNoNotificationServicesCalled();
}

function makeNotificationPayload() {
  return {
    title: "Service update",
    body: "Maintenance starts tonight.",
    type: "maintenance",
    is_active: true,
    target_roles: ["all"],
    published_at: "2026-05-08T08:00:00.000Z",
    expires_at: "2026-05-09T08:00:00.000Z"
  };
}

describe("admin notifications API routes", () => {
  beforeEach(() => {
    vi.resetModules();
    resetMocks();
  });

  it("lists notifications after notification read permission check", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "manager-1", role: "manager" });
    listAdminNotificationsMock.mockResolvedValue({ items: [], total: 0, page: 2, pageSize: 10 });

    const { GET } = await import("@/app/api/admin/notifications/route");
    const response = await GET(new NextRequest("http://localhost/api/admin/notifications?page=2&pageSize=10&q=service"));

    expect(response.status).toBe(200);
    expect(listAdminNotificationsMock).toHaveBeenCalledWith({ page: 2, pageSize: 10, q: "service" });
  });

  it("does not list notifications without notification read permission", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "teacher-1", role: "teacher" });

    const { GET } = await import("@/app/api/admin/notifications/route");
    const response = await GET(new NextRequest("http://localhost/api/admin/notifications"));

    await expectForbidden(response);
  });

  it("creates notifications after notification management permission check", async () => {
    const actor = { userId: "admin-1", role: "admin" };
    const payload = makeNotificationPayload();
    requireStaffAdminApiMock.mockResolvedValue(actor);
    createAdminNotificationMock.mockResolvedValue({ id: "notification-1", ...payload });

    const { POST } = await import("@/app/api/admin/notifications/route");
    const response = await POST(
      new NextRequest("http://localhost/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
    );

    expect(response.status).toBe(201);
    expect(createAdminNotificationMock).toHaveBeenCalledWith(actor, payload);
  });

  it("does not parse or create notifications without notification management permission", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "teacher-1", role: "teacher" });

    const { POST } = await import("@/app/api/admin/notifications/route");
    const response = await POST(
      new NextRequest("http://localhost/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(makeNotificationPayload())
      })
    );

    await expectForbidden(response);
  });

  it("updates notifications after notification management permission check", async () => {
    const actor = { userId: "manager-1", role: "manager" };
    requireStaffAdminApiMock.mockResolvedValue(actor);
    updateAdminNotificationMock.mockResolvedValue({ id: "notification-1", title: "Updated" });

    const { PATCH } = await import("@/app/api/admin/notifications/[id]/route");
    const response = await PATCH(
      new NextRequest("http://localhost/api/admin/notifications/notification-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated" })
      }),
      { params: Promise.resolve({ id: "notification-1" }) }
    );

    expect(response.status).toBe(200);
    expect(updateAdminNotificationMock).toHaveBeenCalledWith(actor, "notification-1", { title: "Updated" });
  });

  it("does not parse or update notifications without notification management permission", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "teacher-1", role: "teacher" });

    const { PATCH } = await import("@/app/api/admin/notifications/[id]/route");
    const response = await PATCH(
      new NextRequest("http://localhost/api/admin/notifications/notification-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated" })
      }),
      { params: Promise.resolve({ id: "notification-1" }) }
    );

    await expectForbidden(response);
  });

  it("deletes notifications after notification management permission check", async () => {
    const actor = { userId: "admin-1", role: "admin" };
    requireStaffAdminApiMock.mockResolvedValue(actor);
    deleteAdminNotificationMock.mockResolvedValue({ ok: true });

    const { DELETE } = await import("@/app/api/admin/notifications/[id]/route");
    const response = await DELETE(new NextRequest("http://localhost/api/admin/notifications/notification-1", { method: "DELETE" }), {
      params: Promise.resolve({ id: "notification-1" })
    });

    expect(response.status).toBe(200);
    expect(deleteAdminNotificationMock).toHaveBeenCalledWith(actor, "notification-1");
  });

  it("does not delete notifications without notification management permission", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "teacher-1", role: "teacher" });

    const { DELETE } = await import("@/app/api/admin/notifications/[id]/route");
    const response = await DELETE(new NextRequest("http://localhost/api/admin/notifications/notification-1", { method: "DELETE" }), {
      params: Promise.resolve({ id: "notification-1" })
    });

    await expectForbidden(response);
  });
});
