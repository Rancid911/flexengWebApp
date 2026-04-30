import { Suspense } from "react";
import { renderStudentDashboardRoute } from "@/app/(workspace)/_components/student-dashboard-route";
import { requireLayoutActor, resolveDefaultWorkspace, type AppActor } from "@/lib/auth/request-context";
import { measureServerTiming } from "@/lib/server/timing";
import { ScheduleHttpError } from "@/lib/schedule/http";
import { resolveScheduleActor } from "@/lib/schedule/server";
import { composeTeacherDashboardData } from "@/lib/teacher-workspace/sections";
import {
  getTeacherDashboardAttentionQueue,
  getTeacherDashboardWeekLessonBundle,
  getTeacherDashboardStudentRosterSummary,
} from "@/lib/teacher-workspace/queries";

import AdminDashboardView from "./admin-dashboard-view";
import StaffDashboardView from "./staff-dashboard-view";
import TeacherDashboardView, { TeacherDashboardAttentionSection } from "./teacher-dashboard-view";

async function TeacherDashboardAttentionSlot({ actor }: { actor: AppActor }) {
  let lessons: Awaited<ReturnType<typeof getTeacherDashboardAttentionQueue>> = [];
  try {
    const scheduleActor = await resolveScheduleActor(actor, "contextOnly");
    lessons = await getTeacherDashboardAttentionQueue(scheduleActor);
  } catch {}

  return <TeacherDashboardAttentionSection lessons={lessons} />;
}

export default async function DashboardPage() {
  const actor = await measureServerTiming("dashboard-route-context", () => requireLayoutActor());
  const workspace = resolveDefaultWorkspace(actor);

  if (workspace === "student") {
    return renderStudentDashboardRoute();
  }

  if (workspace === "admin") {
    return <AdminDashboardView />;
  }

  if (workspace === "teacher") {
    let teacherDashboardResult:
      | { profileLinked: false; data: { todayLessons: never[]; weekLessons: never[]; students: never[] } }
      | {
          profileLinked: true;
          data: ReturnType<typeof composeTeacherDashboardData>;
        };
    try {
      const [weekActor, rosterActor] = await Promise.all([
        resolveScheduleActor(actor, "contextOnly"),
        resolveScheduleActor(actor, "teacherScope")
      ]);
      const weekBundle = await getTeacherDashboardWeekLessonBundle(weekActor);
      const students = await getTeacherDashboardStudentRosterSummary(rosterActor, { weekLessons: weekBundle.weekLessons });
      const data = composeTeacherDashboardData({
        todayLessons: weekBundle.todayLessons,
        weekLessons: weekBundle.weekLessons,
        students
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
        attentionQueueSlot={
          <Suspense fallback={<TeacherDashboardAttentionSection lessons={[]} />}>
            <TeacherDashboardAttentionSlot actor={actor} />
          </Suspense>
        }
      />
    ) : (
      <TeacherDashboardView data={teacherDashboardResult.data} profileLinked={false} />
    );
  }

  return <StaffDashboardView role="manager" />;
}
