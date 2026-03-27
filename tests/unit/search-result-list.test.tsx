import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SearchResultList } from "@/components/search/search-result-list";
import type { SearchGroupDto, SearchResultDto } from "@/lib/search/types";

const groups: SearchGroupDto[] = [
  { key: "practice", label: "Практика", count: 1 },
  { key: "blog", label: "Блог", count: 1 }
];

const items: SearchResultDto[] = [
  {
    id: "1",
    entityType: "module",
    entityId: "module-1",
    title: "Практика speaking",
    subtitle: "Тренировка speaking",
    href: "/practice/topics/speaking",
    section: "practice",
    icon: "graduation-cap",
    badge: "урок",
    snippet: "Speaking exercises for beginners",
    rank: 10
  },
  {
    id: "2",
    entityType: "post",
    entityId: "post-1",
    title: "Speaking tips",
    subtitle: "Советы для speaking",
    href: "/articles/speaking-tips",
    section: "blog",
    icon: "file-text",
    badge: null,
    snippet: "Speaking confidence",
    rank: 9
  }
];

describe("SearchResultList", () => {
  it("renders empty state", () => {
    render(
      <SearchResultList
        items={[]}
        groups={[]}
        emptyTitle="Ничего"
        emptyDescription="Попробуйте другой запрос"
      />
    );

    expect(screen.getByText("Ничего")).toBeInTheDocument();
    expect(screen.getByText("Попробуйте другой запрос")).toBeInTheDocument();
  });

  it("renders grouped items, badges and highlighted text", () => {
    render(
      <SearchResultList
        items={items}
        groups={groups}
        emptyTitle="Ничего"
        emptyDescription="Попробуйте другой запрос"
        query="speaking"
      />
    );

    expect(screen.getByRole("heading", { name: "Практика" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Блог" })).toBeInTheDocument();
    expect(screen.getByText("урок")).toBeInTheDocument();
    expect(screen.getAllByText(/speaking/i).length).toBeGreaterThan(0);
    expect(document.querySelectorAll("mark").length).toBeGreaterThan(0);
  });
});
