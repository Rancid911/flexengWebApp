import { createClient } from "@/lib/supabase/server";

export type ProgressRepositoryClient = Awaited<ReturnType<typeof createClient>>;

export type ProgressAssessmentRelation = {
  assessment_kind?: unknown;
  title?: unknown;
};

export type ProgressOverviewAttemptRow = {
  score?: unknown;
  status?: unknown;
  tests?: ProgressAssessmentRelation | ProgressAssessmentRelation[] | null;
};

export type ProgressHistoryRow = {
  id?: unknown;
  score?: unknown;
  status?: unknown;
  created_at?: unknown;
  submitted_at?: unknown;
  tests?: ProgressAssessmentRelation | ProgressAssessmentRelation[] | null;
};

export type ProgressCourseRow = {
  id: string | null;
  title: string | null;
};

export type ProgressModuleRow = {
  id: string | null;
  course_id: string | null;
};

export type ProgressLessonRow = {
  id: string | null;
  module_id: string | null;
  lesson_type: string | null;
};

export type ProgressTestRow = {
  id: string | null;
  module_id: string | null;
  cefr_level?: string | null;
  assessment_kind?: string | null;
};

export type ProgressLessonProgressRow = {
  progress_percent: number | null;
  lessons:
    | {
        module_id?: string | null;
        course_modules?: { course_id?: string | null } | Array<{ course_id?: string | null }> | null;
      }
    | Array<{
        module_id?: string | null;
        course_modules?: { course_id?: string | null } | Array<{ course_id?: string | null }> | null;
      }>
    | null;
};

export type ProgressWeakPointRow = {
  id?: unknown;
  mistake_count?: unknown;
  test_id?: unknown;
  tests?: { title?: unknown } | Array<{ title?: unknown }> | null;
};

export function createProgressRepository(client: ProgressRepositoryClient) {
  return {
    loadCompletedLessonsCount(studentId: string) {
      return client
        .from("student_lesson_progress")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("status", "completed");
    },

    loadCompletedAttempts(studentId: string) {
      return client
        .from("student_test_attempts")
        .select("score, status, tests(assessment_kind)")
        .eq("student_id", studentId)
        .neq("status", "in_progress");
    },

    loadMistakesCount(studentId: string) {
      return client.from("student_mistakes").select("id", { count: "exact", head: true }).eq("student_id", studentId);
    },

    loadHistory(studentId: string) {
      return client
        .from("student_test_attempts")
        .select("id, score, status, created_at, submitted_at, tests(title, assessment_kind)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(50);
    },

    loadPublishedCourses() {
      return client.from("courses").select("id, title").eq("is_published", true);
    },

    loadPublishedModules() {
      return client.from("course_modules").select("id, course_id").eq("is_published", true);
    },

    loadPublishedLessons(moduleIds: string[]) {
      return client.from("lessons").select("id, module_id, lesson_type").in("module_id", moduleIds).eq("is_published", true);
    },

    loadPublishedTests(moduleIds: string[]) {
      return client
        .from("tests")
        .select("id, module_id, cefr_level, assessment_kind")
        .in("module_id", moduleIds)
        .eq("is_published", true);
    },

    loadLessonProgress(studentId: string, lessonIds: string[]) {
      return client
        .from("student_lesson_progress")
        .select("progress_percent, lessons(module_id, course_modules(course_id))")
        .eq("student_id", studentId)
        .in("lesson_id", lessonIds);
    },

    loadWeakPoints(studentId: string) {
      return client
        .from("student_mistakes")
        .select("id, mistake_count, test_id, tests(title)")
        .eq("student_id", studentId)
        .order("mistake_count", { ascending: false })
        .limit(20);
    }
  };
}

export async function createUserScopedProgressRepository() {
  return createProgressRepository(await createClient());
}
