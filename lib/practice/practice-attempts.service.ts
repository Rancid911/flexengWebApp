import { revalidatePath } from "next/cache";

import {
  extractPracticeTestId,
  gradePracticeAttempt,
  validatePracticeAttemptAnswers,
  type PracticeAttemptPolicyErrorCode
} from "@/lib/practice/practice-attempts-grading.policy";
import {
  createPracticeAttemptsInfrastructure,
  type PracticeAttemptsInfrastructure
} from "@/lib/practice/practice-attempts.infrastructure";
import type {
  AtomicPracticeAttemptResult,
  ExistingMistakeRow,
  GradeableTestRow
} from "@/lib/practice/practice-attempts.repository";
import { PracticeHttpError } from "@/lib/practice/http";
import {
  getPracticeActivityDetail,
  type PracticeTestActivityDetail
} from "@/lib/practice/queries";
import type { PracticeAttemptResult } from "@/lib/practice/types";
import type { PracticeTestAttemptPayload } from "@/lib/practice/validation";
import { getCurrentRealStudentWriteContext } from "@/lib/students/current-student";

const POLICY_ERROR_MESSAGES: Record<PracticeAttemptPolicyErrorCode, string> = {
  INCOMPLETE_ATTEMPT: "All questions must be answered before submission",
  INVALID_OPTION: "Selected option does not belong to the question",
  EMPTY_TEST: "This activity does not contain any questions"
};

const ATOMIC_ATTEMPT_ERROR_MAP = {
  FORBIDDEN: {
    status: 403,
    message: "Real student write context required"
  },
  UNSUPPORTED_QUESTION_TYPE: {
    status: 400,
    message: "This activity contains unsupported question types"
  },
  INCOMPLETE_ATTEMPT: {
    status: 400,
    message: POLICY_ERROR_MESSAGES.INCOMPLETE_ATTEMPT
  },
  INVALID_OPTION: {
    status: 400,
    message: POLICY_ERROR_MESSAGES.INVALID_OPTION
  },
  EMPTY_TEST: {
    status: 400,
    message: POLICY_ERROR_MESSAGES.EMPTY_TEST
  },
  TEST_LOAD_FAILED: {
    status: 500,
    message: "Failed to load test for grading"
  },
  ATTEMPT_CREATE_FAILED: {
    status: 500,
    message: "Failed to save test attempt"
  },
  ATTEMPT_ANSWERS_SAVE_FAILED: {
    status: 500,
    message: "Failed to save test answers"
  }
} as const;

function throwPolicyError(code: PracticeAttemptPolicyErrorCode): never {
  throw new PracticeHttpError(400, code, POLICY_ERROR_MESSAGES[code]);
}

function throwAtomicAttemptError(error: { message?: string | null }): never {
  const details = error.message ?? "Atomic practice attempt RPC failed";
  const code = Object.keys(ATOMIC_ATTEMPT_ERROR_MAP).find(
    (candidate) =>
      details === candidate || details.startsWith(`${candidate}:`)
  ) as keyof typeof ATOMIC_ATTEMPT_ERROR_MAP | undefined;

  if (!code) {
    throw new PracticeHttpError(
      500,
      "ATTEMPT_CREATE_FAILED",
      "Failed to save test attempt",
      details
    );
  }

  const mapped = ATOMIC_ATTEMPT_ERROR_MAP[code];
  throw new PracticeHttpError(mapped.status, code, mapped.message, details);
}

function normalizeSectionScores(
  sectionScores: AtomicPracticeAttemptResult["sectionScores"]
) {
  return sectionScores.map((section) => ({
    key: section.key,
    label: section.label,
    correctAnswers: Number(section.correctAnswers),
    totalQuestions: Number(section.totalQuestions)
  }));
}

