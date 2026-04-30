import type { PlacementBandKey } from "@/lib/practice/placement";

export type PracticeAttemptReviewQuestion = {
  questionId: string;
  prompt: string;
  explanation: string | null;
  selectedOptionId: string | null;
  selectedOptionText: string | null;
  correctOptionId: string | null;
  correctOptionText: string | null;
  isCorrect: boolean;
  placementBand: PlacementBandKey | null;
};

export type PracticeAttemptResult = {
  attemptId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  passingScore: number;
  questions: PracticeAttemptReviewQuestion[];
  assessmentKind?: "regular" | "placement";
  recommendedLevel?: string | null;
  recommendedBandLabel?: string | null;
  sectionScores?: Array<{
    key: PlacementBandKey;
    label: string;
    correctAnswers: number;
    totalQuestions: number;
  }>;
};
