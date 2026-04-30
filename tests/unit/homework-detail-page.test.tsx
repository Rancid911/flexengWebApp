import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HomeworkDetailPage from "@/app/(workspace)/(shared-zone)/homework/[id]/page";
import { getHomeworkAssignmentDetail } from "@/lib/homework/queries";

vi.mock("@/lib/homework/queries", () => ({
  getHomeworkAssignmentDetail: vi.fn()
}));

describe("HomeworkDetailPage", () => {
  it("renders last submitted dates as local short date and time", async () => {
    vi.mocked(getHomeworkAssignmentDetail).mockResolvedValue({
      id: "homework-1",
      title: "Homework 1",
      description: "Practice tasks",
      status: "in_progress",
      due_at: "2026-04-20T18:45:00.000Z",
      completed_at: null,
      requiredCount: 1,
      completedRequiredCount: 1,
      homework_items: [
        {
          id: "item-1",
          source_type: "test",
          source_id: "test-1",
          sort_order: 0,
          required: true,
          title: "Present Simple Test",
          href: "/practice/activity/test_test-1",
          activityType: "test",
          cefrLevel: "A2",
          drillTopicKey: null,
          status: "completed",
          lastScore: 92,
          lastSubmittedAt: "2026-04-18T18:45:00.000Z",
          assessmentKind: "regular",
          recommendedLevel: null,
          recommendedBandLabel: null,
          placementSummary: null
        }
      ]
    });

    render(await HomeworkDetailPage({ params: Promise.resolve({ id: "homework-1" }) }));

    expect(screen.getByText("Present Simple Test")).toBeInTheDocument();
    expect(screen.getByText("Сдано: 18.04.2026, 21:45")).toBeInTheDocument();
    expect(screen.queryByText("2026-04-18T18:45:00.000Z")).not.toBeInTheDocument();
  });
});
