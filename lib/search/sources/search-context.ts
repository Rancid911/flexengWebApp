import type { UserRole } from "@/lib/auth/get-user-role";
import { createClient } from "@/lib/supabase/server";
import type { SearchContext } from "@/lib/search/types";

export async function getSearchContext(): Promise<SearchContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      userId: null,
      role: null,
      studentId: null,
      teacherId: null,
      isAuthenticated: false
    };
  }

  const [{ data: profile }, { data: student }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase.from("students").select("id").eq("profile_id", user.id).maybeSingle()
  ]);

  const role =
    profile?.role === "student" || profile?.role === "teacher" || profile?.role === "manager" || profile?.role === "admin"
      ? (profile.role as UserRole)
      : null;

  return {
    userId: user.id,
    role,
    studentId: student?.id ?? null,
    teacherId: null,
    isAuthenticated: true
  };
}