function hasMatchingAuthoritativeGrading(
  atomicResult: AtomicPracticeAttemptResult,
  grading: Extract<
    ReturnType<typeof gradePracticeAttempt>,
    { ok: true }
  >
) {
  if (
    typeof atomicResult.attemptId !== "string" ||
    atomicResult.attemptId.length === 0 ||
    !Array.isArray(atomicResult.answers) ||
    !Array.isArray(atomicResult.sectionScores)
  ) {
    return false;
  }

  const localAnswers = grading.reviewQuestions.map((question) => ({
    questionId: question.questionId,
    selectedOptionId: question.selectedOptionId,
    isCorrect: question.isCorrect
  }));
  const atomicAnswers = atomicResult.answers.map((answer) => ({
    questionId: String(answer.questionId),
    selectedOptionId: answer.selectedOptionId
      ? String(answer.selectedOptionId)
      : null,
    isCorrect: Boolean(answer.isCorrect)
  }));
  const localSections = grading.placementSummary?.sectionScores ?? [];
  const atomicSections = normalizeSectionScores(atomicResult.sectionScores);

  return (
    Number(atomicResult.score) === grading.score &&
    Number(atomicResult.correctAnswers) === grading.correctAnswers &&
    Number(atomicResult.totalQuestions) === grading.totalQuestions &&
    Boolean(atomicResult.passed) === grading.passed &&
    atomicResult.assessmentKind === grading.assessmentKind &&
    (atomicResult.recommendedLevel ?? null) ===
      (grading.placementSummary?.recommendedLevel ?? null) &&
    (atomicResult.recommendedBandLabel ?? null) ===
      (grading.placementSummary?.recommendedBandLabel ?? null) &&
    JSON.stringify(atomicAnswers) === JSON.stringify(localAnswers) &&
    JSON.stringify(atomicSections) === JSON.stringify(localSections)
  );
}

async function loadCourseId(
  infrastructure: PracticeAttemptsInfrastructure,
  moduleId: string | null
) {
  if (!moduleId) return null;

  const response =
    await infrastructure.repository.loadCourseIdForModule(moduleId);
  if (response.error) return null;
  return response.data?.course_id ? String(response.data.course_id) : null;
}

async function updateMistakeProjection(input: {
  infrastructure: PracticeAttemptsInfrastructure;
  studentId: string;
  testId: string;
  attemptId: string;
  moduleId: string | null;
  courseId: string | null;
  submittedAtIso: string;
  questions: PracticeAttemptResult["questions"];
}) {
  const wrongQuestions = input.questions.filter(
    (question) => !question.isCorrect
  );

  if (wrongQuestions.length > 0) {
    const response = await input.infrastructure.repository.loadExistingMistakes(
      input.studentId,
      wrongQuestions.map((question) => question.questionId)
    );
    const existingMistakes = new Map(
      ((response.data ?? []) as ExistingMistakeRow[]).map((row) => [
        String(row.question_id),
        {
          id: String(row.id),
          mistakeCount: Number(row.mistake_count ?? 1)
        }
      ])
    );

    for (const question of wrongQuestions) {
      const existing = existingMistakes.get(question.questionId);
      if (existing) {
        await input.infrastructure.repository.updateMistake(existing.id, {
          attempt_id: input.attemptId,
          test_id: input.testId,
          module_id: input.moduleId,
          course_id: input.courseId,
          mistake_count: existing.mistakeCount + 1,
          last_mistake_at: input.submittedAtIso,
          resolved_at: null
        });
      } else {
        await input.infrastructure.repository.createMistake({
          student_id: input.studentId,
          attempt_id: input.attemptId,
          test_id: input.testId,
          question_id: question.questionId,
          course_id: input.courseId,
          module_id: input.moduleId,
          mistake_count: 1,
          last_mistake_at: input.submittedAtIso,
          resolved_at: null
        });
      }
    }
  }

  const resolvedQuestionIds = input.questions
    .filter((question) => question.isCorrect)
    .map((question) => question.questionId);
  if (resolvedQuestionIds.length > 0) {
    await input.infrastructure.repository.resolveMistakes(
      input.studentId,
      resolvedQuestionIds,
      {
        resolved_at: input.submittedAtIso,
        attempt_id: input.attemptId,
        test_id: input.testId
      }
    );
  }
}

