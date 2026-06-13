import type { createClient } from "@/lib/supabase/server";

export type TeacherStudentRosterRepositoryClient = Awaited<ReturnType<typeof createClient>>;

export type TeacherStudentRosterProfileRow = {
  student_id: string;
  profile_id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};

export type TeacherStudentRosterStudentRow = {
  id: string;
  profile_id: string;
  english_level: string | null;
  target_level: string | null;
  learning_goal: string | null;
};

export type TeacherStudentRosterLessonSummaryRow = {
  student_id: string;
  starts_at: string;
};

export type TeacherStudentRosterHomeworkCountRow = {
  student_id: string;
  active_homework_count: number;
};

export function createTeacherStudentRosterRepository(client: TeacherStudentRosterRepositoryClient) {
  return {
    async loadStudents(studentIds?: string[]) {
      let query = client.from("students").select("id, profile_id, english_level, target_level, learning_goal");
      if (studentIds) query = query.in("id", studentIds);
      return await query;
    },

    async loadProfileSummaries(studentIds: string[]) {
      if (studentIds.length === 0) return { data: [], error: null };
      return await client.rpc("get_teacher_student_profile_summaries", { p_student_ids: studentIds });
    },

    async loadActiveHomeworkCounts(studentIds: string[]) {
      if (studentIds.length === 0) return { data: [], error: null };
      return await client.rpc("get_teacher_roster_active_homework_counts", { p_student_ids: studentIds });
    },

    async loadUpcomingLessonSummaries(studentIds: string[], fromIso: string) {
      if (studentIds.length === 0) return { data: [], error: null };
      return await client
        .from("student_schedule_lessons")
        .select("student_id, starts_at")
        .in("student_id", studentIds)
        .eq("status", "scheduled")
        .gte("starts_at", fromIso)
        .order("starts_at", { ascending: true });
    }
  };
}
