import { renderAdminStudentProfileRoute } from "@/features/students/server/admin-student-profile-route";

export default async function AdminStudentProfilePage({ params }: { params: Promise<{ studentId: string }> }) {
  return renderAdminStudentProfileRoute({ params });
}
