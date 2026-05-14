import { renderStudentNotesDetailPage } from "@/features/students/server/student-detail-route";

export default async function TeacherStudentNotesPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return renderStudentNotesDetailPage("teacher", studentId);
}
