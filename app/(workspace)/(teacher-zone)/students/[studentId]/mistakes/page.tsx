import { renderStudentMistakesDetailPage } from "@/app/(workspace)/_components/student-profile/student-detail-route";

export default async function TeacherStudentMistakesPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return renderStudentMistakesDetailPage("teacher", studentId);
}
