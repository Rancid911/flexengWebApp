import type {
  PracticeQuestion,
  PracticeTestActivityDetail
} from "@/lib/practice/activity-detail.queries";
import {
  DEFAULT_PLACEMENT_SCORING_PROFILE,
  buildPlacementSummary,
  parsePlacementScoringProfile,
  type PlacementBandKey,
  type PlacementSummary
} from "@/lib/practice/placement";
import type {
  GradeableQuestionRow,
  GradeableTestRow
} from "@/lib/practice/practice-attempts.repository";
import type { PracticeAttemptReviewQuestion } from "@/lib/practice/types";
import type { PracticeTestAttemptPayload } from "@/lib/practice/validation";

export type PracticeAttemptPolicyErrorCode =
  | "INCOMPLETE_ATTEMPT"
  | "INVALID_OPTION"
  | "EMPTY_TEST";

export type PracticeAttemptPolicyError = {
  ok: false;
  code: PracticeAttemptPolicyErrorCode;
};

export type ValidatedPracticeAttemptAnswers = {
  ok: true;
  answersByQuestion: Map<string, string>;
};

export type GradedPracticeAttempt = {
  ok: true;
  reviewQuestions: PracticeAttemptReviewQuestion[];
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean;
  assessmentKind: "regular" | "placement";
  placementSummary: PlacementSummary | null;
  timeSpentSeconds: number;
  startedAt: string;
  submittedAtIso: string;
};

export function extractPracticeTestId(activityId: string) {
  const [sourceType, rawId] = activityId.split("_");
  return sourceType === "test" && rawId ? rawId : null;
}

export function validatePracticeAttemptAnswers(
  detail: PracticeTestActivityDetail,
  input: PracticeTestAttemptPayload
): ValidatedPracticeAttemptAnswers | PracticeAttemptPolicyError {
  const answersByQuestion = new Map<string, string>();
  for (const answer of input.answers) {
    answersByQuestion.set(answer.questionId, answer.optionId);
  }

  const allowPartialSubmission =
    Boolean(input.allowPartial) && detail.assessmentKind === "placement";
  if (
    !allowPartialSubmission &&
    answersByQuestion.size !== detail.content.length
  ) {
    return { ok: false, code: "INCOMPLETE_ATTEMPT" };
  }

  for (const question of detail.content) {
    const selectedOptionId = answersByQuestion.get(question.id);
    if (!allowPartialSubmission && !selectedOptionId) {
      return { ok: false, code: "INCOMPLETE_ATTEMPT" };
    }
    if (!selectedOptionId) continue;
    if (!question.options.some((option) => option.id === selectedOptionId)) {
      return { ok: false, code: "INVALID_OPTION" };
    }
  }

  return { ok: true, answersByQuestion };
}

function toPlacementBand(value: string | null): PlacementBandKey | null {
  return value === "beginner" ||
    value === "elementary" ||
    value === "pre_intermediate" ||
    value === "intermediate" ||
    value === "upper_intermediate" ||
    value === "advanced"
    ? value
    : null;
}

function buildQuestionMap(detail: PracticeTestActivityDetail) {
  return new Map<string, PracticeQuestion>(
    detail.content.map((question) => [question.id, question])
  );
}

export function gradePracticeAttempt(input: {
  detail: PracticeTestActivityDetail;
  test: GradeableTestRow;
  answersByQuestion: Map<string, string>;
  timeSpentSeconds?: number;
  submittedAt?: Date;
}): GradedPracticeAttempt | PracticeAttemptPolicyError {
  const questionMap = buildQuestionMap(input.detail);
  const gradingQuestions = [...(input.test.test_questions ?? [])].sort(
    (left, right) =>
      Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0)
  );
  const reviewQuestions = gradingQuestions.map((question) =>
    buildReviewQuestion(question, questionMap, input.answersByQuestion)
  );
  const totalQuestions = reviewQuestions.length;
  if (totalQuestions === 0) {
    return { ok: false, code: "EMPTY_TEST" };
  }

  const correctAnswers = reviewQuestions.filter(
    (question) => question.isCorrect
  ).length;
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  const passed = score >= input.detail.passingScore;
  const assessmentKind =
    input.test.assessment_kind === "placement" ? "placement" : "regular";
  const placementSummary =
    assessmentKind === "placement"
      ? buildPlacementSummary(
          correctAnswers,
          reviewQuestions,
          parsePlacementScoringProfile(input.test.scoring_profile) ??
            input.detail.scoringProfile ??
            DEFAULT_PLACEMENT_SCORING_PROFILE
        )
      : null;
  const submittedAt = input.submittedAt ?? new Date();
  const timeSpentSeconds = Math.max(0, Number(input.timeSpentSeconds ?? 0));

  return {
    ok: true,
    reviewQuestions,
    totalQuestions,
    correctAnswers,
    score,
    passed,
    assessmentKind,
    placementSummary,
    timeSpentSeconds,
    startedAt: new Date(
      submittedAt.getTime() - timeSpentSeconds * 1000
    ).toISOString(),
    submittedAtIso: submittedAt.toISOString()
  };
}

function buildReviewQuestion(
  question: GradeableQuestionRow,
  questionMap: Map<string, PracticeQuestion>,
  answersByQuestion: Map<string, string>
): PracticeAttemptReviewQuestion {
  const questionId = String(question.id);
  const selectedOptionId = answersByQuestion.get(questionId) ?? null;
  const options = question.test_question_options ?? [];
  const selectedOption =
    options.find((option) => String(option.id) === selectedOptionId) ?? null;
  const correctOption =
    options.find((option) => Boolean(option.is_correct)) ?? null;

  return {
    questionId,
    prompt: question.prompt ?? questionMap.get(questionId)?.prompt ?? "",
    explanation:
      question.explanation ??
      questionMap.get(questionId)?.explanation ??
      null,
    selectedOptionId,
    selectedOptionText: selectedOption?.option_text ?? null,
    correctOptionId: correctOption ? String(correctOption.id) : null,
    correctOptionText: correctOption?.option_text ?? null,
    isCorrect: Boolean(
      selectedOption && correctOption && selectedOption.id === correctOption.id
    ),
    placementBand: toPlacementBand(question.placement_band)
  };
}

