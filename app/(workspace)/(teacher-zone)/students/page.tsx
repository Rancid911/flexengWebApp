import { renderTeacherStudentsRoute } from "@/features/teacher-workspace/server/teacher-students-route";

export default async function TeacherStudentsPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  return renderTeacherStudentsRoute({ searchParams });
}
