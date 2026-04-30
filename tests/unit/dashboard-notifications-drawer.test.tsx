import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardNotificationsDrawer } from "@/app/(workspace)/dashboard-notifications-drawer";
import type { UserNotificationDto } from "@/lib/admin/types";

function makeNotification(overrides: Partial<UserNotificationDto> = {}): UserNotificationDto {
  return {
    id: "notif-1",
    title: "Новое уведомление",
    body: "Проверьте обновление расписания.",
    type: "news",
    published_at: "2026-03-30T08:00:00.000Z",
    expires_at: null,
    created_at: "2026-03-30T08:00:00.000Z",
    is_read: false,
    ...overrides
  };
}

describe("DashboardNotificationsDrawer", () => {
  it("does not render interactive controls when drawer is closed", () => {
    render(
      <DashboardNotificationsDrawer
        open={false}
        loading={false}
        hasNotificationsData
        error=""
        notifications={[makeNotification()]}
        unreadCount={1}
        dismissingIds={{}}
        closeButtonRef={{ current: null }}
        onClose={vi.fn()}
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
        formatNotificationDate={() => "30 марта"}
      />
    );

    expect(screen.queryByTestId("notifications-drawer")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /закрыть уведомления/i })).not.toBeInTheDocument();
  });

  it("renders a single dismiss action in the header for unread items", () => {
    const onDismiss = vi.fn();
    const notification = makeNotification();

    render(
      <DashboardNotificationsDrawer
        open
        loading={false}
        hasNotificationsData
        error=""
        notifications={[notification]}
        unreadCount={1}
        dismissingIds={{}}
        closeButtonRef={{ current: null }}
        onClose={vi.fn()}
        onRetry={vi.fn()}
        onDismiss={onDismiss}
        formatNotificationDate={() => "30 марта"}
      />
    );

    fireEvent.click(screen.getByTestId(`notification-dismiss-${notification.id}`));

    expect(onDismiss).toHaveBeenCalledWith(notification);
    expect(screen.queryByTestId(`notification-mark-read-${notification.id}`)).not.toBeInTheDocument();
    expect(screen.getByLabelText(`Убрать уведомление: ${notification.title}`)).toBeInTheDocument();
  });

  it("keeps backdrop mobile-only so desktop header is not dimmed", () => {
    render(
      <DashboardNotificationsDrawer
        open
        loading={false}
        hasNotificationsData
        error=""
        notifications={[makeNotification()]}
        unreadCount={1}
        dismissingIds={{}}
        closeButtonRef={{ current: null }}
        onClose={vi.fn()}
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
        formatNotificationDate={() => "30 марта"}
      />
    );

    expect(screen.getByTestId("notifications-backdrop")).toHaveClass("xl:hidden");
  });

  it("announces error state and traps tab focus inside the drawer", async () => {
    const closeButtonRef = { current: null as HTMLButtonElement | null };
    const notification = makeNotification();

    render(
      <DashboardNotificationsDrawer
        open
        loading={false}
        hasNotificationsData
        error="Не удалось загрузить уведомления"
        notifications={[notification]}
        unreadCount={1}
        dismissingIds={{}}
        closeButtonRef={closeButtonRef}
        onClose={vi.fn()}
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
        formatNotificationDate={() => "30 марта"}
      />
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");

    const dialog = screen.getByRole("dialog", { name: "Уведомления" });
    const closeButton = within(dialog).getByRole("button", { name: "Закрыть уведомления" });
    const dismissButton = screen.getByLabelText(`Убрать уведомление: ${notification.title}`);
    closeButton.focus();

    fireEvent.keyDown(screen.getByTestId("notifications-drawer"), { key: "Tab", shiftKey: true });
    await waitFor(() => expect(document.activeElement).toBe(dismissButton));

    dismissButton.focus();
    fireEvent.keyDown(screen.getByTestId("notifications-drawer"), { key: "Tab" });
    await waitFor(() => expect(document.activeElement).toBe(closeButton));
  });
});
