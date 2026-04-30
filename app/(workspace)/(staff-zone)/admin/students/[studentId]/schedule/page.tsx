import { renderStudentScheduleDetailPage } from "@/app/(workspace)/_components/student-profile/student-detail-route";

export default async function AdminStudentSchedulePage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return renderStudentScheduleDetailPage("admin", studentId);
}
