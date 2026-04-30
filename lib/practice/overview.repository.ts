import { createClient } from "@/lib/supabase/server";

export type PracticeOverviewRepositoryClient = Awaited<ReturnType<typeof createClient>>;

export type PracticeOverviewProgressRow = {
  lesson_id: string | null;
  status: string | null;
  progress_percent: number | null;
  lessons:
    | {
        id?: string | null;
        title?: string | null;
        module_id?: string | null;
        course_modules?: { course_id?: string | null } | Array<{ course_id?: string | null }> | null;
      }
    | Array<{
        id?: string | null;
        title?: string | null;
        module_id?: string | null;
        course_modules?: { course_id?: string | null } | Array<{ course_id?: string | null }> | null;
      }>
    | null;
};

export type PracticeOverviewAttemptRow = {
  test_id: string | null;
  score: number | null;
  status: string | null;
  tests:
    | {
        title?: string | null;
        module_id?: string | null;
        cefr_level?: string | null;
        activity_type?: string | null;
        assessment_kind?: string | null;
        drill_topic_key?: string | null;
        drill_kind?: string | null;
      }
    | Array<{
        title?: string | null;
        module_id?: string | null;
        cefr_level?: string | null;
        activity_type?: string | null;
        assessment_kind?: string | null;
        drill_topic_key?: string | null;
        drill_kind?: string | null;
      }>
    | null;
};

export type PracticeOverviewMistakeRow = {
  id?: string | null;
  mistake_count: number | null;
  module_id: string | null;
  test_id?: string | null;
  last_mistake_at?: string | null;
  tests?: { title?: string | null } | Array<{ title?: string | null }> | null;
};

export type PracticeOverviewCourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
};

export type PracticeOverviewModuleRow = {
  id: string;
  course_id?: string | null;
  title: string;
  description: string | null;
};

export type PracticeOverviewLessonRow = {
  id: string;
  module_id: string | null;
  title?: string | null;
  lesson_type?: string | null;
};

export type PracticeOverviewTestRow = {
  id: string;
  module_id: string | null;
  cefr_level?: string | null;
  assessment_kind?: string | null;
};

export type PracticeFavoriteRow = {
  id: string | null;
  entity_type: string | null;
  entity_id: string | null;
};

export function createPracticeOverviewRepository(client: PracticeOverviewRepositoryClient) {
  return {
    async loadPublishedCourses() {
      return await client.from("courses").select("id, slug, title, description").eq("is_published", true);
    },

    async loadPublishedModulesForCourses(courseIds: string[]) {
      if (courseIds.length === 0) return { data: [], error: null };
      return await client.from("course_modules").select("id, course_id, title, description").in("course_id", courseIds).eq("is_published", true);
    },

    async loadPublishedLessonsForModules(moduleIds: string[]) {
      if (moduleIds.length === 0) return { data: [], error: null };
      return await client
        .from("lessons")
        .select("id, title, module_id, lesson_type, course_modules(course_id)")
        .in("module_id", moduleIds)
        .eq("is_published", true);
    },

    async loadPublishedTestsForModules(moduleIds: string[]) {
      if (moduleIds.length === 0) return { data: [], error: null };
      return await client
        .from("tests")
        .select("id, module_id, cefr_level, assessment_kind")
        .in("module_id", moduleIds)
        .eq("is_published", true);
    },

    async loadLessonProgress(studentId: string, lessonIds: string[]) {
      if (lessonIds.length === 0) return { data: [], error: null };
      return await client
        .from("student_lesson_progress")
        .select("lesson_id, status, progress_percent, lessons(id, title, module_id, course_modules(course_id))")
        .eq("student_id", studentId)
        .in("lesson_id", lessonIds);
    },

    async loadRecentAttempts(studentId: string) {
      return await client
        .from("student_test_attempts")
        .select("test_id, score, status, tests(title, module_id, cefr_level, activity_type, assessment_kind, drill_topic_key, drill_kind)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(5);
    },

    async loadRecentMistakes(studentId: string) {
      return await client
        .from("student_mistakes")
        .select("id, mistake_count, module_id, test_id, last_mistake_at, tests(title)")
        .eq("student_id", studentId)
        .order("last_mistake_at", { ascending: false })
        .limit(20);
    },

    async loadFavorites(studentId: string) {
      return await client
        .from("student_favorites")
        .select("id, entity_type, entity_id, created_at")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(50);
    }
  };
}
