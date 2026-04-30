import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AuthLayout from "@/app/(auth)/layout";
import PublicLayout from "@/app/(public)/layout";
import SearchZoneLayout from "@/app/(workspace)/(search-zone)/layout";
import SharedZoneLayout from "@/app/(workspace)/(shared-zone)/layout";
import StaffZoneLayout from "@/app/(workspace)/(staff-zone)/layout";
import StudentZoneLayout from "@/app/(workspace)/(student-zone)/layout";
import TeacherZoneLayout from "@/app/(workspace)/(teacher-zone)/layout";

vi.mock("@/app/main/main-header", () => ({
  MainHeader: () => <div data-testid="public-header">header</div>
}));

vi.mock("@/app/main/main-footer", () => ({
  MainFooter: () => <div data-testid="public-footer">footer</div>
}));

vi.mock("@/app/(workspace)/workspace-shell.server", () => ({
  WorkspaceShell: ({
    children,
    shellVariant,
    utilitySlots
  }: {
    children: React.ReactNode;
    shellVariant: string;
    utilitySlots?: { search?: string; notifications?: string };
  }) => (
    <div
      data-testid="workspace-shell"
      data-variant={shellVariant}
      data-search={utilitySlots?.search ?? "none"}
      data-notifications={utilitySlots?.notifications ?? "none"}
    >
      {children}
    </div>
  )
}));

describe("route layouts", () => {
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
  });

  it("disables header search for the dedicated search route", async () => {
    render(await SearchZoneLayout({ children: <div>search</div> }));

    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-variant", "shared");
    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-search", "none");
    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-notifications", "lazy");
  });
});
