import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PlacementTestFlow } from "@/app/(workspace)/(shared-zone)/practice/activity/[activityId]/placement-test-flow";
import type { PracticeTestActivityDetail } from "@/lib/practice/queries";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}));

function makePayload(overrides: Partial<PracticeTestActivityDetail> = {}): PracticeTestActivityDetail {
  return {
    id: "test_11111111-1111-1111-1111-111111111111",
    sourceType: "test",
    activityType: "test",
    assessmentKind: "placement",
    title: "Placement Test",
    description: "Определение уровня.",
    cefrLevel: null,
    drillTopicKey: null,
    drillKind: null,
    lessonReinforcement: false,
    assigned: true,
    meta: "Placement test · 30 минут",
    passingScore: 0,
    timeLimitMinutes: 30,
    scoringProfile: null,
    isSupported: true,
    unsupportedQuestionTypes: [],
    content: [
      {
        id: "22222222-2222-2222-2222-222222222222",
        prompt: "Choose the correct sentence:",
        explanation: null,
        questionType: "single_choice",
        sortOrder: 1,
        placementBand: "beginner",
        options: [
          { id: "33333333-3333-3333-3333-333333333333", optionText: "A", sortOrder: 1 },
          { id: "44444444-4444-4444-4444-444444444444", optionText: "B", sortOrder: 2 }
        ]
      }
    ],
    ...overrides
  };
}

describe("PlacementTestFlow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows intro first and starts the timed runner only after explicit confirmation", () => {
    render(<PlacementTestFlow payload={makePayload()} />);

    expect(screen.getByRole("heading", { name: "Подготовка к placement test" })).toBeInTheDocument();
    expect(screen.getByText("На выполнение теста отводится до 30 минут.")).toBeInTheDocument();
    expect(screen.queryByTestId("placement-countdown")).not.toBeInTheDocument();
    expect(screen.queryByText("Текущий вопрос")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Начать тест" }));

    expect(screen.getByTestId("placement-countdown")).toHaveTextContent("30:00");
    expect(screen.getByText("Текущий вопрос")).toBeInTheDocument();
  });

  it("ignores stale timer storage until the student explicitly starts the test", () => {
    window.localStorage.setItem(
      "placement-test-timer:test_11111111-1111-1111-1111-111111111111",
      JSON.stringify({
        activityId: "test_11111111-1111-1111-1111-111111111111",
        startedAt: Date.now() - 15 * 60 * 1000,
        expiresAt: Date.now() + 15 * 60 * 1000
      })
    );

    render(<PlacementTestFlow payload={makePayload()} />);

    expect(screen.queryByTestId("placement-countdown")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Начать тест" }));

    expect(screen.getByTestId("placement-countdown")).toHaveTextContent("30:00");
  });
});
