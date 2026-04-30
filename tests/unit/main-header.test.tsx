import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MainHeader } from "@/app/main/main-header";
import { sitePrimaryNavItems } from "@/app/main/site-navigation";

describe("MainHeader", () => {
  it("keeps the public search link pointed at /search", () => {
    render(<MainHeader navItems={sitePrimaryNavItems} />);

    fireEvent.click(screen.getByRole("button", { name: /Ресурсы/i }));

    expect(screen.getByRole("link", { name: /Поиск по сайту/i })).toHaveAttribute("href", "/search");
  });

  it("opens public mobile navigation in a top-down panel", () => {
    render(<MainHeader navItems={sitePrimaryNavItems} />);

    fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));

    const dialog = screen.getByRole("dialog", { name: "Меню сайта" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveClass("top-0");
    expect(dialog.className).toContain("max-h-[calc(100dvh-0.75rem)]");
    expect(dialog.className).toContain("origin-top");
    expect(dialog.className).toContain("motion-safe:transition-[opacity,transform,clip-path]");
    expect(dialog).not.toHaveClass("h-dvh");
    expect(dialog.className).not.toContain("top-[4.5rem]");
    expect(dialog).not.toHaveClass("border-l");
    expect(within(dialog).getByRole("link", { name: "Программы" })).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Войти" })).toBeInTheDocument();
  });

  it("expands mobile sections inside the top-down panel", () => {
    render(<MainHeader navItems={sitePrimaryNavItems} />);

    fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));
    const dialog = screen.getByRole("dialog", { name: "Меню сайта" });

    fireEvent.click(within(dialog).getByRole("button", { name: /О школе/i }));

    expect(within(dialog).getByRole("link", { name: "Наша методика" })).toBeInTheDocument();
  });

  it("closes mobile top-down panel by backdrop, close button, and link click", async () => {
    render(<MainHeader navItems={sitePrimaryNavItems} />);

    fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));
    fireEvent.click(screen.getByTestId("site-mobile-menu-backdrop"));
    expect(screen.getByRole("dialog", { name: "Меню сайта" })).toHaveAttribute("data-state", "closed");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Меню сайта" })).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Меню сайта" })).getByRole("button", { name: "Закрыть меню" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Меню сайта" })).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Меню сайта" })).getByRole("link", { name: "Программы" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Меню сайта" })).not.toBeInTheDocument());
  });
});
