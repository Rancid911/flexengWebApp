import { createHomeworkAssignmentsRepository, type HomeworkAssignmentsRepositoryClient } from "@/lib/homework/assignments.repository";
import { createClient } from "@/lib/supabase/server";

export type DashboardSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export function createStudentDashboardRepository(supabase: DashboardSupabaseClient) {
  const homeworkRepository = createHomeworkAssignmentsRepository(supabase as HomeworkAssignmentsRepositoryClient);

  return {
    async loadLessonProgress(studentId: string) {
      return await supabase
        .from("student_lesson_progress")
        .select("status, progress_percent, updated_at, lesson_id, lessons(title, duration_minutes, module_id)")
        .eq("student_id", studentId)
        .order("updated_at", { ascending: false })
        .limit(6);
    },

    async loadTestAttempts(studentId: string) {
      return await supabase
        .from("student_test_attempts")
        .select("status, score, created_at, submitted_at, tests(assessment_kind)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20);
    },

    async loadActiveCourseEnrollments(studentId: string) {
      return await supabase
        .from("student_course_enrollments")
        .select("status, courses(title)")
        .eq("student_id", studentId)
        .eq("status", "active")
        .limit(4);
    },

    async loadActiveHomework(studentId: string) {
      return await homeworkRepository.listStudentDashboardActiveHomework(studentId);
    },

    async loadPlacementAssignment(studentId: string, placementTestId: string) {
      return await homeworkRepository.loadStudentDashboardPlacementAssignment(studentId, placementTestId);
    },

    async loadStudentWordRows(studentId: string) {
      return await supabase
        .from("student_words")
        .select("status, next_review_at")
        .eq("student_id", studentId);
    },

    async loadCompletedTeacherLessonsCountLast7Days(studentId: string, referenceDate = new Date()) {
      const periodEnd = referenceDate.toISOString();
      const periodStart = new Date(referenceDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      return await supabase
        .from("lesson_attendance")
        .select("id, student_schedule_lessons!inner(status, ends_at)", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("status", "completed")
        .neq("student_schedule_lessons.status", "canceled")
        .lte("student_schedule_lessons.ends_at", periodEnd)
        .gte("student_schedule_lessons.ends_at", periodStart);
    },

    async loadSubmittedTestsCountLast7Days(studentId: string, referenceDate = new Date()) {
      const periodEnd = referenceDate.toISOString();
      const periodStart = new Date(referenceDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      return await supabase
        .from("student_test_attempts")
        .select("id, tests!inner(assessment_kind)", { count: "exact", head: true })
        .eq("student_id", studentId)
        .neq("status", "in_progress")
        .neq("tests.assessment_kind", "placement")
        .lte("submitted_at", periodEnd)
        .gte("submitted_at", periodStart);
    },

    async resolveCanonicalPlacementTest() {
      return await supabase
        .from("tests")
        .select("id, title")
        .eq("assessment_kind", "placement")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
    },

    async loadRecentLessonActivities(studentId: string) {
      return await supabase
        .from("student_lesson_progress")
        .select("updated_at, lessons(title, module_id)")
        .eq("student_id", studentId)
        .order("updated_at", { ascending: false })
        .limit(20);
    },

    async loadRecentTestActivities(studentId: string) {
      return await supabase
        .from("student_test_attempts")
        .select("created_at, tests(title, module_id, assessment_kind)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20);
    },

    async loadRecommendationModules(moduleIds: string[]) {
      return await supabase
        .from("course_modules")
        .select("id, title, course_id, courses(slug, title)")
        .in("id", moduleIds);
    },

    async loadPublishedTrainerDrills(moduleId: string) {
      return await supabase
        .from("tests")
        .select("id")
        .eq("module_id", moduleId)
        .eq("activity_type", "trainer")
        .eq("is_published", true)
        .neq("assessment_kind", "placement");
    },

    async loadCompletedDrillAttempts(studentId: string, drillIds: string[]) {
      return await supabase
        .from("student_test_attempts")
        .select("test_id, status")
        .eq("student_id", studentId)
        .in("test_id", drillIds)
        .neq("status", "in_progress");
    }
  };
}
