import { describe, expect, it } from "vitest";

import { DEFAULT_PLACEMENT_SCORING_PROFILE, buildPlacementSummary } from "@/lib/practice/placement";
import type { PracticeAttemptReviewQuestion } from "@/lib/practice/types";

function makeQuestions(correct: number): PracticeAttemptReviewQuestion[] {
  const bands = [
    { key: "beginner", count: 6 },
    { key: "elementary", count: 14 },
    { key: "pre_intermediate", count: 14 },
    { key: "intermediate", count: 14 },
    { key: "upper_intermediate", count: 14 },
    { key: "advanced", count: 8 }
  ] as const;
  const questions: PracticeAttemptReviewQuestion[] = [];
  let index = 0;
  for (const band of bands) {
    for (let i = 0; i < band.count; i += 1) {
      questions.push({
        questionId: `q-${index + 1}`,
        prompt: `Question ${index + 1}`,
        explanation: null,
        selectedOptionId: "a",
        selectedOptionText: "A",
        correctOptionId: "a",
        correctOptionText: "A",
        isCorrect: index < correct,
        placementBand: band.key
      });
      index += 1;
    }
  }
  return questions;
}

describe("buildPlacementSummary", () => {
  it("maps score 18 to Elementary", () => {
    const summary = buildPlacementSummary(18, makeQuestions(18), DEFAULT_PLACEMENT_SCORING_PROFILE);
    expect(summary.recommendedLevel).toBe("Elementary");
  });

  it("maps score 27 to Pre-Intermediate", () => {
    const summary = buildPlacementSummary(27, makeQuestions(27), DEFAULT_PLACEMENT_SCORING_PROFILE);
    expect(summary.recommendedLevel).toBe("Pre-Intermediate");
  });

  it("maps score above 60 to Advanced and exposes section counts", () => {
    const summary = buildPlacementSummary(64, makeQuestions(64), DEFAULT_PLACEMENT_SCORING_PROFILE);
    expect(summary.recommendedLevel).toBe("Advanced");
    expect(summary.sectionScores).toHaveLength(6);
    expect(summary.sectionScores[0]).toMatchObject({ key: "beginner", totalQuestions: 6 });
  });
});
