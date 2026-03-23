import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { adminUserUpdateSchema } from "@/lib/admin/validation";
import { readHydratedUserByProfileId } from "@/lib/admin/users";
import { writeAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";

export const PATCH = withAdminErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireAdminApi();
  const supabase = createAdminClient();
  const { id } = await params;

    const body = await request.json();
    if (body && typeof body === "object" && "role" in body) {
      throw new AdminHttpError(400, "ROLE_IMMUTABLE", "Role can only be set on create");
    }

    const parsed = adminUserUpdateSchema.safeParse(body);
    if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid user payload", parsed.error.flatten());

    const { data: beforeProfile, error: beforeProfileError } = await supabase.from("profiles").select("*").eq("id", id).single();
    if (beforeProfileError) throw new AdminHttpError(404, "USER_NOT_FOUND", "User not found");

    const { first_name, last_name, email, password, phone, birth_date, english_level, target_level, learning_goal, notes } = parsed.data;

    const profilePatch: Record<string, unknown> = {};
    if (first_name !== undefined) profilePatch.first_name = first_name;
    if (last_name !== undefined) profilePatch.last_name = last_name;
    if (email !== undefined) profilePatch.email = email;
    if (phone !== undefined) profilePatch.phone = phone;
    if (first_name !== undefined || last_name !== undefined) {
      profilePatch.display_name = `${first_name ?? beforeProfile.first_name ?? ""} ${last_name ?? beforeProfile.last_name ?? ""}`.trim();
    }

    if (Object.keys(profilePatch).length > 0) {
      const { error: profileUpdateError } = await supabase.from("profiles").update(profilePatch).eq("id", id);
      if (profileUpdateError) throw new AdminHttpError(500, "USER_UPDATE_FAILED", "Failed to update profile", profileUpdateError.message);
    }

    if (email !== undefined || (password != null && password.trim().length > 0)) {
      const authPatch: { email?: string; password?: string } = {};
      if (email !== undefined) authPatch.email = email;
      if (password != null && password.trim().length > 0) authPatch.password = password;
      const { error: authError } = await supabase.auth.admin.updateUserById(id, authPatch);
      if (authError) throw new AdminHttpError(500, "USER_UPDATE_FAILED", "Failed to update auth user", authError.message);
    }

    if (beforeProfile.role === "student") {
      const studentPatch: Record<string, unknown> = {};
      if (birth_date !== undefined) studentPatch.birth_date = birth_date;
      if (english_level !== undefined) studentPatch.english_level = english_level;
      if (target_level !== undefined) studentPatch.target_level = target_level;
      if (learning_goal !== undefined) studentPatch.learning_goal = learning_goal;
      if (notes !== undefined) studentPatch.notes = notes;

      if (Object.keys(studentPatch).length > 0) {
        const { error: studentUpdateError } = await supabase.from("students").update(studentPatch).eq("profile_id", id);
        if (studentUpdateError) throw new AdminHttpError(500, "USER_UPDATE_FAILED", "Failed to update student details", studentUpdateError.message);
      }
    }

    const after = await readHydratedUserByProfileId(supabase, id, "USER_FETCH_FAILED");

    await writeAudit({
      actorUserId: actor.userId,
      entity: "users",
      entityId: id,
      action: "update",
      before: beforeProfile,
      after
    });

  return NextResponse.json(after);
});

export const DELETE = withAdminErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireAdminApi();
  const supabase = createAdminClient();
  const { id } = await params;

    const before = await readHydratedUserByProfileId(supabase, id, "USER_FETCH_FAILED");

    const { error: studentsDeleteError } = await supabase.from("students").delete().eq("profile_id", id);
    if (studentsDeleteError) throw new AdminHttpError(500, "USER_DELETE_FAILED", "Failed to delete student details", studentsDeleteError.message);

    const { error: profileDeleteError } = await supabase.from("profiles").delete().eq("id", id);
    if (profileDeleteError) throw new AdminHttpError(500, "USER_DELETE_FAILED", "Failed to delete profile", profileDeleteError.message);

    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);
    if (authDeleteError) throw new AdminHttpError(500, "USER_DELETE_FAILED", "Failed to delete auth user", authDeleteError.message);

    await writeAudit({
      actorUserId: actor.userId,
      entity: "users",
      entityId: id,
      action: "delete",
      before
    });

  return NextResponse.json({ ok: true });
});
