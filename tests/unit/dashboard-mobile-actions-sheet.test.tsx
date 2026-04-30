import { act, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";

import { DashboardMobileActionsSheet, type DashboardMobileActionItem } from "@/app/(workspace)/dashboard-mobile-actions-sheet";
import { useDashboardShellOverlays } from "@/app/(workspace)/use-dashboard-shell-state";

const items: DashboardMobileActionItem[] = [
  {
    id: "dashboard",
    label: "Рабочий стол",
    href: "/dashboard",
    match: "exact",
    icon: () => <span aria-hidden="true">D</span>,
    kind: "link"
  },
  {
    id: "schedule",
    label: "Расписание",
    href: "#schedule",
    match: "section",
    icon: () => <span aria-hidden="true">S</span>,
    kind: "link"
  },
  {
    id: "profile",
    label: "Профиль",
    href: "/settings/profile",
    match: "exact",
    icon: () => <span aria-hidden="true">P</span>,
    kind: "link"
  },
  {
    id: "payments",
    label: "Оплата",
    href: "/settings/payments",
    match: "exact",
    icon: () => <span aria-hidden="true">B</span>,
    kind: "link"
  },
  {
    id: "logout",
    label: "Выход",
    icon: () => <span aria-hidden="true">L</span>,
    kind: "button",
    danger: true
  }
];

describe("DashboardMobileActionsSheet", () => {
  it("does not render dialog subtree when closed", () => {
    render(
      <DashboardMobileActionsSheet
        open={false}
        pathname="/dashboard"
        hasProfileData
        avatarUrl={null}
        displayName="Анна Иванова"
        roleLabel="студент"
        email="anna@example.com"
        initials="АИ"
        items={items}
        isLoggingOut={false}
        closeButtonRef={{ current: null }}
        onClose={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.queryByRole("dialog", { name: "Дополнительное меню" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Закрыть дополнительное меню")).not.toBeInTheDocument();
  });

  it("closes via backdrop click", async () => {
    const onClose = vi.fn();

    render(
      <DashboardMobileActionsSheet
        open
        pathname="/dashboard"
        hasProfileData
        avatarUrl={null}
        displayName="Анна Иванова"
        roleLabel="студент"
        email="anna@example.com"
        initials="АИ"
        items={items}
        isLoggingOut={false}
        closeButtonRef={{ current: null }}
        onClose={onClose}
        onLogout={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("dashboard-mobile-menu-backdrop"));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("renders as a top-down panel instead of a full-height side drawer", () => {
    render(
      <DashboardMobileActionsSheet
        open
        pathname="/dashboard"
        hasProfileData
        avatarUrl={null}
        displayName="Анна Иванова"
        roleLabel="студент"
        email="anna@example.com"
        initials="АИ"
        items={items}
        isLoggingOut={false}
        closeButtonRef={{ current: null }}
        onClose={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    const dialog = screen.getByRole("dialog", { name: "Дополнительное меню" });
    expect(dialog).toHaveClass("top-0");
    expect(dialog.className).toContain("max-h-[calc(100dvh-0.75rem)]");
    expect(dialog.className).toContain("origin-top");
    expect(dialog.className).toContain("motion-safe:transition-[opacity,transform,clip-path]");
    expect(dialog).not.toHaveClass("h-dvh");
    expect(dialog).not.toHaveClass("top-16");
    expect(dialog).not.toHaveClass("right-0");
    expect(dialog).not.toHaveClass("border-l");
  });

  it("groups mobile menu links into learning and settings sections", () => {
    render(
      <DashboardMobileActionsSheet
        open
        pathname="/dashboard"
        hasProfileData
        avatarUrl={null}
        displayName="Анна Иванова"
        roleLabel="студент"
        email="anna@example.com"
        initials="АИ"
        items={items}
        isLoggingOut={false}
        closeButtonRef={{ current: null }}
        onClose={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    const learningButton = screen.getByRole("button", { name: "Обучение" });
    const settingsButton = screen.getByRole("button", { name: "Настройки" });
    const learningSection = document.getElementById("dashboard-mobile-menu-section-learning");

    expect(learningButton).toHaveAttribute("aria-expanded", "true");
    expect(settingsButton).toHaveAttribute("aria-expanded", "false");
    expect(learningSection).not.toBeNull();
    expect(learningSection).toHaveClass("ml-3");
    expect(learningSection).toHaveClass("pl-2");
    expect(within(learningSection!).getByRole("link", { name: "Рабочий стол" })).toBeInTheDocument();
    expect(within(learningSection!).getByRole("link", { name: "Расписание" })).toBeInTheDocument();
    expect(within(learningSection!).queryByRole("link", { name: "Профиль" })).not.toBeInTheDocument();
    expect(within(learningSection!).queryByRole("link", { name: "Оплата" })).not.toBeInTheDocument();
    expect(within(learningSection!).getByRole("link", { name: "Рабочий стол" }).querySelector(".scale-x-\\[-1\\]")).toBeNull();
    expect(screen.queryByRole("link", { name: "Профиль" })).not.toBeInTheDocument();

    fireEvent.click(settingsButton);

    const settingsSection = document.getElementById("dashboard-mobile-menu-section-settings");
    expect(settingsButton).toHaveAttribute("aria-expanded", "true");
    expect(settingsSection).not.toBeNull();
    expect(within(settingsSection!).getByRole("link", { name: "Профиль" })).toBeInTheDocument();
    expect(within(settingsSection!).getByRole("link", { name: "Оплата" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Выход" })).toBeInTheDocument();
  });

  it("keeps the panel mounted for exit animation before unmounting", async () => {
    function AnimatedSheetHarness() {
      const [open, setOpen] = useState(true);

      return (
        <DashboardMobileActionsSheet
          open={open}
          pathname="/dashboard"
          hasProfileData
          avatarUrl={null}
          displayName="Анна Иванова"
          roleLabel="студент"
          email="anna@example.com"
          initials="АИ"
          items={items}
          isLoggingOut={false}
          closeButtonRef={{ current: null }}
          onClose={() => setOpen(false)}
          onLogout={vi.fn()}
        />
      );
    }

    render(<AnimatedSheetHarness />);

    const dialog = screen.getByRole("dialog", { name: "Дополнительное меню" });
    expect(dialog).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("dashboard-mobile-menu-backdrop"));

    await waitFor(() => expect(dialog).toHaveAttribute("data-state", "closed"));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Дополнительное меню" })).not.toBeInTheDocument());
  });

  it("closes when a navigation link is selected", async () => {
    const onClose = vi.fn();

    render(
      <DashboardMobileActionsSheet
        open
        pathname="/dashboard"
        hasProfileData
        avatarUrl={null}
        displayName="Анна Иванова"
        roleLabel="студент"
        email="anna@example.com"
        initials="АИ"
        items={items}
        isLoggingOut={false}
        closeButtonRef={{ current: null }}
        onClose={onClose}
        onLogout={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("link", { name: "Расписание" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("runs logout action from the top-down menu", () => {
    const onLogout = vi.fn();

    render(
      <DashboardMobileActionsSheet
        open
        pathname="/dashboard"
        hasProfileData
        avatarUrl={null}
        displayName="Анна Иванова"
        roleLabel="студент"
        email="anna@example.com"
        initials="АИ"
        items={items}
        isLoggingOut={false}
        closeButtonRef={{ current: null }}
        onClose={vi.fn()}
        onLogout={onLogout}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Выход" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("traps focus inside the top-down panel", async () => {
    render(
      <DashboardMobileActionsSheet
        open
        pathname="/dashboard"
        hasProfileData
        avatarUrl={null}
        displayName="Анна Иванова"
        roleLabel="студент"
        email="anna@example.com"
        initials="АИ"
        items={items}
        isLoggingOut={false}
        closeButtonRef={{ current: null }}
        onClose={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    const dialog = screen.getByRole("dialog", { name: "Дополнительное меню" });
    const closeButton = screen.getAllByLabelText("Закрыть дополнительное меню")[1];
    const logoutButton = screen.getByRole("button", { name: "Выход" });

    closeButton.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    await waitFor(() => expect(document.activeElement).toBe(logoutButton));

    logoutButton.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    await waitFor(() => expect(document.activeElement).toBe(closeButton));
  });
});

describe("useDashboardShellOverlays", () => {
  it("focuses close button on open and restores focus to trigger on keyboard close", async () => {
    const { result } = renderHook(() => useDashboardShellOverlays("/dashboard"));
    const trigger = document.createElement("button");
    const closeButton = document.createElement("button");
    document.body.append(trigger, closeButton);

    result.current.mobileMoreSheetTriggerRef.current = trigger;
    result.current.mobileMoreSheetCloseRef.current = closeButton;

    act(() => {
      trigger.focus();
      result.current.openMobileMoreSheet();
    });

    await waitFor(() => expect(document.activeElement).toBe(closeButton));

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      result.current.closeMobileMoreSheet();
    });

    await waitFor(() => expect(document.activeElement).toBe(trigger));

    trigger.remove();
    closeButton.remove();
  });

  it("does not restore focus on pathname and resize closes", async () => {
    const { result, rerender } = renderHook(({ pathname }) => useDashboardShellOverlays(pathname), {
      initialProps: { pathname: "/dashboard" }
    });
    const trigger = document.createElement("button");
    const closeButton = document.createElement("button");
    document.body.append(trigger, closeButton);

    result.current.mobileMoreSheetTriggerRef.current = trigger;
    result.current.mobileMoreSheetCloseRef.current = closeButton;

    act(() => {
      result.current.openMobileMoreSheet();
    });

    await waitFor(() => expect(document.activeElement).toBe(closeButton));

    act(() => {
      rerender({ pathname: "/schedule" });
    });

    await waitFor(() => expect(result.current.mobileMoreSheetOpen).toBe(false));
    expect(document.activeElement).not.toBe(trigger);

    act(() => {
      result.current.openMobileMoreSheet();
    });

    await waitFor(() => expect(document.activeElement).toBe(closeButton));

    act(() => {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 1440 });
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => expect(result.current.mobileMoreSheetOpen).toBe(false));
    expect(document.activeElement).not.toBe(trigger);

    trigger.remove();
    closeButton.remove();
  });
});
