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

export type AdminSupabaseClient = ReturnType<typeof createAdminClient>;

export function createAdminUserRepositoryClient() {
  return createAdminClient();
}

export async function createAuthUser(
  supabase: AdminSupabaseClient,
  payload: { email: string; password: string }
) {
  return await supabase.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true
  });
}

export async function updateAuthUserById(supabase: AdminSupabaseClient, userId: string, patch: { email?: string; password?: string }) {
  return await supabase.auth.admin.updateUserById(userId, patch);
}

export async function deleteAuthUserById(supabase: AdminSupabaseClient, userId: string) {
  return await supabase.auth.admin.deleteUser(userId);
}

export async function deleteAuthUserByIdSafely(supabase: AdminSupabaseClient, userId: string) {
  await supabase.auth.admin.deleteUser(userId).catch(() => undefined);
}

export async function upsertProfileRow(
  supabase: AdminSupabaseClient,
  payload: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    role: AdminUserRole;
  }
) {
  return await supabase.from("profiles").upsert(
    {
      id: payload.id,
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      display_name: `${payload.first_name} ${payload.last_name}`.trim(),
      phone: payload.phone,
      role: payload.role,
      status: "active"
    },
    { onConflict: "id" }
  );
}

export async function readProfileById(supabase: AdminSupabaseClient, userId: string) {
  return await supabase.from("profiles").select("*").eq("id", userId).single();
}

export async function readCreatedProfileById(supabase: AdminSupabaseClient, userId: string) {
  return await supabase.from("profiles").select("id, role, first_name, last_name, email, phone, created_at").eq("id", userId).single();
}

export async function updateProfileById(supabase: AdminSupabaseClient, userId: string, patch: Record<string, unknown>) {
  return await supabase.from("profiles").update(patch).eq("id", userId);
}

export async function deleteProfileById(supabase: AdminSupabaseClient, userId: string) {
  return await supabase.from("profiles").delete().eq("id", userId);
}

export async function createStudentDetailsRow(
  supabase: AdminSupabaseClient,
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
    .insert({
      profile_id: payload.profileId,
      birth_date: payload.birthDate,
      english_level: payload.englishLevel,
      target_level: payload.targetLevel,
      learning_goal: payload.learningGoal,
      notes: payload.notes
    })
    .select("id")
    .single();
}

export async function readStudentIdByProfileId(supabase: AdminSupabaseClient, profileId: string) {
  return await supabase.from("students").select("id").eq("profile_id", profileId).single();
}

export async function updateStudentDetailsByProfileId(supabase: AdminSupabaseClient, profileId: string, patch: Record<string, unknown>) {
  return await supabase.from("students").update(patch).eq("profile_id", profileId);
}

export async function deleteStudentDetailsByProfileId(supabase: AdminSupabaseClient, profileId: string) {
  return await supabase.from("students").delete().eq("profile_id", profileId);
}

export async function readPrimaryTeacherIdByStudentId(supabase: AdminSupabaseClient, studentId: string) {
  return await supabase.from("students").select("primary_teacher_id").eq("id", studentId).maybeSingle();
}

export async function upsertStudentBillingAccount(
  supabase: AdminSupabaseClient,
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

export async function deleteStudentBillingAccount(supabase: AdminSupabaseClient, studentId: string) {
  return await supabase.from("student_billing_accounts").delete().eq("student_id", studentId);
}

export async function deleteProfileRowForRollback(supabase: AdminSupabaseClient, profileId: string) {
  await supabase.from("profiles").delete().eq("id", profileId);
}

export async function ensureTeacherRecordForProfile(supabase: AdminSupabaseClient, profileId: string) {
  await ensureTeacherRecord(supabase, profileId);
}

export async function deleteTeacherRecordForProfile(supabase: AdminSupabaseClient, profileId: string) {
  await deleteTeacherRecord(supabase, profileId);
}

export async function resolveTeacherProfileIdForTeacher(supabase: AdminSupabaseClient, teacherId: string | null) {
  return await resolveTeacherProfileId(supabase, teacherId);
}

export async function assignPrimaryTeacher(supabase: AdminSupabaseClient, studentId: string, teacherId: string | null) {
  await assignPrimaryTeacherToStudent(supabase, studentId, teacherId);
}

export async function readHydratedAdminUserByProfileId(supabase: AdminSupabaseClient, profileId: string, errorCode: string) {
  return await readHydratedUserByProfileId(supabase, profileId, errorCode);
}

export async function hydrateCreatedAdminUser(supabase: AdminSupabaseClient, profile: Record<string, unknown>, errorCode: string) {
  const hydrated = await hydrateUsersWithStudentDetails(supabase, [profile], errorCode);
  if (!hydrated[0]) {
    throw new AdminHttpError(500, errorCode, "Failed to hydrate user");
  }
  return toUserDto(hydrated[0]);
}
