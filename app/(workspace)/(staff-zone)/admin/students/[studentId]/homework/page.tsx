import { renderStudentHomeworkDetailPage } from "@/features/students/server/student-detail-route";

export default async function AdminStudentHomeworkPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return renderStudentHomeworkDetailPage("admin", studentId);
}
