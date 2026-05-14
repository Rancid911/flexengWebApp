import { redirect } from "next/navigation";

import { TeacherStudentProfileView } from "@/features/teacher-workspace/components/teacher-student-profile-view";
import {
  isStaffAdminScheduleActor,
  isStudentScheduleActor,
  isTeacherScheduleActor,
  requireSchedulePage
} from "@/lib/schedule/server";
import { measureServerTiming } from "@/lib/server/timing";
import { loadTeacherStudentProfileSections } from "@/lib/teacher-workspace/profile-page";

export async function renderTeacherStudentProfileRoute({ params }: { params: Promise<{ studentId: string }> }) {
  const actor = await measureServerTiming("teacher-student-profile-context", () => requireSchedulePage());
  const { studentId } = await params;
  if (isStudentScheduleActor(actor)) {
    redirect("/dashboard");
  }
  if (isStaffAdminScheduleActor(actor)) {
    redirect(`/admin/students/${studentId}`);
  }

  const sections = await measureServerTiming("teacher-student-profile-route-data", () =>
    loadTeacherStudentProfileSections(actor, studentId)
  );

  return (
    <TeacherStudentProfileView
      sections={sections}
      canWriteNotes={isTeacherScheduleActor(actor)}
      canManageBilling={false}
      canAssignPlacement={!isStudentScheduleActor(actor)}
      canAssignHomework={!isStudentScheduleActor(actor)}
    />
  );
}
