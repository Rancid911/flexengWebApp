import { render, screen } from "@testing-library/react";
import { BriefcaseBusiness, LayoutDashboard } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DashboardMobileActionsSheet, type DashboardMobileActionItem } from "@/app/(workspace)/dashboard-mobile-actions-sheet";
import { WorkspaceNavigationView } from "@/app/(workspace)/shell/workspace-navigation-view";
import type { WorkspaceNavConfig } from "@/app/(workspace)/workspace-shell.types";

const navigationMockState = vi.hoisted(() => ({
  pathname: "/dashboard"
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMockState.pathname
}));

const navConfig: WorkspaceNavConfig = {
  primary: [
    { id: "dashboard", label: "Дашборд", href: "/dashboard", match: "exact", icon: LayoutDashboard },
    { id: "crm", label: "CRM", href: "/crm", match: "section", icon: BriefcaseBusiness, badgeCount: 125 }
  ],
  secondary: [],
  mobileMore: [],
  showBottomProfileLink: true
};

function renderNavigation(sidebarCollapsed = false) {
  return render(
    <WorkspaceNavigationView
      navConfig={navConfig}
      sidebarCollapsed={sidebarCollapsed}
      labelMotionClass=""
      sidebarTransitionClass=""
      isLoggingOut={false}
      appVersion="1.0.0"
      currentRole="manager"
      mobileMoreSheetOpen={false}
      mobileMoreSheetCloseRef={{ current: null }}
      hasProfileData
      avatarUrl={null}
      displayName="Manager"
      roleLabel="менеджер"
      email="manager@example.com"
      initials="M"
      mobileSheetNavItems={[]}
      onToggleSidebar={vi.fn()}
      onCloseMobileMoreSheet={vi.fn()}
      onLogout={vi.fn()}
    />
  );
}

function renderNavigationWithGlassMode(sidebarCollapsed = false) {
  return render(
    <WorkspaceNavigationView
      navConfig={navConfig}
      sidebarCollapsed={sidebarCollapsed}
      labelMotionClass=""
      sidebarTransitionClass=""
      isLoggingOut={false}
      appVersion="1.0.0"
      currentRole="manager"
      mobileMoreSheetOpen={false}
      mobileMoreSheetCloseRef={{ current: null }}
      hasProfileData
      avatarUrl={null}
      displayName="Manager"
      roleLabel="менеджер"
      email="manager@example.com"
      initials="M"
      mobileSheetNavItems={[]}
      crmGlassMode
      onToggleSidebar={vi.fn()}
      onCloseMobileMoreSheet={vi.fn()}
      onLogout={vi.fn()}
    />
  );
}

describe("workspace CRM navigation badge", () => {
  afterEach(() => {
    navigationMockState.pathname = "/dashboard";
  });

  it("shows CRM unread badge and caps values above 99", () => {
    renderNavigation(false);

    expect(screen.getByRole("link", { name: /CRM/ })).toBeInTheDocument();
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("shows a compact badge in collapsed sidebar", () => {
    renderNavigation(true);

    expect(screen.getByText("99+")).toHaveClass("absolute");
  });

  it("renders glass sidebar styling in CRM glass mode while preserving collapsed state", () => {
    renderNavigationWithGlassMode(true);

    const sidebar = screen.getByTestId("dashboard-sidebar");

    expect(sidebar).toHaveAttribute("data-collapsed", "true");
    expect(sidebar).toHaveClass("bg-white/5");
    expect(sidebar).toHaveClass("backdrop-blur-md");
    expect(sidebar).toHaveClass("border-transparent");
    expect(sidebar).not.toHaveClass("border-white/15");
    expect(sidebar).not.toHaveClass("bg-slate-50");
  });

  it("renders white CRM navigation labels and icon tokens in CRM glass mode", () => {
    navigationMockState.pathname = "/crm";
    renderNavigationWithGlassMode(false);

    const crmLink = screen.getByRole("link", { name: /CRM/ });
    const dashboardLink = screen.getByRole("link", { name: /Дашборд/ });
    const crmIconToken = crmLink.querySelector("span");

    expect(crmLink).toHaveClass("text-white");
    expect(crmLink).not.toHaveClass("bg-white/18");
    expect(crmLink).not.toHaveClass("ring-1");
    expect(crmLink).not.toHaveClass("ring-white/25");
    expect(crmLink).not.toHaveClass("text-slate-900");
    expect(crmIconToken).toHaveClass("text-white");
    expect(crmIconToken).not.toHaveClass("text-slate-800");
    expect(crmIconToken).not.toHaveClass("bg-white/18");
    expect(dashboardLink).toHaveClass("text-white/70");
    expect(dashboardLink).not.toHaveClass("text-slate-600");
    expect(screen.getByTestId("logout-button")).toHaveClass("text-white/55");
  });

  it("renders CRM nav badge without white ring", () => {
    renderNavigation(false);

    const badge = screen.getByTestId("workspace-nav-badge");

    expect(badge).toHaveClass("bg-rose-500");
    expect(badge).not.toHaveClass("ring-1");
    expect(badge).not.toHaveClass("ring-white");
  });

  it("renders CRM badge in mobile menu links", () => {
    const items: DashboardMobileActionItem[] = [
      { id: "crm", label: "CRM", href: "/crm", match: "section", icon: BriefcaseBusiness, kind: "link", badgeCount: 3 }
    ];

    render(
      <DashboardMobileActionsSheet
        open
        pathname="/dashboard"
        hasProfileData
        avatarUrl={null}
        displayName="Manager"
        roleLabel="менеджер"
        email="manager@example.com"
        initials="M"
        items={items}
        isLoggingOut={false}
        closeButtonRef={{ current: null }}
        onClose={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByRole("link", { name: /CRM/ })).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
