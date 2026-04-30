import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { syncHomeworkProgressForCompletedTest } from "@/lib/homework/assignments.service";
import { getCurrentStudentProfile } from "@/lib/students/current-student";
import { getPracticeActivityDetail, type PracticeQuestion, type PracticeTestActivityDetail } from "@/lib/practice/queries";
import { PracticeHttpError } from "@/lib/practice/http";
import { DEFAULT_PLACEMENT_SCORING_PROFILE, buildPlacementSummary, parsePlacementScoringProfile } from "@/lib/practice/placement";
import type { PracticeAttemptResult, PracticeAttemptReviewQuestion } from "@/lib/practice/types";
import type { PracticeTestAttemptPayload } from "@/lib/practice/validation";

type GradeableOptionRow = {
  id: string;
  option_text: string | null;
  is_correct: boolean | null;
  sort_order: number | null;
};

type GradeableQuestionRow = {
  id: string;
  prompt: string | null;
  explanation: string | null;
  question_type: string | null;
  placement_band: string | null;
  sort_order: number | null;
  test_question_options: GradeableOptionRow[] | null;
};

function extractTestId(activityId: string) {
  const [sourceType, rawId] = activityId.split("_");
  return sourceType === "test" && rawId ? rawId : null;
}

function buildQuestionMap(detail: PracticeTestActivityDetail) {
  const map = new Map<string, PracticeQuestion>();
  for (const question of detail.content) {
    map.set(question.id, question);
  }
  return map;
}


