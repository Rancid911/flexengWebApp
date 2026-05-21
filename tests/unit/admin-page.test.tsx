import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminPage from "@/app/(workspace)/(staff-zone)/admin/page";

const requireAdminPageAnyPermissionMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  requireAdminPageAnyPermission: (permissions: string[]) => requireAdminPageAnyPermissionMock(permissions)
}));

vi.mock("@/features/admin/components/admin-console/admin-console", () => ({
  AdminConsole: () => <div data-testid="admin-console" />
}));

describe("AdminPage", () => {
  beforeEach(() => {
    requireAdminPageAnyPermissionMock.mockReset();
    requireAdminPageAnyPermissionMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
  });

  it("guards the admin console with any relevant canonical admin permission", async () => {
    render(await AdminPage());

    expect(requireAdminPageAnyPermissionMock).toHaveBeenCalledWith([
      "users.view",
      "content.manage",
      "notifications.manage",
      "word_cards.manage"
    ]);
    expect(screen.getByTestId("admin-console")).toBeInTheDocument();
  });
});
