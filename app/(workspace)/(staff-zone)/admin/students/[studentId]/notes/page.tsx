import { renderStudentNotesDetailPage } from "@/app/(workspace)/_components/student-profile/student-detail-route";

export default async function AdminStudentNotesPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return renderStudentNotesDetailPage("admin", studentId);
}
