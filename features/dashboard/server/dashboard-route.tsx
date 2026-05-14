import { Suspense } from "react";

import AdminDashboardView from "@/features/dashboard/components/admin-dashboard-view";
import StaffDashboardView from "@/features/dashboard/components/staff-dashboard-view";
import TeacherDashboardView, { TeacherDashboardAttentionSection, TeacherDashboardRosterSection } from "@/features/dashboard/components/teacher-dashboard-view";
import { renderStudentDashboardRoute } from "@/features/dashboard/server/student-dashboard-route";
import { getAdminDashboardMetrics } from "@/lib/admin/dashboard-metrics";
import { requireLayoutActor, resolveDefaultWorkspace, type AppActor } from "@/lib/auth/request-context";
import { ScheduleHttpError } from "@/lib/schedule/http";
import { resolveScheduleActor } from "@/lib/schedule/server";
import { measureServerTiming } from "@/lib/server/timing";
import {
  getTeacherDashboardAttentionQueue,
  getTeacherDashboardStudentRosterSummary,
  getTeacherDashboardWeekLessonBundle
} from "@/lib/teacher-workspace/queries";
import { composeTeacherDashboardData } from "@/lib/teacher-workspace/sections";

async function TeacherDashboardAttentionSlot({ actor }: { actor: AppActor }) {
  let lessons: Awaited<ReturnType<typeof getTeacherDashboardAttentionQueue>> = [];
  try {
    const scheduleActor = await resolveScheduleActor(actor, "contextOnly");
    lessons = await getTeacherDashboardAttentionQueue(scheduleActor);
  } catch {}

  return <TeacherDashboardAttentionSection lessons={lessons} />;
}

async function TeacherDashboardRosterSlot({
  actor,
  weekLessons
}: {
  actor: AppActor;
  weekLessons: Awaited<ReturnType<typeof getTeacherDashboardWeekLessonBundle>>["weekLessons"];
}) {
  let students: Awaited<ReturnType<typeof getTeacherDashboardStudentRosterSummary>> = [];
  try {
    const rosterActor = await resolveScheduleActor(actor, "teacherScope");
    students = await getTeacherDashboardStudentRosterSummary(rosterActor, { weekLessons });
  } catch {}

  return <TeacherDashboardRosterSection students={students} />;
}

export async function renderDashboardRoute() {
  const actor = await measureServerTiming("dashboard-route-context", () => requireLayoutActor());
  const workspace = resolveDefaultWorkspace(actor);

  if (workspace === "student") {
    return renderStudentDashboardRoute();
  }

  if (workspace === "admin") {
    try {
      const metrics = await measureServerTiming("admin-dashboard-metrics-route-data", () => getAdminDashboardMetrics());
      return <AdminDashboardView initialMetrics={metrics} />;
    } catch {
      return <AdminDashboardView initialMetrics={null} />;
    }
  }

  if (workspace === "teacher") {
    let teacherDashboardResult:
      | { profileLinked: false; data: { todayLessons: never[]; weekLessons: never[]; students: never[] } }
      | {
          profileLinked: true;
          data: ReturnType<typeof composeTeacherDashboardData>;
        };
    try {
      const weekActor = await resolveScheduleActor(actor, "contextOnly");
      const weekBundle = await getTeacherDashboardWeekLessonBundle(weekActor);
      const data = composeTeacherDashboardData({
        todayLessons: weekBundle.todayLessons,
        weekLessons: weekBundle.weekLessons,
        students: []
      });
      teacherDashboardResult = {
        profileLinked: true,
        data
      };
    } catch (error) {
      if (error instanceof ScheduleHttpError && error.message === "Teacher profile is not linked") {
        teacherDashboardResult = {
          profileLinked: false,
          data: { todayLessons: [], weekLessons: [], students: [] }
        };
      } else {
        throw error;
      }
    }

    return teacherDashboardResult.profileLinked ? (
      <TeacherDashboardView
        data={teacherDashboardResult.data}
        studentRosterCount={null}
        attentionQueueSlot={
          <Suspense fallback={<TeacherDashboardAttentionSection lessons={[]} />}>
            <TeacherDashboardAttentionSlot actor={actor} />
          </Suspense>
        }
        studentRosterSlot={
          <Suspense fallback={<TeacherDashboardRosterSection students={[]} />}>
            <TeacherDashboardRosterSlot actor={actor} weekLessons={teacherDashboardResult.data.weekLessons} />
          </Suspense>
        }
      />
    ) : (
      <TeacherDashboardView data={teacherDashboardResult.data} profileLinked={false} />
    );
  }

  return <StaffDashboardView role="manager" />;
}
