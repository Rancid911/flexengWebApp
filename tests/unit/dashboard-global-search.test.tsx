import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardGlobalSearch } from "@/components/search/dashboard-global-search";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock
  })
}));

describe("DashboardGlobalSearch", () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
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
            snippet: "Speaking exercises",
            rank: 1
          }
        ],
        groups: [{ key: "practice", label: "Практика", count: 1 }]
      })
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens dropdown after debounce and navigates to active result on Enter", async () => {
    render(<DashboardGlobalSearch />);

    fireEvent.change(screen.getByLabelText("Глобальный поиск по сайту"), { target: { value: "speaking" } });

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    await screen.findByRole("heading", { name: "Практика" });

    fireEvent.keyDown(screen.getByLabelText("Глобальный поиск по сайту"), { key: "ArrowDown" });
    fireEvent.keyDown(screen.getByLabelText("Глобальный поиск по сайту"), { key: "Enter" });

    expect(pushMock).toHaveBeenCalledWith("/practice/topics/speaking");
  });

  it("closes dropdown on Escape", async () => {
    render(<DashboardGlobalSearch />);

    const input = screen.getByLabelText("Глобальный поиск по сайту");
    fireEvent.change(input, { target: { value: "speaking" } });

    await screen.findByRole("heading", { name: "Практика" });
    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => expect(screen.getByTestId("dashboard-search-dropdown")).toHaveClass("hidden"));
  });
});
