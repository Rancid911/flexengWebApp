import { AdminHttpError } from "@/lib/admin/http";
import type { AdminUserRole } from "@/lib/admin/types";
import {
  assignPrimaryTeacherToStudent,
  deleteTeacherRecord,
  ensureTeacherRecord,
  hydrateUsersWithStudentDetails,
  readHydratedUserByProfileId,
  resolveTeacherProfileId,
  toUserDto
} from "@/lib/admin/users";
import { createAdminClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";

export type AdminAuthSupabaseClient = ReturnType<typeof createAdminClient>;
export type AdminUserTableClient = Awaited<ReturnType<typeof createClient>>;
export type AdminSupabaseClient = AdminAuthSupabaseClient;

export const ADMIN_PROFILE_SELECT = "id, role, first_name, last_name, display_name, email, phone, avatar_url, status, created_at, updated_at";

export function createAdminAuthUserClient() {
  return createAdminClient();
}

export const createAdminUserRepositoryClient = createAdminAuthUserClient;

export async function createAuthUser(
  supabase: AdminAuthSupabaseClient,
  payload: { email: string; password: string; role: AdminUserRole }
) {
  return await supabase.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    app_metadata: {
      provision_role: payload.role
    }
  });
}

export async function updateAuthUserById(supabase: AdminAuthSupabaseClient, userId: string, patch: { email?: string; password?: string }) {
  return await supabase.auth.admin.updateUserById(userId, patch);
}

export async function deleteAuthUserById(supabase: AdminAuthSupabaseClient, userId: string) {
  return await supabase.auth.admin.deleteUser(userId);
}

export async function deleteAuthUserByIdSafely(supabase: AdminAuthSupabaseClient, userId: string) {
  try {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.error("ADMIN_USER_ROLLBACK_FAILED", { userId, message: error.message });
    }
  } catch (error) {
    console.error("ADMIN_USER_ROLLBACK_FAILED", { userId, error });
  }
}

export async function updateProvisionedProfile(
  supabase: AdminUserTableClient,
  payload: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    role: AdminUserRole;
  }
) {
  return await supabase
    .from("profiles")
    .update({
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      display_name: `${payload.first_name} ${payload.last_name}`.trim(),
      phone: payload.phone,
      role: payload.role,
      status: "active"
    })
    .eq("id", payload.id);
}

export async function readProfileById(supabase: AdminUserTableClient, userId: string) {
  return await supabase.from("profiles").select(ADMIN_PROFILE_SELECT).eq("id", userId).single();
}

export async function readCreatedProfileById(supabase: AdminUserTableClient, userId: string) {
  return await supabase.from("profiles").select(ADMIN_PROFILE_SELECT).eq("id", userId).single();
}

export async function updateProfileById(supabase: AdminUserTableClient, userId: string, patch: Record<string, unknown>) {
  return await supabase.from("profiles").update(patch).eq("id", userId);
}

export async function deleteProfileById(supabase: AdminUserTableClient, userId: string) {
  return await supabase.from("profiles").delete().eq("id", userId);
}

export async function updateProvisionedStudentDetails(
  supabase: AdminUserTableClient,
  payload: {
    profileId: string;
    birthDate?: string | null;
    englishLevel?: string | null;
    targetLevel?: string | null;
    learningGoal?: string | null;
    notes?: string | null;
  }
) {
  return await supabase
    .from("students")
    .update({
      birth_date: payload.birthDate,
      english_level: payload.englishLevel,
      target_level: payload.targetLevel,
      learning_goal: payload.learningGoal,
      notes: payload.notes
    })
    .eq("profile_id", payload.profileId)
    .select("id")
    .single();
}

export async function readStudentIdByProfileId(supabase: AdminUserTableClient, profileId: string) {
  return await supabase.from("students").select("id").eq("profile_id", profileId).single();
}

export async function updateStudentDetailsByProfileId(supabase: AdminUserTableClient, profileId: string, patch: Record<string, unknown>) {
  return await supabase.from("students").update(patch).eq("profile_id", profileId);
}

export async function deleteStudentDetailsByProfileId(supabase: AdminUserTableClient, profileId: string) {
  return await supabase.from("students").delete().eq("profile_id", profileId);
}

export async function readPrimaryTeacherIdByStudentId(supabase: AdminUserTableClient, studentId: string) {
  return await supabase.from("students").select("primary_teacher_id").eq("id", studentId).maybeSingle();
}

export async function upsertStudentBillingAccount(
  supabase: AdminUserTableClient,
  payload: {
    studentId: string;
    billingMode: string;
    lessonPriceAmount: number | null;
    updatedByProfileId: string;
  }
) {
  return await supabase.from("student_billing_accounts").upsert(
    {
      student_id: payload.studentId,
      billing_mode: payload.billingMode,
      lesson_price_amount: payload.billingMode === "per_lesson_price" ? payload.lessonPriceAmount ?? null : null,
      currency: "RUB",
      updated_by_profile_id: payload.updatedByProfileId
    },
    { onConflict: "student_id" }
  );
}

export async function deleteStudentBillingAccount(supabase: AdminUserTableClient, studentId: string) {
  return await supabase.from("student_billing_accounts").delete().eq("student_id", studentId);
}

export async function ensureTeacherRecordForProfile(supabase: AdminUserTableClient, profileId: string) {
  await ensureTeacherRecord(supabase, profileId);
}

export async function deleteTeacherRecordForProfile(supabase: AdminUserTableClient, profileId: string) {
  await deleteTeacherRecord(supabase, profileId);
}

export async function resolveTeacherProfileIdForTeacher(supabase: AdminUserTableClient, teacherId: string | null) {
  return await resolveTeacherProfileId(supabase, teacherId);
}

export async function assignPrimaryTeacher(supabase: AdminUserTableClient, studentId: string, teacherId: string | null) {
  await assignPrimaryTeacherToStudent(supabase, studentId, teacherId);
}

export async function readHydratedAdminUserByProfileId(supabase: AdminUserTableClient, profileId: string, errorCode: string) {
  return await readHydratedUserByProfileId(supabase, profileId, errorCode);
}

export async function hydrateCreatedAdminUser(supabase: AdminUserTableClient, profile: Record<string, unknown>, errorCode: string) {
  const hydrated = await hydrateUsersWithStudentDetails(supabase, [profile], errorCode);
  if (!hydrated[0]) {
    throw new AdminHttpError(500, errorCode, "Failed to hydrate user");
  }
  return toUserDto(hydrated[0]);
}
