import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentRealStudentWriteContextMock = vi.fn();
const getPracticeActivityDetailMock = vi.fn();
const createInfrastructureMock = vi.fn();
const revalidatePathMock = vi.fn();
const calls: string[] = [];

const repository = {
  loadTestForGrading: vi.fn(),
  loadCourseIdForModule: vi.fn(),
  createAttempt: vi.fn(),
  createAnswers: vi.fn(),
  loadExistingMistakes: vi.fn(),
  updateMistake: vi.fn(),
  createMistake: vi.fn(),
  resolveMistakes: vi.fn()
};
const syncHomeworkProgressMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args)
}));

vi.mock("@/lib/students/current-student", () => ({
  getCurrentRealStudentWriteContext: (...args: unknown[]) =>
    getCurrentRealStudentWriteContextMock(...args)
}));

vi.mock("@/lib/practice/queries", () => ({
  getPracticeActivityDetail: (...args: unknown[]) =>
    getPracticeActivityDetailMock(...args)
}));

vi.mock("@/lib/practice/practice-attempts.infrastructure", () => ({
  createPracticeAttemptsInfrastructure: () => createInfrastructureMock()
}));

const QUESTION_1 = "11111111-1111-4111-8111-111111111111";
const QUESTION_2 = "22222222-2222-4222-8222-222222222222";
const OPTION_1 = "33333333-3333-4333-8333-333333333333";
const OPTION_2 = "44444444-4444-4444-8444-444444444444";

function makeDetail(overrides: Record<string, unknown> = {}) {
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
        explanation: null,
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

function makeTest(overrides: Record<string, unknown> = {}) {
  return {
    module_id: "module-1",
    assessment_kind: "regular",
    scoring_profile: null,
    test_questions: [
      {
        id: QUESTION_1,
        prompt: "Question one",
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
      },
      {
        id: QUESTION_2,
        prompt: "Question two",
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
      }
    ],
    ...overrides
  };
}

function validPayload() {
  return {
    activityId: "test_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    answers: [
      { questionId: QUESTION_1, optionId: OPTION_1 },
      { questionId: QUESTION_2, optionId: OPTION_2 }
    ],
    timeSpentSeconds: 42
  };
}

