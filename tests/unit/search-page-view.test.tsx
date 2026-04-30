import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SearchPageView } from "@/app/search/search-page-view";

const searchSiteMock = vi.fn();

vi.mock("@/lib/search/search-service", () => ({
  searchSite: (...args: unknown[]) => searchSiteMock(...args)
}));

describe("SearchPageView", () => {
  beforeEach(() => {
    searchSiteMock.mockReset();
    searchSiteMock.mockResolvedValue({
      query: "",
      items: [],
      groups: []
    });
  });

  it("does not render legacy hero helper text and counter elements", async () => {
    render(await SearchPageView({ searchParams: {} }));

    expect(screen.getByRole("heading", { name: "Введите запрос для поиска по сайту" })).toBeInTheDocument();
    expect(screen.queryByText("Глобальный поиск")).not.toBeInTheDocument();
    expect(screen.queryByText(/Поиск учитывает опубликованный контент/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Результатов")).not.toBeInTheDocument();
    expect(screen.getAllByText("Поиск ещё не выполнен")).toHaveLength(1);
    expect(screen.getByTestId("search-page-main")).toHaveAttribute("data-empty-state", "true");
    expect(screen.getByTestId("search-page-main")).toHaveClass("flex-1", "space-y-6");
    expect(screen.getByTestId("search-page-main")).not.toHaveClass("justify-center");
  });

  it("keeps the result headline and result list without viewport lock for completed searches", async () => {
    searchSiteMock.mockResolvedValue({
      query: "english",
      items: [
        {
          id: "1",
          entityType: "post",
          entityId: "post-1",
          title: "English post",
          subtitle: null,
          href: "/articles/post-1",
          section: "blog",
          icon: "file-text",
          badge: null,
          snippet: "body",
          rank: 1
        }
      ],
      groups: [{ key: "blog", label: "Блог", count: 1 }]
    });

    render(await SearchPageView({ searchParams: { q: "english" } }));

    expect(screen.getByRole("heading", { name: "Результаты по запросу «english»" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /English post/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Поисковый запрос")).toBeInTheDocument();
    expect(screen.getByTestId("search-page-main")).toHaveAttribute("data-empty-state", "false");
    expect(screen.getByTestId("search-page-main")).toHaveClass("flex-1", "space-y-6");
    expect(screen.getByTestId("search-page-main")).not.toHaveClass("justify-center");
  });
});
