import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminConsoleToolbar } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console-toolbar";

describe("AdminConsoleToolbar", () => {
  it("renders the active tab with the blue-aligned tab contract instead of shadcn default primary", () => {
    const setTabAndSyncQuery = vi.fn();

    render(
      <AdminConsoleToolbar
        q=""
        setQ={vi.fn()}
        setTabAndSyncQuery={setTabAndSyncQuery}
        tab="tests"
        usersRoleFilter="all"
        setUsersRoleFilter={vi.fn()}
        onCreateTest={vi.fn()}
        onCreateUser={vi.fn()}
        onCreateBlogPost={vi.fn()}
        onCreateNotification={vi.fn()}
      />
    );

    const activeTab = screen.getByRole("button", { name: "Учебные материалы" });
    const inactiveTab = screen.getByRole("button", { name: "Блог" });

    expect(activeTab.className).toContain("bg-[#eaf3ff]");
    expect(activeTab.className).toContain("text-[#1669db]");
    expect(activeTab.className).not.toContain("bg-primary");
    expect(inactiveTab.className).toContain("bg-slate-100");

    fireEvent.click(screen.getByRole("button", { name: "Уведомления" }));
    expect(setTabAndSyncQuery).toHaveBeenCalledWith("notifications");
  });
});
