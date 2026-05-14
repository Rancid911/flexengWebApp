import { renderStudentScheduleDetailPage } from "@/features/students/server/student-detail-route";

export default async function TeacherStudentSchedulePage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return renderStudentScheduleDetailPage("teacher", studentId);
}
