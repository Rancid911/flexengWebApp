import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ProgressHistoryPage from "@/app/(workspace)/(shared-zone)/progress/history/page";
import { getProgressHistory } from "@/lib/progress/queries";

vi.mock("@/lib/progress/queries", () => ({
  getProgressHistory: vi.fn()
}));

describe("ProgressHistoryPage", () => {
  it("renders result dates as local short date and time", async () => {
    vi.mocked(getProgressHistory).mockResolvedValue([
      {
        id: "attempt-1",
        title: "Present Simple Test",
        status: "passed",
        score: 84,
        submitted_at: "2026-04-18T18:45:00.000Z",
        created_at: "2026-04-18T18:30:00.000Z"
      }
    ]);

    render(await ProgressHistoryPage());

    expect(screen.getByText("Present Simple Test")).toBeInTheDocument();
    expect(screen.getByText("18.04.2026, 21:45")).toBeInTheDocument();
    expect(screen.queryByText("2026-04-18T18:45:00.000Z")).not.toBeInTheDocument();
  });
});
