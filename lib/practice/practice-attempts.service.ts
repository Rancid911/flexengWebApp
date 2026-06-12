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

function throwPolicyError(code: PracticeAttemptPolicyErrorCode): never {
  throw new PracticeHttpError(400, code, POLICY_ERROR_MESSAGES[code]);
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

  const attemptResponse = await infrastructure.repository.createAttempt({
    student_id: studentContext.studentId,
    test_id: testId,
    score: grading.score,
    correct_answers: grading.correctAnswers,
    total_questions: grading.totalQuestions,
    status: grading.passed ? "passed" : "failed",
    recommended_level: grading.placementSummary?.recommendedLevel ?? null,
    recommended_band_label:
      grading.placementSummary?.recommendedBandLabel ?? null,
    placement_summary: grading.placementSummary,
    started_at: grading.startedAt,
    submitted_at: grading.submittedAtIso,
    time_spent_seconds: grading.timeSpentSeconds
  });
  if (attemptResponse.error || !attemptResponse.data) {
    throw new PracticeHttpError(
      500,
      "ATTEMPT_CREATE_FAILED",
      "Failed to save test attempt",
      attemptResponse.error?.message
    );
  }
  const attemptId = String(attemptResponse.data.id);

  const answersResponse = await infrastructure.repository.createAnswers(
    grading.reviewQuestions.map((question) => ({
      attempt_id: attemptId,
      question_id: question.questionId,
      selected_option_id: question.selectedOptionId,
      answer_text: null,
      is_correct: question.isCorrect
    }))
  );
  if (answersResponse.error) {
    throw new PracticeHttpError(
      500,
      "ATTEMPT_ANSWERS_SAVE_FAILED",
      "Failed to save test answers",
      answersResponse.error.message
    );
  }

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

