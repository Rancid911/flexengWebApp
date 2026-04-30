import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";
import type { ScheduleActor } from "@/lib/schedule/server";
import type { AccessMode } from "@/lib/supabase/access";
import {
  TEACHER_DASHBOARD_ATTENTION_QUEUE_DATA_LOADING,
  TEACHER_DASHBOARD_TODAY_AGENDA_DATA_LOADING,
  getTeacherDashboardAttentionQueue,
  getTeacherDashboardTodayAgenda,
  getTeacherDashboardWeekAgenda,
  getTeacherDashboardWeekLessonBundle
} from "@/lib/teacher-workspace/dashboard-agenda.queries";
import { composeTeacherDashboardData } from "@/lib/teacher-workspace/sections";
import type { TeacherDashboardData } from "@/lib/teacher-workspace/types";

export {
  TEACHER_DASHBOARD_ATTENTION_QUEUE_DATA_LOADING,
  TEACHER_DASHBOARD_TODAY_AGENDA_DATA_LOADING,
  getTeacherDashboardAttentionQueue,
  getTeacherDashboardTodayAgenda,
  getTeacherDashboardWeekAgenda,
  getTeacherDashboardWeekLessonBundle
};

export const TEACHER_WORKSPACE_QUERY_ACCESS_MODE: AccessMode = "privileged";

export const TEACHER_DASHBOARD_DATA_LOADING = defineDataLoadingDescriptor({
  id: "teacher-dashboard",
  owner: "@/lib/teacher-workspace/queries#getTeacherDashboardData",
  accessMode: TEACHER_WORKSPACE_QUERY_ACCESS_MODE,
  loadLevel: "page",
  shape: "aggregate",
  issues: ["mixed_responsibilities", "overfetch"],
  transitional: true,
  notes: [
    "Current dashboard loader mixes lesson summary, student list and homework counts.",
    "Do not expand this aggregate with unrelated teacher workspace data before section loaders exist."
  ]
});

export async function getTeacherDashboardData(actor: ScheduleActor): Promise<TeacherDashboardData> {
  const weekBundle = await getTeacherDashboardWeekLessonBundle(actor);
  const { getTeacherDashboardStudentRosterSummary } = await import("@/lib/teacher-workspace/student-roster.queries");
  const students = await getTeacherDashboardStudentRosterSummary(actor, {
    weekLessons: weekBundle.weekLessons
  });

  return composeTeacherDashboardData({
    todayLessons: weekBundle.todayLessons,
    weekLessons: weekBundle.weekLessons,
    students
  });
}
