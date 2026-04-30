import { createAdminClient } from "@/lib/supabase/admin";

export type TeacherStudentRosterRepositoryClient = ReturnType<typeof createAdminClient>;

export type TeacherStudentRosterProfileRow = {
  id: string;
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

export function createTeacherStudentRosterRepository(client: TeacherStudentRosterRepositoryClient = createAdminClient()) {
  return {
    async loadStudents(studentIds?: string[]) {
      let query = client.from("students").select("id, profile_id, english_level, target_level, learning_goal");
      if (studentIds) query = query.in("id", studentIds);
      return await query;
    },

    async loadProfiles(profileIds: string[]) {
      if (profileIds.length === 0) return { data: [], error: null };
      return await client.from("profiles").select("id, display_name, first_name, last_name, email, phone").in("id", profileIds);
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
