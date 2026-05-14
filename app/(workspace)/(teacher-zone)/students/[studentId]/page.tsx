import { renderTeacherStudentProfileRoute } from "@/features/teacher-workspace/server/teacher-student-profile-route";

export default async function TeacherStudentProfilePage({ params }: { params: Promise<{ studentId: string }> }) {
  return renderTeacherStudentProfileRoute({ params });
}
