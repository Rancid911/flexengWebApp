import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminHttpError } from "@/lib/admin/http";

const markNotificationReadForUserMock = vi.fn();
const dismissNotificationForUserMock = vi.fn();
const getUnreadNotificationsSummaryForUserMock = vi.fn();

vi.mock("@/lib/notifications/server", () => ({
  markNotificationReadForUser: (id: string) => markNotificationReadForUserMock(id),
  dismissNotificationForUser: (id: string) => dismissNotificationForUserMock(id),
  getUnreadNotificationsSummaryForUser: () => getUnreadNotificationsSummaryForUserMock()
}));

describe("notification self-service routes", () => {
  beforeEach(() => {
    vi.resetModules();
    markNotificationReadForUserMock.mockReset();
    dismissNotificationForUserMock.mockReset();
    getUnreadNotificationsSummaryForUserMock.mockReset();
  });

  it("returns lightweight unread summary for the bell badge", async () => {
    getUnreadNotificationsSummaryForUserMock.mockResolvedValue({ unreadCount: 33 });

    const { GET } = await import("@/app/api/notifications/unread-summary/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ unreadCount: 33 });
  });

  it("marks a visible notification as read through the notification service", async () => {
    markNotificationReadForUserMock.mockResolvedValue({ ok: true });

    const { POST } = await import("@/app/api/notifications/[id]/read/route");
    const response = await POST({} as never, { params: Promise.resolve({ id: "notif-1" }) });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(markNotificationReadForUserMock).toHaveBeenCalledWith("notif-1");
  });

  it("dismisses a visible notification through the notification service", async () => {
    dismissNotificationForUserMock.mockResolvedValue({ ok: true });

    const { POST } = await import("@/app/api/notifications/[id]/dismiss/route");
    const response = await POST({} as never, { params: Promise.resolve({ id: "notif-1" }) });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(dismissNotificationForUserMock).toHaveBeenCalledWith("notif-1");
  });

  it("returns not found when the notification service reports an invisible notification", async () => {
    markNotificationReadForUserMock.mockRejectedValue(new AdminHttpError(404, "NOTIFICATION_NOT_FOUND", "Notification not found"));

    const { POST } = await import("@/app/api/notifications/[id]/read/route");
    const response = await POST({} as never, { params: Promise.resolve({ id: "notif-missing" }) });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: "NOTIFICATION_NOT_FOUND"
    });
  });
});
