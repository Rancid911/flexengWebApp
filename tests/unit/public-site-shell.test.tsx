import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MainFooter } from "@/features/marketing/components/main-footer";
import { PublicSiteShell } from "@/features/marketing/components/public-site-shell";

const navigationMockState = vi.hoisted(() => ({
  pathname: "/"
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMockState.pathname
}));

vi.mock("@/features/marketing/components/main-header", () => ({
  MainHeader: () => <header data-testid="public-header" />
}));

describe("PublicSiteShell", () => {
  beforeEach(() => {
    navigationMockState.pathname = "/";
  });

  it("keeps the default public background and footer styling on other routes", () => {
    const { container } = render(
      <PublicSiteShell>
        <main>content</main>
      </PublicSiteShell>
    );

    expect(container.firstElementChild).toHaveClass(
      "bg-[linear-gradient(180deg,#F8F7FC_0%,#F5F4FA_48%,#F3F1F8_100%)]"
    );
    expect(container.querySelector("footer")).toHaveClass(
      "border-[#5E558F]",
      "bg-[linear-gradient(160deg,#433A6A_0%,#4F467D_45%,#3D355F_100%)]"
    );
  });

  it("uses one shared gradient and a transparent footer on the trial lesson route", () => {
    navigationMockState.pathname = "/lp/trial-lesson";

    const { container } = render(
      <PublicSiteShell>
        <main>content</main>
      </PublicSiteShell>
    );

    expect(screen.getByTestId("public-header")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass(
      "bg-[radial-gradient(circle_at_100%_100%,rgba(247,109,99,0.18)_0%,rgba(247,109,99,0.08)_18%,transparent_42%),linear-gradient(135deg,#2D284A_0%,#403965_50%,#554D82_100%)]"
    );
    expect(container.querySelector("footer")).toHaveClass("border-transparent", "bg-transparent");
  });
});

describe("MainFooter", () => {
  it("changes only the outer background and border for the transparent variant", () => {
    const { container } = render(<MainFooter variant="transparent" />);
    const footer = container.querySelector("footer");

    expect(footer).toHaveClass("border-t", "border-transparent", "bg-transparent");
    expect(footer).not.toHaveClass(
      "border-[#5E558F]",
      "bg-[linear-gradient(160deg,#433A6A_0%,#4F467D_45%,#3D355F_100%)]"
    );
    expect(container.querySelector(".border-\\[\\#6E65A7\\]")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Политика конфиденциальности" })).toBeInTheDocument();
  });
});
