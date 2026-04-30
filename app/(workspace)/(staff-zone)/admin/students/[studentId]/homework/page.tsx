import { renderStudentHomeworkDetailPage } from "@/app/(workspace)/_components/student-profile/student-detail-route";

export default async function AdminStudentHomeworkPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return renderStudentHomeworkDetailPage("admin", studentId);
}
