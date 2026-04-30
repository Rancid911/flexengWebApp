import { renderStudentMistakesDetailPage } from "@/app/(workspace)/_components/student-profile/student-detail-route";

export default async function AdminStudentMistakesPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return renderStudentMistakesDetailPage("admin", studentId);
}
