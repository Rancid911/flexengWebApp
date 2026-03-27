import { createClient } from "@/lib/supabase/server";

type StudentProfile = {
  userId: string;
  studentId: string | null;
  role: string | null;
  displayName: string;
  email: string;
};

function buildDisplayName(profile: { display_name?: string | null; first_name?: string | null; last_name?: string | null } | null, email: string) {
  return profile?.display_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || email.split("@")[0] || "Студент";
}

export async function getCurrentStudentProfile(): Promise<StudentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email, display_name, first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: student } = await supabase.from("students").select("id").eq("profile_id", user.id).maybeSingle();

  // Admin full-student-mode uses the same runtime path as a regular student:
  // the account must have its own linked row in `students`.
  return {
    userId: user.id,
    studentId: student?.id ?? null,
    role: typeof profile?.role === "string" ? profile.role : null,
    displayName: buildDisplayName(profile, user.email ?? ""),
    email: profile?.email ?? user.email ?? ""
  };
}
