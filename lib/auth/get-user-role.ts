import type { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "student" | "teacher" | "manager" | "admin";

export async function getUserRoleById(supabase: SupabaseClient, userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (error) {
    throw error;
  }

  const role = data?.role;
  if (role === "student" || role === "teacher" || role === "manager" || role === "admin") {
    return role;
  }
  return null;
}
