import type { LessonAttendanceStatus } from "@/lib/schedule/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type TeacherDashboardAgendaRepositoryClient = ReturnType<typeof createAdminClient>;

export type TeacherDashboardAgendaLessonRow = {
  id: string;
  student_id: string;
  teacher_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  meeting_url: string | null;
  comment: string | null;
  status: "scheduled" | "canceled" | "completed";
  created_at: string | null;
  updated_at: string | null;
};

export type TeacherDashboardAgendaLabelRow = {
  id: string;
  label: string | null;
};

export type TeacherDashboardAgendaStudentRow = {
  id: string;
  profile_id: string;
};

export type TeacherDashboardAgendaTeacherRow = {
  id: string;
  profile_id: string;
};

export type TeacherDashboardAgendaProfileRow = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

export type TeacherDashboardAgendaAttendanceRow = {
  schedule_lesson_id: string;
  status: LessonAttendanceStatus | null;
};

export type TeacherDashboardAgendaOutcomeRow = {
  schedule_lesson_id: string;
};

const LESSON_SELECT = "id, student_id, teacher_id, title, starts_at, ends_at, meeting_url, comment, status, created_at, updated_at";

export function createTeacherDashboardAgendaRepository(client: TeacherDashboardAgendaRepositoryClient = createAdminClient()) {
  return {
    client,

    async loadWeekLessonRows(params: { todayStartIso: string; weekEndIso: string; teacherId?: string }) {
      let query = client
        .from("student_schedule_lessons")
        .select(LESSON_SELECT)
        .gte("starts_at", params.todayStartIso)
        .lte("starts_at", params.weekEndIso)
        .neq("status", "canceled")
        .order("starts_at", { ascending: true });

      if (params.teacherId) {
        query = query.eq("teacher_id", params.teacherId);
      }

      return await query;
    },

    async loadCompletedLessonRows(params: { todayStartIso: string; weekEndIso: string; teacherId?: string }) {
      let query = client
        .from("student_schedule_lessons")
        .select(LESSON_SELECT)
        .gte("starts_at", params.todayStartIso)
        .lte("starts_at", params.weekEndIso)
        .eq("status", "completed")
        .order("starts_at", { ascending: true });

      if (params.teacherId) {
        query = query.eq("teacher_id", params.teacherId);
      }

      return await query;
    },

    async loadStudentLabelRows(studentIds: string[]) {
      if (studentIds.length === 0 || typeof client.rpc !== "function") return { data: null, error: null };
      return await client.rpc("get_schedule_student_options", {
        p_student_ids: studentIds
      });
    },

    async loadTeacherLabelRows(teacherIds: string[]) {
      if (teacherIds.length === 0 || typeof client.rpc !== "function") return { data: null, error: null };
      return await client.rpc("get_schedule_teacher_options", {
        p_teacher_ids: teacherIds
      });
    },

    async loadStudentsByIds(studentIds: string[]) {
      if (studentIds.length === 0) return { data: [], error: null };
      return await client.from("students").select("id, profile_id").in("id", studentIds);
    },

    async loadTeachersByIds(teacherIds: string[]) {
      if (teacherIds.length === 0) return { data: [], error: null };
      return await client.from("teachers").select("id, profile_id").in("id", teacherIds);
    },

    async loadProfilesByIds(profileIds: string[]) {
      if (profileIds.length === 0) return { data: [], error: null };
      return await client.from("profiles").select("id, display_name, first_name, last_name, email").in("id", profileIds);
    },

    async loadAttendanceByLessonIds(lessonIds: string[]) {
      if (lessonIds.length === 0) return { data: [], error: null };
      return await client.from("lesson_attendance").select("schedule_lesson_id, status").in("schedule_lesson_id", lessonIds);
    },

    async loadOutcomePresenceByLessonIds(lessonIds: string[]) {
      if (lessonIds.length === 0) return { data: [], error: null };
      return await client.from("lesson_outcomes").select("schedule_lesson_id").in("schedule_lesson_id", lessonIds);
    }
  };
}
