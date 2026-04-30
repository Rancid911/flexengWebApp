import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentStudentProfileMock = vi.fn();
const getPracticeActivityDetailMock = vi.fn();
const createAdminClientMock = vi.fn();
const revalidatePathMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args)
}));

vi.mock("@/lib/students/current-student", () => ({
  getCurrentStudentProfile: () => getCurrentStudentProfileMock()
}));

vi.mock("@/lib/practice/queries", () => ({
  getPracticeActivityDetail: (...args: unknown[]) => getPracticeActivityDetailMock(...args)
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock()
}));

describe("submitPracticeTestAttempt", () => {
  beforeEach(() => {
    getCurrentStudentProfileMock.mockReset();
    getPracticeActivityDetailMock.mockReset();
    createAdminClientMock.mockReset();
    revalidatePathMock.mockReset();
  });

  it("allows partial placement submission after timeout and grades missing answers as incorrect", async () => {
    getCurrentStudentProfileMock.mockResolvedValue({ studentId: "student-1" });
    getPracticeActivityDetailMock.mockResolvedValue({
      id: "test_11111111-1111-1111-1111-111111111111",
      sourceType: "test",
      activityType: "test",
      assessmentKind: "placement",
      title: "Placement test",
      description: null,
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
          prompt: "Question 1",
          explanation: null,
          questionType: "single_choice",
          sortOrder: 1,
          placementBand: "beginner",
          options: [
            { id: "33333333-3333-3333-3333-333333333333", optionText: "Correct", sortOrder: 1 },
            { id: "44444444-4444-4444-4444-444444444444", optionText: "Wrong", sortOrder: 2 }
          ]
        },
        {
          id: "55555555-5555-5555-5555-555555555555",
          prompt: "Question 2",
          explanation: null,
          questionType: "single_choice",
          sortOrder: 2,
          placementBand: "elementary",
          options: [
            { id: "66666666-6666-6666-6666-666666666666", optionText: "Correct", sortOrder: 1 },
            { id: "77777777-7777-7777-7777-777777777777", optionText: "Wrong", sortOrder: 2 }
          ]
        }
      ]
    });

    const testsMaybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        module_id: null,
        assessment_kind: "placement",
        scoring_profile: null,
        test_questions: [
          {
            id: "22222222-2222-2222-2222-222222222222",
            prompt: "Question 1",
            explanation: null,
            question_type: "single_choice",
            placement_band: "beginner",
            sort_order: 1,
            test_question_options: [
              { id: "33333333-3333-3333-3333-333333333333", option_text: "Correct", is_correct: true, sort_order: 1 },
              { id: "44444444-4444-4444-4444-444444444444", option_text: "Wrong", is_correct: false, sort_order: 2 }
            ]
          },
          {
            id: "55555555-5555-5555-5555-555555555555",
            prompt: "Question 2",
            explanation: null,
            question_type: "single_choice",
            placement_band: "elementary",
            sort_order: 2,
            test_question_options: [
              { id: "66666666-6666-6666-6666-666666666666", option_text: "Correct", is_correct: true, sort_order: 1 },
              { id: "77777777-7777-7777-7777-777777777777", option_text: "Wrong", is_correct: false, sort_order: 2 }
            ]
          }
        ]
      },
      error: null
    });
    const attemptsInsertSingleMock = vi.fn().mockResolvedValue({ data: { id: "attempt-1" }, error: null });
    const answersInsertMock = vi.fn().mockResolvedValue({ error: null });
    const homeworkAssignmentsSelectEqMock = vi.fn().mockResolvedValue({ data: [], error: null });

    const makeUpdateChain = () => {
      const chain = {
        eq: vi.fn(() => chain),
        in: vi.fn().mockResolvedValue({ error: null })
      };
      return chain;
    };

    const adminClient = {
      from: vi.fn((table: string) => {
        if (table === "tests") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: testsMaybeSingleMock
              }))
            }))
          };
        }

        if (table === "student_test_attempts") {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: attemptsInsertSingleMock
              }))
            }))
          };
        }

        if (table === "student_test_answers") {
          return {
            insert: answersInsertMock
          };
        }

        if (table === "homework_assignments") {
          return {
            select: vi.fn(() => ({
              eq: homeworkAssignmentsSelectEqMock
            }))
          };
        }

        if (table === "student_mistakes") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn().mockResolvedValue({ data: [], error: null })
              }))
            })),
            insert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn(() => makeUpdateChain())
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      })
    };

    createAdminClientMock.mockReturnValue(adminClient);

    const { submitPracticeTestAttempt } = await import("@/lib/practice/attempts");
    const result = await submitPracticeTestAttempt({
      activityId: "test_11111111-1111-1111-1111-111111111111",
      answers: [
        {
          questionId: "22222222-2222-2222-2222-222222222222",
          optionId: "33333333-3333-3333-3333-333333333333"
        }
      ],
      allowPartial: true,
      timeSpentSeconds: 1800
    });

    expect(result.totalQuestions).toBe(2);
    expect(result.correctAnswers).toBe(1);
    expect(result.score).toBe(50);
    expect(result.questions).toHaveLength(2);
    expect(result.questions[1]?.selectedOptionId).toBeNull();
  });
});
