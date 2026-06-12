import { createClient } from "@/lib/supabase/server";

export type PracticeAttemptsRepositoryClient = Awaited<
  ReturnType<typeof createClient>
>;

export type GradeableOptionRow = {
  id: string;
  option_text: string | null;
  is_correct: boolean | null;
  sort_order: number | null;
};

export type GradeableQuestionRow = {
  id: string;
  prompt: string | null;
  explanation: string | null;
  question_type: string | null;
  placement_band: string | null;
  sort_order: number | null;
  test_question_options: GradeableOptionRow[] | null;
};

export type GradeableTestRow = {
  module_id: string | null;
  assessment_kind: string | null;
  scoring_profile: unknown;
  test_questions: GradeableQuestionRow[] | null;
};

export type ExistingMistakeRow = {
  id: string;
  question_id: string;
  mistake_count: number | null;
};

export type AtomicPracticeAttemptAnswer = {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean;
};

export type AtomicPracticeAttemptSectionScore = {
  key: string;
  label: string;
  correctAnswers: number;
  totalQuestions: number;
};

export type AtomicPracticeAttemptResult = {
  attemptId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  assessmentKind: "regular" | "placement";
  recommendedLevel: string | null;
  recommendedBandLabel: string | null;
  sectionScores: AtomicPracticeAttemptSectionScore[];
  answers: AtomicPracticeAttemptAnswer[];
};

export function createPracticeAttemptsRepository(
  client: PracticeAttemptsRepositoryClient
) {
  return {
    loadTestForGrading(testId: string) {
      return client
        .from("tests")
        .select(
          "module_id, assessment_kind, scoring_profile, test_questions(id, prompt, explanation, question_type, placement_band, sort_order, test_question_options(id, option_text, is_correct, sort_order))"
        )
        .eq("id", testId)
        .maybeSingle();
    },

    loadCourseIdForModule(moduleId: string) {
      return client
        .from("course_modules")
        .select("course_id")
        .eq("id", moduleId)
        .maybeSingle();
    },

    async createAtomicAttempt(input: {
      testId: string;
      answers: Array<{
        questionId: string;
        optionId: string;
      }>;
      allowPartial: boolean;
      startedAt: string;
      submittedAt: string;
      timeSpentSeconds: number;
    }) {
      const response = await client.rpc("submit_practice_test_attempt", {
        p_test_id: input.testId,
        p_answers: input.answers,
        p_allow_partial: input.allowPartial,
        p_started_at: input.startedAt,
        p_submitted_at: input.submittedAt,
        p_time_spent_seconds: input.timeSpentSeconds
      });

      return {
        data: response.data as AtomicPracticeAttemptResult | null,
        error: response.error
      };
    },

    loadExistingMistakes(studentId: string, questionIds: string[]) {
      return client
        .from("student_mistakes")
        .select("id, question_id, mistake_count")
        .eq("student_id", studentId)
        .in("question_id", questionIds);
    },

    updateMistake(
      mistakeId: string,
      payload: {
        attempt_id: string;
        test_id: string;
        module_id: string | null;
        course_id: string | null;
        mistake_count: number;
        last_mistake_at: string;
        resolved_at: null;
      }
    ) {
      return client.from("student_mistakes").update(payload).eq("id", mistakeId);
    },

    createMistake(payload: {
      student_id: string;
      attempt_id: string;
      test_id: string;
      question_id: string;
      course_id: string | null;
      module_id: string | null;
      mistake_count: number;
      last_mistake_at: string;
      resolved_at: null;
    }) {
      return client.from("student_mistakes").insert(payload);
    },

    resolveMistakes(
      studentId: string,
      questionIds: string[],
      payload: {
        resolved_at: string;
        attempt_id: string;
        test_id: string;
      }
    ) {
      return client
        .from("student_mistakes")
        .update(payload)
        .eq("student_id", studentId)
        .in("question_id", questionIds);
    }
  };
}

export async function createUserScopedPracticeAttemptsRepository() {
  return createPracticeAttemptsRepository(await createClient());
}