describe("submitPracticeTestAttempt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calls.length = 0;
    getCurrentRealStudentWriteContextMock.mockResolvedValue({
      userId: "profile-1",
      studentId: "student-1"
    });
    getPracticeActivityDetailMock.mockResolvedValue(makeDetail());
    createInfrastructureMock.mockResolvedValue({
      repository,
      syncHomeworkProgress: syncHomeworkProgressMock
    });
    repository.loadTestForGrading.mockResolvedValue({
      data: makeTest(),
      error: null
    });
    repository.loadCourseIdForModule.mockResolvedValue({
      data: { course_id: "course-1" },
      error: null
    });
    repository.createAttempt.mockImplementation(async () => {
      calls.push("attempt");
      return { data: { id: "attempt-1" }, error: null };
    });
    repository.createAnswers.mockImplementation(async () => {
      calls.push("answers");
      return { error: null };
    });
    repository.loadExistingMistakes.mockResolvedValue({
      data: [
        {
          id: "mistake-2",
          question_id: QUESTION_2,
          mistake_count: 2
        }
      ],
      error: null
    });
    repository.updateMistake.mockImplementation(async () => {
      calls.push("update-mistake");
      return { error: null };
    });
    repository.createMistake.mockImplementation(async () => {
      calls.push("create-mistake");
      return { error: null };
    });
    repository.resolveMistakes.mockImplementation(async () => {
      calls.push("resolve-mistakes");
      return { error: null };
    });
    syncHomeworkProgressMock.mockImplementation(async () => {
      calls.push("homework");
    });
    revalidatePathMock.mockImplementation((path: string) => {
      if (path === "/dashboard") calls.push("revalidate");
    });
  });

  it("denies teacher preview before loading activity or infrastructure", async () => {
    getCurrentRealStudentWriteContextMock.mockRejectedValue(
      Object.assign(new Error("Real student write context required"), {
        status: 403,
        code: "FORBIDDEN",
        exposeDetails: true
      })
    );
    const { submitPracticeTestAttempt } = await import(
      "@/lib/practice/practice-attempts.service"
    );

    await expect(
      submitPracticeTestAttempt(validPayload())
    ).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(getPracticeActivityDetailMock).not.toHaveBeenCalled();
    expect(createInfrastructureMock).not.toHaveBeenCalled();
  });

  it.each([
    [null, "ACTIVITY_NOT_FOUND"],
    [makeDetail({ sourceType: "lesson" }), "ACTIVITY_NOT_FOUND"],
    [
      makeDetail({
        isSupported: false,
        unsupportedQuestionTypes: ["free_text"]
      }),
      "UNSUPPORTED_QUESTION_TYPE"
    ]
  ])("maps activity validation errors before infrastructure", async (detail, code) => {
    getPracticeActivityDetailMock.mockResolvedValue(detail);
    const { submitPracticeTestAttempt } = await import(
      "@/lib/practice/practice-attempts.service"
    );

    await expect(
      submitPracticeTestAttempt(validPayload())
    ).rejects.toMatchObject({ code });
    expect(createInfrastructureMock).not.toHaveBeenCalled();
  });

  it("maps incomplete and invalid-option policy errors before infrastructure", async () => {
    const { submitPracticeTestAttempt } = await import(
      "@/lib/practice/practice-attempts.service"
    );

    await expect(
      submitPracticeTestAttempt({
        ...validPayload(),
        answers: [{ questionId: QUESTION_1, optionId: OPTION_1 }]
      })
    ).rejects.toMatchObject({ code: "INCOMPLETE_ATTEMPT" });
    await expect(
      submitPracticeTestAttempt({
        ...validPayload(),
        answers: [
          { questionId: QUESTION_1, optionId: OPTION_1 },
          {
            questionId: QUESTION_2,
            optionId: "55555555-5555-4555-8555-555555555555"
          }
        ]
      })
    ).rejects.toMatchObject({ code: "INVALID_OPTION" });
    expect(createInfrastructureMock).not.toHaveBeenCalled();
  });

  it("maps test load, empty test, attempt, and answer failures", async () => {
    const { submitPracticeTestAttempt } = await import(
      "@/lib/practice/practice-attempts.service"
    );

    repository.loadTestForGrading.mockResolvedValueOnce({
      data: null,
      error: { message: "test failed" }
    });
    await expect(
      submitPracticeTestAttempt(validPayload())
    ).rejects.toMatchObject({ code: "TEST_LOAD_FAILED" });

    repository.loadTestForGrading.mockResolvedValueOnce({
      data: makeTest({ test_questions: [] }),
      error: null
    });
    await expect(
      submitPracticeTestAttempt(validPayload())
    ).rejects.toMatchObject({ code: "EMPTY_TEST" });

    repository.createAttempt.mockResolvedValueOnce({
      data: null,
      error: { message: "attempt failed" }
    });
    await expect(
      submitPracticeTestAttempt(validPayload())
    ).rejects.toMatchObject({ code: "ATTEMPT_CREATE_FAILED" });

    repository.createAnswers.mockResolvedValueOnce({
      error: { message: "answers failed" }
    });
    await expect(
      submitPracticeTestAttempt(validPayload())
    ).rejects.toMatchObject({ code: "ATTEMPT_ANSWERS_SAVE_FAILED" });
  });

  it("preserves placement partial grading and the public response shape", async () => {
    getPracticeActivityDetailMock.mockResolvedValue(
      makeDetail({ assessmentKind: "placement", passingScore: 0 })
    );
    repository.loadTestForGrading.mockResolvedValue({
      data: makeTest({ assessment_kind: "placement", module_id: null }),
      error: null
    });
    const { submitPracticeTestAttempt } = await import(
      "@/lib/practice/practice-attempts.service"
    );

    const result = await submitPracticeTestAttempt({
      activityId: "test_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      answers: [{ questionId: QUESTION_1, optionId: OPTION_1 }],
      allowPartial: true,
      timeSpentSeconds: 1800
    });

    expect(result).toMatchObject({
      attemptId: "attempt-1",
      score: 50,
      correctAnswers: 1,
      totalQuestions: 2,
      passed: true,
      passingScore: 0,
      assessmentKind: "placement"
    });
    expect(result.questions[1]?.selectedOptionId).toBeNull();
    expect(result.recommendedLevel).toBeTruthy();
    expect(repository.loadCourseIdForModule).not.toHaveBeenCalled();
  });

  it("keeps module lookup soft and preserves write order, mistake projections, homework, and revalidation", async () => {
    repository.loadCourseIdForModule.mockResolvedValue({
      data: null,
      error: { message: "module failed" }
    });
    const { submitPracticeTestAttempt } = await import(
      "@/lib/practice/practice-attempts.service"
    );

    const result = await submitPracticeTestAttempt(validPayload());

    expect(result).toMatchObject({
      attemptId: "attempt-1",
      score: 50,
      correctAnswers: 1,
      totalQuestions: 2,
      passed: false
    });
    expect(repository.updateMistake).toHaveBeenCalledWith(
      "mistake-2",
      expect.objectContaining({
        course_id: null,
        mistake_count: 3
      })
    );
    expect(repository.resolveMistakes).toHaveBeenCalledWith(
      "student-1",
      [QUESTION_1],
      expect.objectContaining({
        attempt_id: "attempt-1"
      })
    );
    expect(syncHomeworkProgressMock).toHaveBeenCalledWith(
      "student-1",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      expect.any(String),
      expect.any(String)
    );
    expect(calls).toEqual([
      "attempt",
      "answers",
      "update-mistake",
      "resolve-mistakes",
      "homework",
      "revalidate"
    ]);
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/practice/activity/test_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
    );
  });

  it("keeps returned mistake errors soft but propagates thrown projection errors", async () => {
    repository.updateMistake.mockResolvedValueOnce({
      error: { message: "ignored mistake error" }
    });
    const { submitPracticeTestAttempt } = await import(
      "@/lib/practice/practice-attempts.service"
    );

    await expect(
      submitPracticeTestAttempt(validPayload())
    ).resolves.toMatchObject({ attemptId: "attempt-1" });

    syncHomeworkProgressMock.mockRejectedValueOnce(
      new Error("thrown homework error")
    );
    await expect(
      submitPracticeTestAttempt(validPayload())
    ).rejects.toThrow("thrown homework error");
  });
});
