import { getAppActor } from "@/lib/auth/request-context";
import { createAdminClient } from "@/lib/supabase/admin";

type StudentProfile = {
  userId: string;
  studentId: string | null;
  role: string | null;
  displayName: string;
  email: string;
  englishLevel: string | null;
};

export async function getCurrentStudentProfile(): Promise<StudentProfile | null> {
  const actor = await getAppActor();
  if (!actor?.isStudent) return null;

  let englishLevel: string | null = null;
  if (actor.studentId) {
    const adminClient = createAdminClient();
    const response = await adminClient.from("students").select("english_level").eq("id", actor.studentId).maybeSingle();
    if (!response.error) {
      englishLevel = response.data?.english_level ?? null;
    }
  }

  return {
    userId: actor.userId,
    studentId: actor.studentId,
    role: actor.profileRole,
    displayName: actor.displayName || actor.email.split("@")[0] || "Студент",
    email: actor.email,
    englishLevel
  };
}
