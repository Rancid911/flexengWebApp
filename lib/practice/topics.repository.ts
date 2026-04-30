import { createClient } from "@/lib/supabase/server";

export type PracticeTopicsRepositoryClient = Awaited<ReturnType<typeof createClient>>;

export type PracticeTopicCourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
};

export type PracticeTopicModuleRow = {
  id: string;
  course_id?: string | null;
  title: string;
  description: string | null;
};

export type PracticeTopicLessonRow = {
  id: string;
  module_id: string | null;
  title?: string | null;
  description?: string | null;
  duration_minutes?: number | null;
  lesson_type?: string | null;
};

export type PracticeTopicTestRow = {
  id: string;
  module_id: string | null;
  title?: string | null;
  description?: string | null;
  time_limit_minutes?: number | null;
  activity_type?: string | null;
  assessment_kind?: string | null;
  cefr_level?: string | null;
  drill_topic_key?: string | null;
  drill_kind?: string | null;
  lesson_reinforcement?: boolean | null;
  sort_order?: number | null;
};

export type PracticeTopicProgressRow = {
  lesson_id: string | null;
  status?: string | null;
  progress_percent: number | null;
  lessons?:
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

export type PracticeTopicAttemptRow = {
  test_id: string | null;
  status: string | null;
  score: number | null;
};

export function createPracticeTopicsRepository(client: PracticeTopicsRepositoryClient) {
  return {
    async loadPublishedCourses() {
      return await client.from("courses").select("id, slug, title, description").eq("is_published", true);
    },

    async loadPublishedModulesForCourses(courseIds: string[]) {
      if (courseIds.length === 0) return { data: [], error: null };
      return await client
        .from("course_modules")
        .select("id, course_id, title, description")
        .in("course_id", courseIds)
        .eq("is_published", true);
    },

    async loadTopicCourse(topicSlug: string) {
      return await client.from("courses").select("id, slug, title, description").eq("slug", topicSlug).maybeSingle();
    },

    async loadPublishedModulesForCourse(courseId: string) {
      return await client
        .from("course_modules")
        .select("id, course_id, title, description")
        .eq("course_id", courseId)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
    },

    async loadSubtopicModule(subtopicId: string) {
      return await client.from("course_modules").select("id, course_id, title, description").eq("id", subtopicId).maybeSingle();
    },

    async loadTopicLessons(moduleIds: string[]) {
      if (moduleIds.length === 0) return { data: [], error: null };
      return await client.from("lessons").select("id, module_id, lesson_type").in("module_id", moduleIds).eq("is_published", true);
    },

    async loadTopicTests(moduleIds: string[]) {
      if (moduleIds.length === 0) return { data: [], error: null };
      return await client.from("tests").select("id, module_id, cefr_level, assessment_kind").in("module_id", moduleIds).eq("is_published", true);
    },

    async loadPracticeProgressRowsForModules(studentId: string, moduleIds: string[]) {
      if (moduleIds.length === 0) return [] as PracticeTopicProgressRow[];

      const lessonsResponse = await client
        .from("lessons")
        .select("id, title, module_id, course_modules(course_id)")
        .in("module_id", moduleIds)
        .eq("is_published", true);
      const lessonIds = ((lessonsResponse.data ?? []) as Array<{ id: string }>).map((item) => item.id);

      if (lessonIds.length === 0) return [] as PracticeTopicProgressRow[];

      const progressResponse = await client
        .from("student_lesson_progress")
        .select("lesson_id, status, progress_percent, lessons(id, title, module_id, course_modules(course_id))")
        .eq("student_id", studentId)
        .in("lesson_id", lessonIds);

      return (progressResponse.data ?? []) as PracticeTopicProgressRow[];
    },

    async loadTopicLessonProgress(studentId: string, lessonIds: string[]) {
      if (lessonIds.length === 0) return { data: [], error: null };
      return await client
        .from("student_lesson_progress")
        .select("lesson_id, progress_percent")
        .eq("student_id", studentId)
        .in("lesson_id", lessonIds);
    },

    async loadSubtopicLessons(subtopicId: string) {
      return await client
        .from("lessons")
        .select("id, module_id, title, description, duration_minutes, lesson_type")
        .eq("module_id", subtopicId)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
    },

    async loadSubtopicTests(subtopicId: string) {
      return await client
        .from("tests")
        .select("id, module_id, title, description, time_limit_minutes, activity_type, assessment_kind, scoring_profile, cefr_level, drill_topic_key, drill_kind, lesson_reinforcement, sort_order")
        .eq("module_id", subtopicId)
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
    },

    async loadSubtopicLessonProgress(studentId: string, lessonIds: string[]) {
      if (lessonIds.length === 0) return { data: [], error: null };
      return await client
        .from("student_lesson_progress")
        .select("lesson_id, status, progress_percent")
        .eq("student_id", studentId)
        .in("lesson_id", lessonIds);
    },

    async loadSubtopicAttempts(studentId: string, testIds: string[]) {
      if (testIds.length === 0) return { data: [], error: null };
      return await client
        .from("student_test_attempts")
        .select("test_id, status, score")
        .eq("student_id", studentId)
        .in("test_id", testIds);
    }
  };
}