export async function submitPracticeTestAttempt(input: PracticeTestAttemptPayload): Promise<PracticeAttemptResult> {
  const studentProfile = await getCurrentStudentProfile();
  if (!studentProfile?.studentId) {
    throw new PracticeHttpError(401, "UNAUTHORIZED", "Student authentication required");
  }

  const detail = await getPracticeActivityDetail(input.activityId);
  if (!detail || detail.sourceType !== "test") {
    throw new PracticeHttpError(404, "ACTIVITY_NOT_FOUND", "Practice activity not found");
  }
  if (!detail.isSupported) {
    throw new PracticeHttpError(400, "UNSUPPORTED_QUESTION_TYPE", "This activity contains unsupported question types");
  }

  const testId = extractTestId(input.activityId);
  if (!testId) {
    throw new PracticeHttpError(400, "INVALID_ACTIVITY_ID", "Invalid activity id");
  }

  const answersByQuestion = new Map<string, string>();
  for (const answer of input.answers) {
    answersByQuestion.set(answer.questionId, answer.optionId);
  }

  const questionMap = buildQuestionMap(detail);
  const allowPartialSubmission = Boolean(input.allowPartial) && detail.assessmentKind === "placement";
  if (!allowPartialSubmission && answersByQuestion.size !== detail.content.length) {
    throw new PracticeHttpError(400, "INCOMPLETE_ATTEMPT", "All questions must be answered before submission");
  }

  for (const question of detail.content) {
    const selectedOptionId = answersByQuestion.get(question.id);
    if (!allowPartialSubmission && !selectedOptionId) {
      throw new PracticeHttpError(400, "INCOMPLETE_ATTEMPT", "All questions must be answered before submission");
    }
    if (!selectedOptionId) {
      continue;
    }
    if (!question.options.some((option) => option.id === selectedOptionId)) {
      throw new PracticeHttpError(400, "INVALID_OPTION", "Selected option does not belong to the question");
    }
  }

  const admin = createAdminClient();
  const testResponse = await admin
    .from("tests")
    .select("module_id, assessment_kind, scoring_profile, test_questions(id, prompt, explanation, question_type, placement_band, sort_order, test_question_options(id, option_text, is_correct, sort_order))")
    .eq("id", testId)
    .maybeSingle();
  if (testResponse.error || !testResponse.data) {
    throw new PracticeHttpError(500, "TEST_LOAD_FAILED", "Failed to load test for grading", testResponse.error?.message);
  }

  const moduleId = testResponse.data.module_id ? String(testResponse.data.module_id) : null;
  let courseId: string | null = null;
  if (moduleId) {
    const moduleResponse = await admin.from("course_modules").select("course_id").eq("id", moduleId).maybeSingle();
    if (!moduleResponse.error) {
      courseId = moduleResponse.data?.course_id ? String(moduleResponse.data.course_id) : null;
    }
  }

  const gradingQuestions = ((testResponse.data.test_questions ?? []) as GradeableQuestionRow[]).sort(
    (left, right) => Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0)
  );

  const reviewQuestions: PracticeAttemptReviewQuestion[] = gradingQuestions.map((question) => {
    const questionId = String(question.id);
    const selectedOptionId = answersByQuestion.get(questionId) ?? null;
    const options = (question.test_question_options ?? []) as GradeableOptionRow[];
    const selectedOption = options.find((option) => String(option.id) === selectedOptionId) ?? null;
    const correctOption = options.find((option) => Boolean(option.is_correct)) ?? null;

    return {
      questionId,
      prompt: question.prompt ?? questionMap.get(questionId)?.prompt ?? "",
      explanation: question.explanation ?? questionMap.get(questionId)?.explanation ?? null,
      selectedOptionId,
      selectedOptionText: selectedOption?.option_text ?? null,
      correctOptionId: correctOption ? String(correctOption.id) : null,
      correctOptionText: correctOption?.option_text ?? null,
      isCorrect: Boolean(selectedOption && correctOption && selectedOption.id === correctOption.id),
      placementBand:
        question.placement_band === "beginner" ||
        question.placement_band === "elementary" ||
        question.placement_band === "pre_intermediate" ||
        question.placement_band === "intermediate" ||
        question.placement_band === "upper_intermediate" ||
        question.placement_band === "advanced"
          ? question.placement_band
          : null
    };
  });

  const totalQuestions = reviewQuestions.length;
  if (totalQuestions === 0) {
    throw new PracticeHttpError(400, "EMPTY_TEST", "This activity does not contain any questions");
  }

  const correctAnswers = reviewQuestions.filter((question) => question.isCorrect).length;
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  const passed = score >= detail.passingScore;
  const assessmentKind = testResponse.data.assessment_kind === "placement" ? "placement" : "regular";
  const placementSummary =
    assessmentKind === "placement"
      ? buildPlacementSummary(
          correctAnswers,
          reviewQuestions,
          parsePlacementScoringProfile(testResponse.data.scoring_profile) ?? detail.scoringProfile ?? DEFAULT_PLACEMENT_SCORING_PROFILE
        )
      : null;
  const submittedAt = new Date();
  const timeSpentSeconds = Math.max(0, Number(input.timeSpentSeconds ?? 0));
  const startedAt = new Date(submittedAt.getTime() - timeSpentSeconds * 1000).toISOString();
  const submittedAtIso = submittedAt.toISOString();

  const attemptResponse = await admin
    .from("student_test_attempts")
    .insert({
      student_id: studentProfile.studentId,
      test_id: testId,
      score,
      correct_answers: correctAnswers,
      total_questions: totalQuestions,
      status: passed ? "passed" : "failed",
      recommended_level: placementSummary?.recommendedLevel ?? null,
      recommended_band_label: placementSummary?.recommendedBandLabel ?? null,
      placement_summary: placementSummary,
      started_at: startedAt,
      submitted_at: submittedAtIso,
      time_spent_seconds: timeSpentSeconds
    })
    .select("id")
    .single();
  if (attemptResponse.error || !attemptResponse.data) {
    throw new PracticeHttpError(500, "ATTEMPT_CREATE_FAILED", "Failed to save test attempt", attemptResponse.error?.message);
  }
  const attemptId = String(attemptResponse.data.id);

  const answersResponse = await admin.from("student_test_answers").insert(
    reviewQuestions.map((question) => ({
      attempt_id: attemptId,
      question_id: question.questionId,
      selected_option_id: question.selectedOptionId,
      answer_text: null,
      is_correct: question.isCorrect
    }))
  );
  if (answersResponse.error) {
    throw new PracticeHttpError(500, "ATTEMPT_ANSWERS_SAVE_FAILED", "Failed to save test answers", answersResponse.error.message);
  }

  const wrongQuestions = reviewQuestions.filter((question) => !question.isCorrect);
  if (wrongQuestions.length > 0) {
    const existingMistakesResponse = await admin
      .from("student_mistakes")
      .select("id, question_id, mistake_count")
      .eq("student_id", studentProfile.studentId)
      .in(
        "question_id",
        wrongQuestions.map((question) => question.questionId)
      );
    const existingMistakes = new Map(
      ((existingMistakesResponse.data ?? []) as Array<{ id: string; question_id: string; mistake_count: number | null }>).map((row) => [
        String(row.question_id),
        { id: String(row.id), mistakeCount: Number(row.mistake_count ?? 1) }
      ])
    );

    for (const question of wrongQuestions) {
      const existing = existingMistakes.get(question.questionId);
      if (existing) {
        await admin
          .from("student_mistakes")
          .update({
            attempt_id: attemptId,
            test_id: testId,
            module_id: moduleId,
            course_id: courseId,
            mistake_count: existing.mistakeCount + 1,
            last_mistake_at: submittedAtIso,
            resolved_at: null
          })
          .eq("id", existing.id);
      } else {
        await admin.from("student_mistakes").insert({
          student_id: studentProfile.studentId,
          attempt_id: attemptId,
          test_id: testId,
          question_id: question.questionId,
          course_id: courseId,
          module_id: moduleId,
          mistake_count: 1,
          last_mistake_at: submittedAtIso,
          resolved_at: null
        });
      }
    }
  }

  const resolvedQuestionIds = reviewQuestions.filter((question) => question.isCorrect).map((question) => question.questionId);
  if (resolvedQuestionIds.length > 0) {
    await admin
      .from("student_mistakes")
      .update({ resolved_at: submittedAtIso, attempt_id: attemptId, test_id: testId })
      .eq("student_id", studentProfile.studentId)
      .in("question_id", resolvedQuestionIds);
  }

  await syncHomeworkProgressForCompletedTest(studentProfile.studentId, testId, submittedAtIso, startedAt);

  revalidatePath("/dashboard");
  revalidatePath("/practice");
  revalidatePath("/practice/catalog");
  revalidatePath("/homework");
  revalidatePath("/progress/overview");
  revalidatePath("/schedule");
  revalidatePath(`/students/${studentProfile.studentId}`);
  revalidatePath(input.activityId.startsWith("test_") ? `/practice/activity/${input.activityId}` : "/practice");

  return {
    attemptId,
    score,
    correctAnswers,
    totalQuestions,
    passed,
    passingScore: detail.passingScore,
    questions: reviewQuestions,
    assessmentKind,
    recommendedLevel: placementSummary?.recommendedLevel ?? null,
    recommendedBandLabel: placementSummary?.recommendedBandLabel ?? null,
    sectionScores: placementSummary?.sectionScores ?? []
  };
}
