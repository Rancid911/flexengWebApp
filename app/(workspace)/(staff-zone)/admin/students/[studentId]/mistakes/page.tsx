import { renderStudentMistakesDetailPage } from "@/features/students/server/student-detail-route";

export default async function AdminStudentMistakesPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return renderStudentMistakesDetailPage("admin", studentId);
}
