import { renderTeacherStudentProfileRoute } from "@/features/teacher-workspace/server/teacher-student-profile-route";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function TeacherStudentProfilePage({ params }: { params: Promise<{ studentId: string }> }) {
  await requireWorkspaceRouteAccess("students");
  return renderTeacherStudentProfileRoute({ params });
}
