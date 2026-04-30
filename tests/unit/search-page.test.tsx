import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SearchPage from "@/app/search/page";

const getLayoutActorMock = vi.fn();

vi.mock("@/lib/auth/request-context", () => ({
  getLayoutActor: () => getLayoutActorMock()
}));

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

vi.mock("@/app/search/search-page-view", () => ({
  SearchPageView: ({ searchParams }: { searchParams: { q?: string; section?: string } }) => {
    void searchParams;
    return <div data-testid="search-page-view">search-page-view</div>;
  }
}));

describe("SearchPage", () => {
  beforeEach(() => {
    getLayoutActorMock.mockReset();
  });

  it("renders public shell for guest access without workspace chrome", async () => {
    getLayoutActorMock.mockResolvedValue(null);

    render(await SearchPage({ searchParams: Promise.resolve({ q: "blog" }) }));

    expect(screen.getByTestId("public-search-shell")).toHaveClass("flex", "flex-col");
    expect(screen.getByTestId("public-header")).toBeInTheDocument();
    expect(screen.getByTestId("public-footer")).toBeInTheDocument();
    expect(screen.getByTestId("search-page-view")).toBeInTheDocument();
    expect(screen.getByTestId("public-search-viewport")).toHaveClass("flex", "min-h-[calc(100dvh-56px)]", "flex-col");
    expect(screen.queryByTestId("workspace-shell")).not.toBeInTheDocument();
  });

  it("shows a small footer peek on the public search page", async () => {
    getLayoutActorMock.mockResolvedValue(null);

    render(await SearchPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByTestId("public-search-shell")).toHaveClass("flex", "flex-col");
    expect(screen.getByTestId("public-search-viewport")).toHaveClass("flex", "min-h-[calc(100dvh-56px)]", "flex-col");
    expect(screen.getByTestId("public-search-viewport")).not.toHaveClass("min-h-screen");
    expect(screen.getByTestId("public-search-viewport")).not.toHaveClass("min-h-[90dvh]");
  });

  it("renders workspace shell for authenticated access and disables inline header search", async () => {
    getLayoutActorMock.mockResolvedValue({
      userId: "user-1",
      isStudent: true,
      isTeacher: false,
      isStaffAdmin: false,
      profileRole: "student"
    });

    render(await SearchPage({ searchParams: Promise.resolve({ q: "words", section: "blog" }) }));

    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-variant", "shared");
    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-search", "none");
    expect(screen.getByTestId("workspace-shell")).toHaveAttribute("data-notifications", "lazy");
    expect(screen.getByTestId("search-page-view")).toBeInTheDocument();
    expect(screen.queryByTestId("public-search-shell")).not.toBeInTheDocument();
    expect(screen.queryByTestId("public-header")).not.toBeInTheDocument();
  });
});
