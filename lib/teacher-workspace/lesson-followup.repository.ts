import type { LessonAttendanceStatus } from "@/lib/schedule/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type TeacherLessonFollowupRepositoryClient = ReturnType<typeof createAdminClient>;

export type TeacherLessonFollowupLessonRow = {
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

export type TeacherLessonAttendanceRow = {
  id: string;
  schedule_lesson_id: string;
  student_id: string;
  teacher_id: string;
  status: LessonAttendanceStatus;
  marked_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type TeacherLessonOutcomeRow = {
  id: string;
  schedule_lesson_id: string;
  student_id: string;
  teacher_id: string;
  summary: string;
  covered_topics: string | null;
  mistakes_summary: string | null;
  next_steps: string | null;
  visible_to_student: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type TeacherAssignableTestRow = {
  id: string;
  title: string | null;
  activity_type: string | null;
  assessment_kind: string | null;
  cefr_level: string | null;
  drill_topic_key: string | null;
  drill_kind: string | null;
  lesson_reinforcement: boolean | null;
};

const LESSON_SELECT = "id, student_id, teacher_id, title, starts_at, ends_at, meeting_url, comment, status, created_at, updated_at";
const ATTENDANCE_SELECT = "id, schedule_lesson_id, student_id, teacher_id, status, marked_at, created_at, updated_at";
const OUTCOME_SELECT = "id, schedule_lesson_id, student_id, teacher_id, summary, covered_topics, mistakes_summary, next_steps, visible_to_student, created_at, updated_at";

export function createTeacherLessonFollowupRepository(client: TeacherLessonFollowupRepositoryClient = createAdminClient()) {
  return {
    client,

    async loadLessonById(id: string) {
      return await client.from("student_schedule_lessons").select(LESSON_SELECT).eq("id", id).maybeSingle();
    },

    async loadLessonAttendance(lessonId: string) {
      return await client.from("lesson_attendance").select(ATTENDANCE_SELECT).eq("schedule_lesson_id", lessonId).maybeSingle();
    },

    async loadLessonOutcome(lessonId: string) {
      return await client.from("lesson_outcomes").select(OUTCOME_SELECT).eq("schedule_lesson_id", lessonId).maybeSingle();
    },

    async upsertLessonAttendance(payload: Record<string, unknown>) {
      return await client.from("lesson_attendance").upsert(payload, { onConflict: "schedule_lesson_id" }).select(ATTENDANCE_SELECT).single();
    },

    async upsertLessonOutcome(payload: Record<string, unknown>) {
      return await client.from("lesson_outcomes").upsert(payload, { onConflict: "schedule_lesson_id" }).select(OUTCOME_SELECT).single();
    },

    async updateLessonStatus(lessonId: string, payload: Record<string, unknown>) {
      return await client.from("student_schedule_lessons").update(payload).eq("id", lessonId);
    },

    async loadStudentLevel(studentId: string) {
      return await client.from("students").select("english_level").eq("id", studentId).maybeSingle();
    },

    async listPublishedAssignableTests() {
      return await client
        .from("tests")
        .select("id, title, activity_type, assessment_kind, cefr_level, drill_topic_key, drill_kind, lesson_reinforcement")
        .eq("is_published", true)
        .order("lesson_reinforcement", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(40);
    }
  };
}
