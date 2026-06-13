import { renderStudentHomeworkDetailPage } from "@/features/students/server/student-detail-route";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function TeacherStudentHomeworkPage({ params }: { params: Promise<{ studentId: string }> }) {
  await requireWorkspaceRouteAccess("students");
  const { studentId } = await params;
  return renderStudentHomeworkDetailPage("teacher", studentId);
}
