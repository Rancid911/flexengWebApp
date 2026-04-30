import { renderStudentHomeworkDetailPage } from "@/app/(workspace)/_components/student-profile/student-detail-route";

export default async function TeacherStudentHomeworkPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return renderStudentHomeworkDetailPage("teacher", studentId);
}
