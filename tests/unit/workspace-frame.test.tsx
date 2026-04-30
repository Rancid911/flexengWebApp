import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkspaceFrame } from "@/app/(workspace)/shell/workspace-frame";

describe("WorkspaceFrame", () => {
  const baseProps = {
    sidebarCollapsed: false,
    sidebarTransitionsEnabled: true,
    displayName: "Teacher User",
    roleLabel: "преподаватель",
    avatarUrl: null,
    initials: "TU",
    navigation: <div data-testid="nav" />,
    mobileNavigationTrigger: <button type="button">Меню</button>,
    utilities: <div data-testid="utilities" />
  };

  it("renders a flat workspace header aligned with the shell background", () => {
    render(
      <WorkspaceFrame
        {...baseProps}
        hasProfileData
      >
        <div>content</div>
      </WorkspaceFrame>
    );

    const header = screen.getByText("Teacher User").closest("header");
    expect(header).toHaveClass("bg-[#f5f7f9]");
    expect(header).toHaveClass("border-b");
    expect(header).toHaveClass("shadow-none");
    expect(header).not.toHaveClass("bg-white/80");
  });

  it("applies CRM background and glass header styling in CRM glass mode", () => {
    render(
      <WorkspaceFrame
        {...baseProps}
        hasProfileData
        crmGlassMode
        crmBackgroundImageUrl="https://example.com/crm-bg.jpg"
      >
        <div>content</div>
      </WorkspaceFrame>
    );

    const root = screen.getByTestId("workspace-shell-root");
    const header = screen.getByText("Teacher User").closest("header");

    expect(root.style.backgroundImage).toContain("https://example.com/crm-bg.jpg");
    expect(root).toHaveStyle({
      backgroundPosition: "center",
      backgroundSize: "cover"
    });
    expect(header).toHaveClass("bg-white/10");
    expect(header).toHaveClass("backdrop-blur-md");
    expect(header).toHaveClass("border-transparent");
    expect(header).not.toHaveClass("border-white/15");
    expect(header).not.toHaveClass("bg-[#f5f7f9]");
    expect(screen.getByText("Teacher User")).toHaveClass("text-white");
    expect(screen.getByText("преподаватель")).toHaveClass("text-white/70");
  });

  it("links the loaded header avatar to profile settings", () => {
    render(
      <WorkspaceFrame
        {...baseProps}
        hasProfileData
      >
        <div>content</div>
      </WorkspaceFrame>
    );

    const profileLink = screen.getByRole("link", { name: "Перейти в профиль" });
    expect(profileLink).toHaveAttribute("href", "/settings/profile");
    expect(profileLink).toHaveAttribute("title", "Профиль");
    expect(profileLink).toHaveClass("focus-visible:ring-2");
  });

  it("keeps the avatar skeleton non-clickable while profile data is loading", () => {
    render(
      <WorkspaceFrame
        {...baseProps}
        hasProfileData={false}
      >
        <div>content</div>
      </WorkspaceFrame>
    );

    expect(screen.queryByRole("link", { name: "Перейти в профиль" })).not.toBeInTheDocument();
  });
});
