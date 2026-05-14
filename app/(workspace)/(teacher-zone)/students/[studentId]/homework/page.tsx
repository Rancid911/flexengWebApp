import { renderStudentHomeworkDetailPage } from "@/features/students/server/student-detail-route";

export default async function TeacherStudentHomeworkPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return renderStudentHomeworkDetailPage("teacher", studentId);
}
