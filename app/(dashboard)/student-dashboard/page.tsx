import { getStudentDashboardData } from "@/lib/dashboard/student-dashboard";

import StudentDashboardView from "../dashboard/student-dashboard-view";

export default async function AdminStudentDashboardPage() {
  const data = await getStudentDashboardData();

  return <StudentDashboardView data={data} />;
}
