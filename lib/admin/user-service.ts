import type { z } from "zod";

import { writeAudit } from "@/lib/admin/audit";
import { AdminHttpError } from "@/lib/admin/http";
import {
  assignPrimaryTeacher,
  createAdminUserRepositoryClient,
  createAuthUser,
  createStudentDetailsRow,
  deleteAuthUserById,
  deleteAuthUserByIdSafely,
  deleteProfileById,
  deleteProfileRowForRollback,
  deleteStudentBillingAccount,
  deleteStudentDetailsByProfileId,
  deleteTeacherRecordForProfile,
  ensureTeacherRecordForProfile,
  hydrateCreatedAdminUser,
  readCreatedProfileById,
  readHydratedAdminUserByProfileId,
  readPrimaryTeacherIdByStudentId,
  readProfileById,
  readStudentIdByProfileId,
  resolveTeacherProfileIdForTeacher,
  updateAuthUserById,
  updateProfileById,
  updateStudentDetailsByProfileId,
  upsertProfileRow,
  upsertStudentBillingAccount,
  type AdminSupabaseClient
} from "@/lib/admin/user.repository";
import type { AdminActor, AdminUserRole } from "@/lib/admin/types";
import { adminUserCreateSchema, adminUserUpdateSchema } from "@/lib/admin/validation";
import { invalidateFullAppActorCache } from "@/lib/auth/request-context";

type AdminUserCreateInput = z.infer<typeof adminUserCreateSchema>;
type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;

async function createAuthAndProfile(
  supabase: AdminSupabaseClient,
  payload: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone: string;
    role: AdminUserRole;
  }
) {
  const { data: authData, error: authError } = await createAuthUser(supabase, payload);
  if (authError) {
    throw new AdminHttpError(400, "AUTH_USER_CREATE_FAILED", "Failed to create auth user", authError.message);
  }

  const userId = authData.user?.id;
  if (!userId) throw new AdminHttpError(500, "AUTH_USER_CREATE_FAILED", "Auth user was not returned");

  const { error: profileError } = await upsertProfileRow(supabase, { id: userId, ...payload });
  if (profileError) {
    await deleteAuthUserByIdSafely(supabase, userId);
    throw new AdminHttpError(500, "PROFILE_CREATE_FAILED", "Failed to create profile", profileError.message);
  }

  return userId;
}

export async function createAdminUser(actor: AdminActor, payload: AdminUserCreateInput) {
  const supabase = createAdminUserRepositoryClient();
  const profileId = await createAuthAndProfile(supabase, {
    first_name: payload.first_name,
    last_name: payload.last_name,
    email: payload.email,
    password: payload.password,
    phone: payload.phone,
    role: payload.role
  });

  if (payload.role === "teacher") {
    await ensureTeacherRecordForProfile(supabase, profileId);
  }

  if (payload.role === "student") {
    const { data: studentRow, error: studentError } = await createStudentDetailsRow(supabase, {
      profileId,
      birthDate: payload.birth_date,
      englishLevel: payload.english_level,
      targetLevel: payload.target_level,
      learningGoal: payload.learning_goal,
      notes: payload.notes
    });
    if (studentError) {
      await deleteProfileRowForRollback(supabase, profileId);
      await deleteAuthUserById(supabase, profileId);
      throw new AdminHttpError(500, "USER_CREATE_FAILED", "Failed to create student details", studentError.message);
    }

    let assignedTeacherProfileId: string | null = null;
    if (payload.assigned_teacher_id) {
      assignedTeacherProfileId = await resolveTeacherProfileIdForTeacher(supabase, payload.assigned_teacher_id);
      await assignPrimaryTeacher(supabase, String(studentRow.id), payload.assigned_teacher_id);
    }

    if (payload.billing_mode) {
      const { error: billingError } = await upsertStudentBillingAccount(supabase, {
        studentId: String(studentRow.id),
        billingMode: payload.billing_mode,
        lessonPriceAmount: payload.lesson_price_amount ?? null,
        updatedByProfileId: actor.userId
      });
      if (billingError) {
        throw new AdminHttpError(500, "USER_CREATE_FAILED", "Failed to create billing settings", billingError.message);
      }
    }

    if (assignedTeacherProfileId) {
      await invalidateFullAppActorCache(assignedTeacherProfileId);
    }
  }

  const { data: profile, error: profileError } = await readCreatedProfileById(supabase, profileId);
  if (profileError) throw new AdminHttpError(500, "USER_CREATE_FAILED", "Failed to read created profile", profileError.message);

  const dto = await hydrateCreatedAdminUser(supabase, profile as Record<string, unknown>, "USER_CREATE_FAILED");

  await writeAudit({
    actorUserId: actor.userId,
    entity: "users",
    entityId: profileId,
    action: "create",
    after: dto
  });

  await invalidateFullAppActorCache(profileId);

  return dto;
}

