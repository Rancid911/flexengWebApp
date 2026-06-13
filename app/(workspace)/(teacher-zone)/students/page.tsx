import { renderTeacherStudentsRoute } from "@/features/teacher-workspace/server/teacher-students-route";
import { requireWorkspaceRouteAccess } from "@/lib/auth/rbac-route-guard";

export default async function TeacherStudentsPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  await requireWorkspaceRouteAccess("students");
  return renderTeacherStudentsRoute({ searchParams });
}
