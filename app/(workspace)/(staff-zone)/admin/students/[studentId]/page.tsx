import { redirect } from "next/navigation";

import { StudentProfileView } from "@/app/(workspace)/_components/student-profile/student-profile-view";
import { measureServerTiming } from "@/lib/server/timing";
import { isStaffAdminScheduleActor, isStudentScheduleActor, requireSchedulePage } from "@/lib/schedule/server";
import { loadTeacherStudentProfileSections } from "@/lib/teacher-workspace/profile-page";

export default async function AdminStudentProfilePage({ params }: { params: Promise<{ studentId: string }> }) {
  const actor = await measureServerTiming("admin-student-profile-context", () => requireSchedulePage());
  if (isStudentScheduleActor(actor) || !isStaffAdminScheduleActor(actor)) {
    redirect("/dashboard");
  }

  const { studentId } = await params;
  const sections = await measureServerTiming("admin-student-profile-route-data", () => loadTeacherStudentProfileSections(actor, studentId));

  return (
    <StudentProfileView
      sections={sections}
      canWriteNotes
      canManageBilling
      canAssignPlacement
      canAssignHomework
      backLink={{ href: "/admin/students", label: "Назад к ученикам" }}
      profileBasePath={`/admin/students/${sections.header.studentId}`}
    />
  );
}
