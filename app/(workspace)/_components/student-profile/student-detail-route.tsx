import { redirect } from "next/navigation";

import {
  StudentDetailShell,
  StudentHomeworkDetail,
  StudentMistakesDetail,
  StudentNotesDetail,
  StudentScheduleDetail
} from "@/app/(workspace)/_components/student-profile/student-detail-pages";
import { measureServerTiming } from "@/lib/server/timing";
import {
  isStaffAdminScheduleActor,
  isStudentScheduleActor,
  isTeacherScheduleActor,
  requireSchedulePage,
  type ScheduleActor
} from "@/lib/schedule/server";
import {
  getTeacherStudentHeaderSummary,
  getTeacherStudentHomeworkSnapshot,
  getTeacherStudentLessonHistory,
  getTeacherStudentMistakesSnapshot,
  getTeacherStudentNotesFeed
} from "@/lib/teacher-workspace/queries";

type StudentDetailKind = "schedule" | "homework" | "notes" | "mistakes";
type StudentDetailRouteMode = "admin" | "teacher";

async function resolveStudentDetailActor(mode: StudentDetailRouteMode, studentId: string, kind: StudentDetailKind) {
  const actor = await measureServerTiming(`${mode}-student-${kind}-context`, () => requireSchedulePage());

  if (isStudentScheduleActor(actor)) {
    redirect("/dashboard");
  }

  if (mode === "admin") {
    if (!isStaffAdminScheduleActor(actor)) redirect("/dashboard");
    return {
      actor,
      profileHref: `/admin/students/${studentId}`
    };
  }

  if (isStaffAdminScheduleActor(actor)) {
    redirect(`/admin/students/${studentId}/${kind}`);
  }
  if (!isTeacherScheduleActor(actor)) {
    redirect("/dashboard");
  }

  return {
    actor,
    profileHref: `/students/${studentId}`
  };
}

async function loadHeader(actor: ScheduleActor, studentId: string) {
  return getTeacherStudentHeaderSummary(actor, studentId);
}

export async function renderStudentScheduleDetailPage(mode: StudentDetailRouteMode, studentId: string) {
  const { actor, profileHref } = await resolveStudentDetailActor(mode, studentId, "schedule");
  const [header, lessonHistory] = await Promise.all([
    loadHeader(actor, studentId),
    getTeacherStudentLessonHistory(actor, studentId, { upcomingLimit: 100, recentLimit: 100 })
  ]);

  return (
    <StudentDetailShell
      header={header}
      title="Расписание ученика"
      description="Полный перечень будущих и прошедших занятий по этому ученику."
      profileHref={profileHref}
    >
      <StudentScheduleDetail upcomingLessons={lessonHistory.upcomingLessons} recentLessons={lessonHistory.recentLessons} />
    </StudentDetailShell>
  );
}

export async function renderStudentHomeworkDetailPage(mode: StudentDetailRouteMode, studentId: string) {
  const { actor, profileHref } = await resolveStudentDetailActor(mode, studentId, "homework");
  const [header, assignments] = await Promise.all([
    loadHeader(actor, studentId),
    getTeacherStudentHomeworkSnapshot(actor, studentId, { limit: 100 })
  ]);

  return (
    <StudentDetailShell
      header={header}
      title="Домашние задания"
      description="Все homework assignments ученика: standalone, lesson-linked и placement."
      profileHref={profileHref}
    >
      <StudentHomeworkDetail assignments={assignments} />
    </StudentDetailShell>
  );
}

export async function renderStudentNotesDetailPage(mode: StudentDetailRouteMode, studentId: string) {
  const { actor, profileHref } = await resolveStudentDetailActor(mode, studentId, "notes");
  const [header, notes] = await Promise.all([
    loadHeader(actor, studentId),
    getTeacherStudentNotesFeed(actor, studentId, { limit: 100 })
  ]);

  return (
    <StudentDetailShell
      header={header}
      title="Заметки преподавателя"
      description="Полная история внутренних заметок по ученику."
      profileHref={profileHref}
    >
      <StudentNotesDetail studentId={studentId} notes={notes} canWriteNotes={isStaffAdminScheduleActor(actor) || isTeacherScheduleActor(actor)} />
    </StudentDetailShell>
  );
}

export async function renderStudentMistakesDetailPage(mode: StudentDetailRouteMode, studentId: string) {
  const { actor, profileHref } = await resolveStudentDetailActor(mode, studentId, "mistakes");
  const [header, mistakes] = await Promise.all([
    loadHeader(actor, studentId),
    getTeacherStudentMistakesSnapshot(actor, studentId, { limit: 100 })
  ]);

  return (
    <StudentDetailShell
      header={header}
      title="Ошибки ученика"
      description="Полный список последних ошибок по активности и модулю."
      profileHref={profileHref}
    >
      <StudentMistakesDetail mistakes={mistakes} />
    </StudentDetailShell>
  );
}
