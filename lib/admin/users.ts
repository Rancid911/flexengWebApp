import { AdminHttpError } from "@/lib/admin/http";
import { createAdminClient } from "@/lib/supabase/admin";

import type { AdminUserDto, AdminUserRole } from "@/lib/admin/types";

export type AdminUserRow = Record<string, unknown>;

export function toUserDto(row: AdminUserRow): AdminUserDto {
  return {
    id: String(row.id ?? ""),
    role: String(row.role ?? "student") as AdminUserRole,
    first_name: row.first_name == null ? null : String(row.first_name),
    last_name: row.last_name == null ? null : String(row.last_name),
    email: row.email == null ? null : String(row.email),
    phone: row.phone == null ? null : String(row.phone),
    birth_date: row.birth_date == null ? null : String(row.birth_date),
    english_level: row.english_level == null ? null : String(row.english_level),
    target_level: row.target_level == null ? null : String(row.target_level),
    learning_goal: row.learning_goal == null ? null : String(row.learning_goal),
    notes: row.notes == null ? null : String(row.notes),
    created_at: row.created_at == null ? null : String(row.created_at)
  };
}

export async function hydrateUsersWithStudentDetails(
  supabase: ReturnType<typeof createAdminClient>,
  profiles: AdminUserRow[],
  errorCode: string
) {
  const profileIds = profiles.map((row) => String(row.id ?? "")).filter(Boolean);
  if (profileIds.length === 0) return profiles;

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("profile_id, birth_date, english_level, target_level, learning_goal, notes")
    .in("profile_id", profileIds);
  if (studentsError) {
    throw new AdminHttpError(500, errorCode, "Failed to fetch student details", studentsError.message);
  }

  const studentByProfileId = new Map<string, AdminUserRow>((students ?? []).map((row: AdminUserRow) => [String(row.profile_id), row]));
  return profiles.map((profile) => {
    const student = studentByProfileId.get(String(profile.id ?? ""));
    return {
      ...profile,
      birth_date: student?.birth_date ?? null,
      english_level: student?.english_level ?? null,
      target_level: student?.target_level ?? null,
      learning_goal: student?.learning_goal ?? null,
      notes: student?.notes ?? null
    };
  });
}

export async function readHydratedUserByProfileId(
  supabase: ReturnType<typeof createAdminClient>,
  profileId: string,
  errorCode: string
) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, first_name, last_name, email, phone, created_at")
    .eq("id", profileId)
    .single();
  if (profileError) {
    throw new AdminHttpError(500, errorCode, "Failed to load profile", profileError.message);
  }

  const [hydrated] = await hydrateUsersWithStudentDetails(supabase, [profile as AdminUserRow], errorCode);
  return toUserDto(hydrated);
}
