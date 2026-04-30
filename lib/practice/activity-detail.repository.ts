import { createClient } from "@/lib/supabase/server";

export type PracticeActivityDetailRepositoryClient = Awaited<ReturnType<typeof createClient>>;

export type PracticeLessonActivityDetailRow = {
  id: string;
  title: string | null;
  description: string | null;
  content: unknown;
  duration_minutes: number | null;
  lesson_type: string | null;
};

export type PracticeActivityDetailCourseModuleRow = {
  id?: string | null;
  title?: string | null;
  courses?: { slug?: string | null } | Array<{ slug?: string | null }> | null;
};

export type PracticeTestQuestionOptionRow = {
  id: string;
  option_text: string | null;
  is_correct?: boolean | null;
  sort_order?: number | null;
};

export type PracticeTestQuestionRow = {
  id: string;
  prompt: string | null;
  explanation: string | null;
  question_type: string | null;
  placement_band?: string | null;
  sort_order?: number | null;
  test_question_options?: PracticeTestQuestionOptionRow[] | null;
};

export type PracticeTestActivityDetailRow = {
  id: string;
  module_id: string | null;
  title: string | null;
  description: string | null;
  activity_type?: string | null;
  assessment_kind?: string | null;
  scoring_profile?: unknown;
  cefr_level?: string | null;
  drill_topic_key?: string | null;
  drill_kind?: string | null;
  lesson_reinforcement?: boolean | null;
  passing_score?: number | null;
  time_limit_minutes?: number | null;
  course_modules?: PracticeActivityDetailCourseModuleRow | PracticeActivityDetailCourseModuleRow[] | null;
  test_questions?: PracticeTestQuestionRow[] | null;
};

export function createPracticeActivityDetailRepository(client: PracticeActivityDetailRepositoryClient) {
  return {
    async loadLessonDetail(lessonId: string) {
      return await client
        .from("lessons")
        .select("id, title, description, content, duration_minutes, lesson_type")
        .eq("id", lessonId)
        .maybeSingle();
    },

    async loadTestDetail(testId: string) {
      return await client
        .from("tests")
        .select(
          "id, module_id, title, description, activity_type, assessment_kind, scoring_profile, cefr_level, drill_topic_key, drill_kind, lesson_reinforcement, passing_score, time_limit_minutes, course_modules(id, title, courses(slug)), test_questions(id, prompt, explanation, question_type, placement_band, sort_order, test_question_options(id, option_text, is_correct, sort_order))"
        )
        .eq("id", testId)
        .maybeSingle();
    }
  };
}
