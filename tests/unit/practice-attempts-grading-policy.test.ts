import { describe, expect, it } from "vitest";

import type { PracticeTestActivityDetail } from "@/lib/practice/activity-detail.queries";
import {
  gradePracticeAttempt,
  validatePracticeAttemptAnswers
} from "@/lib/practice/practice-attempts-grading.policy";
import type { GradeableTestRow } from "@/lib/practice/practice-attempts.repository";

const QUESTION_1 = "11111111-1111-4111-8111-111111111111";
const QUESTION_2 = "22222222-2222-4222-8222-222222222222";
const OPTION_1 = "33333333-3333-4333-8333-333333333333";
const OPTION_2 = "44444444-4444-4444-8444-444444444444";

function makeDetail(
  overrides: Partial<PracticeTestActivityDetail> = {}
): PracticeTestActivityDetail {
  return {
    id: "test_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    sourceType: "test",
    activityType: "test",
    assessmentKind: "regular",
    title: "Test",
    description: null,
    cefrLevel: "A1",
    drillTopicKey: null,
    drillKind: null,
    lessonReinforcement: false,
    assigned: true,
    meta: "",
    passingScore: 70,
    timeLimitMinutes: 10,
    scoringProfile: null,
    isSupported: true,
    unsupportedQuestionTypes: [],
    sectionHref: null,
    sectionTitle: null,
    content: [
      {
        id: QUESTION_1,
        prompt: "Question one",
        explanation: "Explanation one",
        questionType: "single_choice",
        sortOrder: 1,
        placementBand: "beginner",
        options: [
          { id: OPTION_1, optionText: "Correct", sortOrder: 1 },
          { id: OPTION_2, optionText: "Wrong", sortOrder: 2 }
        ]
      },
      {
        id: QUESTION_2,
        prompt: "Question two",
        explanation: null,
        questionType: "single_choice",
        sortOrder: 2,
        placementBand: "elementary",
        options: [
          { id: OPTION_1, optionText: "Correct", sortOrder: 1 },
          { id: OPTION_2, optionText: "Wrong", sortOrder: 2 }
        ]
      }
    ],
    ...overrides
  };
}

function makeTest(
  overrides: Partial<GradeableTestRow> = {}
): GradeableTestRow {
  return {
    module_id: "module-1",
    assessment_kind: "regular",
    scoring_profile: null,
    test_questions: [
      {
        id: QUESTION_2,
        prompt: null,
        explanation: null,
        question_type: "single_choice",
        placement_band: "elementary",
        sort_order: 2,
        test_question_options: [
          {
            id: OPTION_1,
            option_text: "Correct",
            is_correct: true,
            sort_order: 1
          },
          {
            id: OPTION_2,
            option_text: "Wrong",
            is_correct: false,
            sort_order: 2
          }
        ]
      },
      {
        id: QUESTION_1,
        prompt: "Database question one",
        explanation: null,
        question_type: "single_choice",
        placement_band: "beginner",
        sort_order: 1,
        test_question_options: [
          {
            id: OPTION_1,
            option_text: "Correct",
            is_correct: true,
            sort_order: 1
          },
          {
            id: OPTION_2,
            option_text: "Wrong",
            is_correct: false,
            sort_order: 2
          }
        ]
      }
    ],
    ...overrides
  };
}

describe("practice attempts grading policy", () => {
  it("requires complete regular attempts and validates option ownership", () => {
    expect(
      validatePracticeAttemptAnswers(makeDetail(), {
        activityId: "test_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        answers: [{ questionId: QUESTION_1, optionId: OPTION_1 }]
      })
    ).toEqual({ ok: false, code: "INCOMPLETE_ATTEMPT" });

    expect(
      validatePracticeAttemptAnswers(makeDetail(), {
        activityId: "test_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        answers: [
          { questionId: QUESTION_1, optionId: OPTION_1 },
          {
            questionId: QUESTION_2,
            optionId: "55555555-5555-4555-8555-555555555555"
          }
        ]
      })
    ).toEqual({ ok: false, code: "INVALID_OPTION" });
  });

  it("allows partial answers only for placement attempts", () => {
    const outcome = validatePracticeAttemptAnswers(
      makeDetail({ assessmentKind: "placement" }),
      {
        activityId: "test_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        answers: [{ questionId: QUESTION_1, optionId: OPTION_1 }],
        allowPartial: true
      }
    );

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.answersByQuestion.get(QUESTION_1)).toBe(OPTION_1);
      expect(outcome.answersByQuestion.has(QUESTION_2)).toBe(false);
    }
  });

  it("sorts questions, grades missing placement answers, rounds score, and calculates timestamps", () => {
    const outcome = gradePracticeAttempt({
      detail: makeDetail({
        assessmentKind: "placement",
        passingScore: 50
      }),
      test: makeTest({ assessment_kind: "placement" }),
      answersByQuestion: new Map([[QUESTION_1, OPTION_1]]),
      timeSpentSeconds: 90,
      submittedAt: new Date("2026-06-12T10:00:00.000Z")
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.reviewQuestions.map((question) => question.questionId)).toEqual([
      QUESTION_1,
      QUESTION_2
    ]);
    expect(outcome.reviewQuestions[0]).toMatchObject({
      prompt: "Database question one",
      explanation: "Explanation one",
      selectedOptionId: OPTION_1,
      isCorrect: true
    });
    expect(outcome.reviewQuestions[1]).toMatchObject({
      prompt: "Question two",
      selectedOptionId: null,
      isCorrect: false
    });
    expect(outcome.correctAnswers).toBe(1);
    expect(outcome.totalQuestions).toBe(2);
    expect(outcome.score).toBe(50);
    expect(outcome.passed).toBe(true);
    expect(outcome.assessmentKind).toBe("placement");
    expect(outcome.placementSummary).not.toBeNull();
    expect(outcome.startedAt).toBe("2026-06-12T09:58:30.000Z");
    expect(outcome.submittedAtIso).toBe("2026-06-12T10:00:00.000Z");
  });

  it("returns EMPTY_TEST when authoritative grading data has no questions", () => {
    expect(
      gradePracticeAttempt({
        detail: makeDetail(),
        test: makeTest({ test_questions: [] }),
        answersByQuestion: new Map()
      })
    ).toEqual({ ok: false, code: "EMPTY_TEST" });
  });
});

