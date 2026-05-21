import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AuthLayout from "@/app/(auth)/layout";
import PublicLayout from "@/app/(public)/layout";
import CrmPage from "@/app/(workspace)/(staff-zone)/crm/page";
import SearchZoneLayout from "@/app/(workspace)/(search-zone)/layout";
import SharedZoneLayout from "@/app/(workspace)/(shared-zone)/layout";
import StaffZoneLayout from "@/app/(workspace)/(staff-zone)/layout";
import StudentZoneLayout from "@/app/(workspace)/(student-zone)/layout";
import TeacherZoneLayout from "@/app/(workspace)/(teacher-zone)/layout";

const crmQueriesMock = vi.hoisted(() => ({
  loadCrmBoard: vi.fn(async () => ({ stages: [] })),
  loadCrmSettings: vi.fn(async () => ({
    background_image_url: null,
    updated_at: null
  }))
}));

const requireAdminPagePermissionMock = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("@/features/marketing/components/main-header", () => ({
  MainHeader: () => <div data-testid="public-header">header</div>
}));

vi.mock("@/features/marketing/components/main-footer", () => ({
  MainFooter: () => <div data-testid="public-footer">footer</div>
}));

vi.mock("@/features/workspace-shell/server/workspace-shell.server", () => ({
  WorkspaceShell: ({
    children,
    shellVariant,
    utilitySlots,
    crmBackgroundImageUrl
  }: {
    children: React.ReactNode;
    shellVariant: string;
    utilitySlots?: { search?: string; notifications?: string };
    crmBackgroundImageUrl?: string | null;
  }) => (
    <div
      data-testid="workspace-shell"
      data-variant={shellVariant}
      data-search={utilitySlots?.search ?? "none"}
      data-notifications={utilitySlots?.notifications ?? "none"}
      data-crm-background={crmBackgroundImageUrl ?? "none"}
    >
      {children}
    </div>
  )
}));

vi.mock("@/lib/admin/auth", () => ({
  requireAdminPagePermission: requireAdminPagePermissionMock
}));

vi.mock("@/lib/crm/queries", () => ({
  loadCrmBoard: crmQueriesMock.loadCrmBoard,
  loadCrmSettings: crmQueriesMock.loadCrmSettings
}));

vi.mock("@/features/crm/components/crm-board-client", () => ({
  CrmBoardClient: ({ initialSettings }: { initialSettings: { background_image_url: string | null } }) => (
    <div data-testid="crm-board" data-background={initialSettings.background_image_url ?? "none"} />
  )
}));

describe("route layouts", () => {
  beforeEach(() => {
    crmQueriesMock.loadCrmBoard.mockClear();
    crmQueriesMock.loadCrmSettings.mockClear();
    requireAdminPagePermissionMock.mockClear();
  });

  it("renders marketing shell for public layout", () => {
    render(<PublicLayout><div>content</div></PublicLayout>);

    expect(screen.getByTestId("public-header")).toBeInTheDocument();
    expect(screen.getByTestId("public-footer")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("renders plain auth layout without marketing shell", () => {
    render(<AuthLayout><div>auth-content</div></AuthLayout>);

    expect(screen.getByText("auth-content")).toBeInTheDocument();
    expect(screen.queryByTestId("public-header")).not.toBeInTheDocument();
  });

  it("uses shared workspace shell variant", async () => {
    render(await SharedZoneLayout({ children: <div>shared</div> }));

    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-variant", "shared");
    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-search", "lazy");
    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-notifications", "lazy");
  });

  it("uses student workspace shell variant", async () => {
    render(await StudentZoneLayout({ children: <div>student</div> }));

    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-variant", "student");
    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-search", "none");
    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-notifications", "lazy");
  });

  it("uses teacher and staff workspace shell variants", async () => {
    const teacher = render(await TeacherZoneLayout({ children: <div>teacher</div> }));
    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-variant", "teacher");
    teacher.unmount();

    render(await StaffZoneLayout({ children: <div>staff</div> }));
    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-variant", "staff");
    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-search", "lazy");
    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-notifications", "lazy");
    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-crm-background", "none");
    expect(crmQueriesMock.loadCrmSettings).not.toHaveBeenCalled();
  });

  it("loads CRM settings in the CRM route instead of the staff layout", async () => {
    crmQueriesMock.loadCrmSettings.mockResolvedValue({
      background_image_url: "https://example.com/crm-bg.jpg",
      updated_at: "2026-04-24T12:00:00.000Z"
    });

    render(await CrmPage());

    expect(requireAdminPagePermissionMock).toHaveBeenCalledWith("crm.leads.view");
    expect(crmQueriesMock.loadCrmBoard).toHaveBeenCalledTimes(1);
    expect(crmQueriesMock.loadCrmSettings).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("crm-board")).toHaveAttribute("data-background", "https://example.com/crm-bg.jpg");
  });

  it("disables header search for the dedicated search route", async () => {
    render(await SearchZoneLayout({ children: <div>search</div> }));

    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-variant", "shared");
    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-search", "none");
    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-notifications", "lazy");
  });
});