export async function updateAdminUser(actor: AdminActor, userId: string, payload: AdminUserUpdateInput) {
  const supabase = createAdminUserRepositoryClient();
  const { data: beforeProfile, error: beforeProfileError } = await readProfileById(supabase, userId);
  if (beforeProfileError) throw new AdminHttpError(404, "USER_NOT_FOUND", "User not found");

  const {
    first_name,
    last_name,
    email,
    password,
    phone,
    birth_date,
    english_level,
    target_level,
    learning_goal,
    notes,
    assigned_teacher_id,
    billing_mode,
    lesson_price_amount
  } = payload;

  const profilePatch: Record<string, unknown> = {};
  if (first_name !== undefined) profilePatch.first_name = first_name;
  if (last_name !== undefined) profilePatch.last_name = last_name;
  if (email !== undefined) profilePatch.email = email;
  if (phone !== undefined) profilePatch.phone = phone;
  if (first_name !== undefined || last_name !== undefined) {
    profilePatch.display_name = `${first_name ?? beforeProfile.first_name ?? ""} ${last_name ?? beforeProfile.last_name ?? ""}`.trim();
  }

  if (Object.keys(profilePatch).length > 0) {
    const { error: profileUpdateError } = await updateProfileById(supabase, userId, profilePatch);
    if (profileUpdateError) throw new AdminHttpError(500, "USER_UPDATE_FAILED", "Failed to update profile", profileUpdateError.message);
  }

  if (email !== undefined || (password != null && password.trim().length > 0)) {
    const authPatch: { email?: string; password?: string } = {};
    if (email !== undefined) authPatch.email = email;
    if (password != null && password.trim().length > 0) authPatch.password = password;
    const { error: authError } = await updateAuthUserById(supabase, userId, authPatch);
    if (authError) throw new AdminHttpError(500, "USER_UPDATE_FAILED", "Failed to update auth user", authError.message);
  }

  if (beforeProfile.role === "student") {
    const { data: studentRow, error: studentReadError } = await readStudentIdByProfileId(supabase, userId);
    if (studentReadError) throw new AdminHttpError(500, "USER_UPDATE_FAILED", "Failed to resolve student details", studentReadError.message);

    const studentPatch: Record<string, unknown> = {};
    if (birth_date !== undefined) studentPatch.birth_date = birth_date;
    if (english_level !== undefined) studentPatch.english_level = english_level;
    if (target_level !== undefined) studentPatch.target_level = target_level;
    if (learning_goal !== undefined) studentPatch.learning_goal = learning_goal;
    if (notes !== undefined) studentPatch.notes = notes;

    if (Object.keys(studentPatch).length > 0) {
      const { error: studentUpdateError } = await updateStudentDetailsByProfileId(supabase, userId, studentPatch);
      if (studentUpdateError) throw new AdminHttpError(500, "USER_UPDATE_FAILED", "Failed to update student details", studentUpdateError.message);
    }

    let previousTeacherProfileIds: string[] = [];
    let nextTeacherProfileId: string | null = null;
    if (assigned_teacher_id !== undefined) {
      const previousPrimaryTeacher = await readPrimaryTeacherIdByStudentId(supabase, String(studentRow.id));
      if (previousPrimaryTeacher.error) {
        throw new AdminHttpError(500, "USER_UPDATE_FAILED", "Failed to load current teacher assignment", previousPrimaryTeacher.error.message);
      }

      previousTeacherProfileIds = (
        await Promise.all(
          Array.from(new Set([previousPrimaryTeacher.data?.primary_teacher_id].filter((value): value is string => Boolean(value)))).map((teacherId) =>
            resolveTeacherProfileIdForTeacher(supabase, teacherId)
          )
        )
      ).filter((value): value is string => Boolean(value));

      nextTeacherProfileId = await resolveTeacherProfileIdForTeacher(supabase, assigned_teacher_id);
      await assignPrimaryTeacher(supabase, String(studentRow.id), assigned_teacher_id);
    }

    if (billing_mode !== undefined || lesson_price_amount !== undefined) {
      if (billing_mode === null) {
        const { error: billingDeleteError } = await deleteStudentBillingAccount(supabase, String(studentRow.id));
        if (billingDeleteError) throw new AdminHttpError(500, "USER_UPDATE_FAILED", "Failed to clear billing settings", billingDeleteError.message);
      } else if (billing_mode !== undefined) {
        const { error: billingUpsertError } = await upsertStudentBillingAccount(supabase, {
          studentId: String(studentRow.id),
          billingMode: billing_mode,
          lessonPriceAmount: lesson_price_amount ?? null,
          updatedByProfileId: actor.userId
        });
        if (billingUpsertError) throw new AdminHttpError(500, "USER_UPDATE_FAILED", "Failed to update billing settings", billingUpsertError.message);
      }
    }

    for (const teacherProfileId of new Set([...previousTeacherProfileIds, ...(nextTeacherProfileId ? [nextTeacherProfileId] : [])])) {
      await invalidateFullAppActorCache(teacherProfileId);
    }
  }

  const after = await readHydratedAdminUserByProfileId(supabase, userId, "USER_FETCH_FAILED");

  await writeAudit({
    actorUserId: actor.userId,
    entity: "users",
    entityId: userId,
    action: "update",
    before: beforeProfile,
    after
  });

  await invalidateFullAppActorCache(userId);

  return after;
}

export async function deleteAdminUser(actor: AdminActor, userId: string) {
  const supabase = createAdminUserRepositoryClient();
  const before = await readHydratedAdminUserByProfileId(supabase, userId, "USER_FETCH_FAILED");

  if (before.role === "teacher") {
    await deleteTeacherRecordForProfile(supabase, userId);
  }

  const { error: studentsDeleteError } = await deleteStudentDetailsByProfileId(supabase, userId);
  if (studentsDeleteError) throw new AdminHttpError(500, "USER_DELETE_FAILED", "Failed to delete student details", studentsDeleteError.message);

  const { error: profileDeleteError } = await deleteProfileById(supabase, userId);
  if (profileDeleteError) throw new AdminHttpError(500, "USER_DELETE_FAILED", "Failed to delete profile", profileDeleteError.message);

  const { error: authDeleteError } = await deleteAuthUserById(supabase, userId);
  if (authDeleteError) throw new AdminHttpError(500, "USER_DELETE_FAILED", "Failed to delete auth user", authDeleteError.message);

  await writeAudit({
    actorUserId: actor.userId,
    entity: "users",
    entityId: userId,
    action: "delete",
    before
  });

  await invalidateFullAppActorCache(userId);
}