function revalidatePracticeAttemptPaths(
  studentId: string,
  activityId: string
) {
  revalidatePath("/dashboard");
  revalidatePath("/practice");
  revalidatePath("/practice/catalog");
  revalidatePath("/homework");
  revalidatePath("/progress/overview");
  revalidatePath("/schedule");
  revalidatePath(`/students/${studentId}`);
  revalidatePath(
    activityId.startsWith("test_")
      ? `/practice/activity/${activityId}`
      : "/practice"
  );
}

export async function submitPracticeTestAttempt(
  input: PracticeTestAttemptPayload
): Promise<PracticeAttemptResult> {
  const studentContext = await getCurrentRealStudentWriteContext(
    "practice.attempts.submit"
  );

  const detail = await getPracticeActivityDetail(input.activityId);
  if (!detail || detail.sourceType !== "test") {
    throw new PracticeHttpError(
      404,
      "ACTIVITY_NOT_FOUND",
      "Practice activity not found"
    );
  }
  if (!detail.isSupported) {
    throw new PracticeHttpError(
      400,
      "UNSUPPORTED_QUESTION_TYPE",
      "This activity contains unsupported question types"
    );
  }

  const testId = extractPracticeTestId(input.activityId);
  if (!testId) {
    throw new PracticeHttpError(
      400,
      "INVALID_ACTIVITY_ID",
      "Invalid activity id"
    );
  }

  const validation = validatePracticeAttemptAnswers(detail, input);
  if (!validation.ok) {
    throwPolicyError(validation.code);
  }

  const infrastructure = await createPracticeAttemptsInfrastructure();
  const testResponse =
    await infrastructure.repository.loadTestForGrading(testId);
  if (testResponse.error || !testResponse.data) {
    throw new PracticeHttpError(
      500,
      "TEST_LOAD_FAILED",
      "Failed to load test for grading",
      testResponse.error?.message
    );
  }

  const test = testResponse.data as GradeableTestRow;
  const moduleId = test.module_id ? String(test.module_id) : null;
  const courseId = await loadCourseId(infrastructure, moduleId);
  const grading = gradePracticeAttempt({
    detail: detail as PracticeTestActivityDetail,
    test,
    answersByQuestion: validation.answersByQuestion,
    timeSpentSeconds: input.timeSpentSeconds
  });
  if (!grading.ok) {
    throwPolicyError(grading.code);
  }

  const attemptResponse =
    await infrastructure.repository.createAtomicAttempt({
      testId,
      answers: input.answers,
      allowPartial: Boolean(input.allowPartial),
      startedAt: grading.startedAt,
      submittedAt: grading.submittedAtIso,
      timeSpentSeconds: grading.timeSpentSeconds
    });
  if (attemptResponse.error) {
    throwAtomicAttemptError(attemptResponse.error);
  }
  if (
    !attemptResponse.data ||
    !hasMatchingAuthoritativeGrading(attemptResponse.data, grading)
  ) {
    throw new PracticeHttpError(
      500,
      "TEST_LOAD_FAILED",
      "Failed to load test for grading",
      "Atomic practice attempt grading did not match local grading"
    );
  }
  const attemptId = attemptResponse.data.attemptId;

  await updateMistakeProjection({
    infrastructure,
    studentId: studentContext.studentId,
    testId,
    attemptId,
    moduleId,
    courseId,
    submittedAtIso: grading.submittedAtIso,
    questions: grading.reviewQuestions
  });

  await infrastructure.syncHomeworkProgress(
    studentContext.studentId,
    testId,
    grading.submittedAtIso,
    grading.startedAt
  );

  revalidatePracticeAttemptPaths(studentContext.studentId, input.activityId);

  return {
    attemptId,
    score: grading.score,
    correctAnswers: grading.correctAnswers,
    totalQuestions: grading.totalQuestions,
    passed: grading.passed,
    passingScore: detail.passingScore,
    questions: grading.reviewQuestions,
    assessmentKind: grading.assessmentKind,
    recommendedLevel: grading.placementSummary?.recommendedLevel ?? null,
    recommendedBandLabel:
      grading.placementSummary?.recommendedBandLabel ?? null,
    sectionScores: grading.placementSummary?.sectionScores ?? []
  };
}
