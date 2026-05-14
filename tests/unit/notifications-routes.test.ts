import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminHttpError } from "@/lib/admin/http";

const markNotificationReadForUserMock = vi.fn();
const dismissNotificationForUserMock = vi.fn();
const getUnreadNotificationsSummaryForUserMock = vi.fn();
const listVisibleNotificationsForUserMock = vi.fn();
const getAppActorMock = vi.fn();

vi.mock("@/lib/auth/request-context", () => ({
  getAppActor: () => getAppActorMock()
}));

vi.mock("@/lib/notifications/server", () => ({
  listVisibleNotificationsForUser: () => listVisibleNotificationsForUserMock(),
  markNotificationReadForUser: (id: string) => markNotificationReadForUserMock(id),
  dismissNotificationForUser: (id: string) => dismissNotificationForUserMock(id),
  getUnreadNotificationsSummaryForUser: () => getUnreadNotificationsSummaryForUserMock()
}));

describe("notification self-service routes", () => {
  beforeEach(() => {
    vi.resetModules();
    getAppActorMock.mockReset();
    getAppActorMock.mockResolvedValue({ userId: "student-profile-1", role: "student", isStudent: true });
    listVisibleNotificationsForUserMock.mockReset();
    markNotificationReadForUserMock.mockReset();
    dismissNotificationForUserMock.mockReset();
    getUnreadNotificationsSummaryForUserMock.mockReset();
  });

  it("lists visible notifications for the current actor", async () => {
    listVisibleNotificationsForUserMock.mockResolvedValue({
      items: [{ id: "notif-1", title: "A", body: "B", type: "update", is_read: false }],
      unreadCount: 1
    });

    const { GET } = await import("@/app/api/notifications/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [{ id: "notif-1", title: "A", body: "B", type: "update", is_read: false }],
      unreadCount: 1
    });
    expect(listVisibleNotificationsForUserMock).toHaveBeenCalledTimes(1);
  });

  it("returns lightweight unread summary for the bell badge", async () => {
    getUnreadNotificationsSummaryForUserMock.mockResolvedValue({ unreadCount: 33 });

    const { GET } = await import("@/app/api/notifications/unread-summary/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ unreadCount: 33 });
    expect(getUnreadNotificationsSummaryForUserMock).toHaveBeenCalledTimes(1);
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

  it("returns 401 before listing notifications when actor is missing", async () => {
    getAppActorMock.mockResolvedValue(null);

    const { GET } = await import("@/app/api/notifications/route");
    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ code: "UNAUTHORIZED" });
    expect(listVisibleNotificationsForUserMock).not.toHaveBeenCalled();
  });

  it("returns 403 before unread summary service when actor lacks permission", async () => {
    getAppActorMock.mockResolvedValue({ userId: "guest-1", role: null });

    const { GET } = await import("@/app/api/notifications/unread-summary/route");
    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
    expect(getUnreadNotificationsSummaryForUserMock).not.toHaveBeenCalled();
  });

  it("returns 403 before read mutation service when actor lacks permission", async () => {
    getAppActorMock.mockResolvedValue({ userId: "guest-1", role: null });

    const { POST } = await import("@/app/api/notifications/[id]/read/route");
    const response = await POST({} as never, { params: Promise.resolve({ id: "notif-1" }) });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
    expect(markNotificationReadForUserMock).not.toHaveBeenCalled();
  });

  it("returns 403 before dismiss mutation service when actor lacks permission", async () => {
    getAppActorMock.mockResolvedValue({ userId: "guest-1", role: null });

    const { POST } = await import("@/app/api/notifications/[id]/dismiss/route");
    const response = await POST({} as never, { params: Promise.resolve({ id: "notif-1" }) });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
    expect(dismissNotificationForUserMock).not.toHaveBeenCalled();
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
