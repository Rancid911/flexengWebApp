import { redirect } from "next/navigation";

import { getUserRoleById } from "@/lib/auth/get-user-role";
import { getStudentDashboardData } from "@/lib/dashboard/student-dashboard";
import { createClient } from "@/lib/supabase/server";

import AdminDashboardView from "./admin-dashboard-view";
import StaffDashboardView from "./staff-dashboard-view";
import StudentDashboardView from "./student-dashboard-view";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const role = await getUserRoleById(supabase, user.id);

  if (role === "student") {
    const data = await getStudentDashboardData();
    return <StudentDashboardView data={data} />;
  }

  if (role === "admin") {
    return <AdminDashboardView />;
  }

  return <StaffDashboardView />;
}
