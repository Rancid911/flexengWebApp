import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, createRepositoryMock, writeAuditMock, repository } = vi.hoisted(() => {
  const repository = {
    listNotifications: vi.fn(),
    createNotification: vi.fn(),
    loadNotification: vi.fn(),
    updateNotification: vi.fn(),
    deleteNotification: vi.fn()
  };

  return {
    createClientMock: vi.fn(),
    createRepositoryMock: vi.fn(() => repository),
    writeAuditMock: vi.fn(),
    repository
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
}));

vi.mock("@/lib/admin/notifications.repository", () => ({
  createAdminNotificationsRepository: (...args: unknown[]) => createRepositoryMock(...args)
}));

vi.mock("@/lib/admin/audit", () => ({
  writeAudit: (...args: unknown[]) => writeAuditMock(...args)
}));

function makeNotificationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "notification-1",
    title: "Service update",
    body: "Maintenance starts tonight.",
    type: "maintenance",
    is_active: true,
    target_roles: ["all"],
    published_at: "2026-05-08T08:00:00.000Z",
    expires_at: null,
    created_by: "admin-1",
    created_at: "2026-05-08T07:00:00.000Z",
    updated_at: "2026-05-08T07:00:00.000Z",
    ...overrides
  };
}

describe("admin notifications service", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    createRepositoryMock.mockClear();
    writeAuditMock.mockReset();
    repository.listNotifications.mockReset();
    repository.createNotification.mockReset();
    repository.loadNotification.mockReset();
    repository.updateNotification.mockReset();
    repository.deleteNotification.mockReset();
  });

  it("lists notifications through an injected user-scoped repository client", async () => {
    const userClient = { from: vi.fn() };
    createClientMock.mockResolvedValue(userClient);
    repository.listNotifications.mockResolvedValue({
      data: [makeNotificationRow()],
      error: null,
      count: 1
    });

    const { listAdminNotifications } = await import("@/lib/admin/notifications.service");
    const result = await listAdminNotifications({ page: 1, pageSize: 20, q: "service" });

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createRepositoryMock).toHaveBeenCalledWith(userClient);
    expect(repository.listNotifications).toHaveBeenCalledWith({ from: 0, to: 19, q: "service" });
    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({ id: "notification-1", title: "Service update" });
  });

  it("creates notifications through the user-scoped repository and keeps audit writes", async () => {
    const userClient = { from: vi.fn() };
    createClientMock.mockResolvedValue(userClient);
    repository.createNotification.mockResolvedValue({
      data: makeNotificationRow(),
      error: null
    });

    const { createAdminNotification } = await import("@/lib/admin/notifications.service");
    const result = await createAdminNotification(
      { userId: "admin-1", role: "admin" },
      {
        title: "Service update",
        body: "Maintenance starts tonight.",
        type: "maintenance",
        is_active: true,
        target_roles: ["all"],
        published_at: "2026-05-08T08:00:00.000Z",
        expires_at: null
      }
    );

    expect(createRepositoryMock).toHaveBeenCalledWith(userClient);
    expect(repository.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Service update",
        created_by: "admin-1"
      })
    );
    expect(writeAuditMock).toHaveBeenCalledWith(expect.objectContaining({ action: "create", entity: "notifications" }));
    expect(result.id).toBe("notification-1");
  });
});
