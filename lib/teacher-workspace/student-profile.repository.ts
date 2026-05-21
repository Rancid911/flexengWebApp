import { createHomeworkAssignmentsRepository } from "@/lib/homework/assignments.repository";
import type { createClient } from "@/lib/supabase/server";

export type TeacherStudentProfileRepositoryClient = Awaited<ReturnType<typeof createClient>>;

const LESSON_SELECT = "id, student_id, teacher_id, title, starts_at, ends_at, meeting_url, comment, status, created_at, updated_at";

export function createTeacherStudentProfileRepository(client: TeacherStudentProfileRepositoryClient) {
  const homework = createHomeworkAssignmentsRepository(client as Parameters<typeof createHomeworkAssignmentsRepository>[0]);

  return {
    client,

    async loadStudentCore(studentId: string) {
      return await client
        .from("students")
        .select("id, profile_id, primary_teacher_id, english_level, target_level, learning_goal")
        .eq("id", studentId)
        .maybeSingle();
    },

    async loadProfiles(profileIds: string[]) {
      if (profileIds.length === 0) return { data: [], error: null };
      return await client.rpc("get_accessible_profile_labels", { p_profile_ids: profileIds });
    },

    async loadNotesFeed(studentId: string, limit: number) {
      return await client
        .from("teacher_student_notes")
        .select("id, student_id, teacher_id, body, visibility, created_by_profile_id, created_at, updated_at")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(limit);
    },

    async loadUpcomingLessons(studentId: string, nowIso: string, limit: number) {
      return await client
        .from("student_schedule_lessons")
        .select(LESSON_SELECT)
        .eq("student_id", studentId)
        .gte("starts_at", nowIso)
        .order("starts_at", { ascending: true })
        .limit(limit);
    },

    async loadRecentLessons(studentId: string, nowIso: string, limit: number) {
      return await client
        .from("student_schedule_lessons")
        .select(LESSON_SELECT)
        .eq("student_id", studentId)
        .lt("starts_at", nowIso)
        .order("starts_at", { ascending: false })
        .limit(limit);
    },

    async loadMistakes(studentId: string, limit: number) {
      return await client
        .from("student_mistakes")
        .select("id, mistake_count, last_mistake_at, tests(title), course_modules(title)")
        .eq("student_id", studentId)
        .order("last_mistake_at", { ascending: false })
        .limit(limit);
    },

    async resolveCanonicalPlacementTest() {
      return await client
        .from("tests")
        .select("id, title")
        .eq("assessment_kind", "placement")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
    },

    listHomeworkSnapshot: homework.listHomeworkSnapshot,
    listPlacementAssignments: homework.listPlacementAssignments,
    loadTestsForTeacherHomework: homework.loadTestsForTeacherHomework,
    loadProgressByItemIds: homework.loadProgressByItemIds,
    loadLatestAttemptsByTestIds: homework.loadLatestAttemptsByTestIds
  };
}
