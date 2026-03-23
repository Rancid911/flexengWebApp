import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import { parsePagination, paginated, AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { adminUserCreateSchema } from "@/lib/admin/validation";
import { hydrateUsersWithStudentDetails, toUserDto } from "@/lib/admin/users";
import { writeAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminUserRole } from "@/lib/admin/types";

async function createAuthAndProfile(supabase: ReturnType<typeof createAdminClient>, payload: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  role: AdminUserRole;
}) {
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true
  });
  if (authError) {
    throw new AdminHttpError(400, "AUTH_USER_CREATE_FAILED", "Failed to create auth user", authError.message);
  }

  const userId = authData.user?.id;
  if (!userId) throw new AdminHttpError(500, "AUTH_USER_CREATE_FAILED", "Auth user was not returned");

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
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
  if (profileError) {
    await supabase.auth.admin.deleteUser(userId).catch(() => undefined);
    throw new AdminHttpError(500, "PROFILE_CREATE_FAILED", "Failed to create profile", profileError.message);
  }

  return userId;
}

export const GET = withAdminErrorHandling(async (request: NextRequest) => {
  await requireAdminApi();
  const supabase = createAdminClient();
  const requestUrl = new URL(request.url);
  const { page, pageSize, q } = parsePagination(requestUrl);
  const roleParam = (requestUrl.searchParams.get("role") ?? "all").trim().toLowerCase();
  const roleFilter: AdminUserRole | "all" = roleParam === "all" ? "all" : (roleParam as AdminUserRole);
  const validRoles = new Set<AdminUserRole>(["student", "teacher", "manager", "admin"]);
  if (roleFilter !== "all" && !validRoles.has(roleFilter)) {
    throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid role filter");
  }
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("profiles")
    .select("id, role, first_name, last_name, email, phone, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,role.ilike.%${q}%`);
  }
  if (roleFilter !== "all") {
    query = query.eq("role", roleFilter);
  }

  const { data, error, count } = await query;
  if (error) throw new AdminHttpError(500, "USERS_FETCH_FAILED", "Failed to fetch users", error.message);

  const hydrated = await hydrateUsersWithStudentDetails(supabase, (data ?? []) as Record<string, unknown>[], "USERS_FETCH_FAILED");
  return NextResponse.json(paginated(hydrated.map((x) => toUserDto(x)), count ?? 0, page, pageSize));
});

export const POST = withAdminErrorHandling(async (request: NextRequest) => {
  const actor = await requireAdminApi();
  const supabase = createAdminClient();
  const body = await request.json();
  const parsed = adminUserCreateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid user payload", parsed.error.flatten());

    const profileId = await createAuthAndProfile(supabase, {
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: parsed.data.email,
      password: parsed.data.password,
      phone: parsed.data.phone,
      role: parsed.data.role
    });

    if (parsed.data.role === "student") {
      const { error: studentError } = await supabase.from("students").insert({
        profile_id: profileId,
        birth_date: parsed.data.birth_date,
        english_level: parsed.data.english_level,
        target_level: parsed.data.target_level,
        learning_goal: parsed.data.learning_goal,
        notes: parsed.data.notes
      });
      if (studentError) {
        await supabase.from("profiles").delete().eq("id", profileId);
        await supabase.auth.admin.deleteUser(profileId);
        throw new AdminHttpError(500, "USER_CREATE_FAILED", "Failed to create student details", studentError.message);
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, first_name, last_name, email, phone, created_at")
      .eq("id", profileId)
      .single();
    if (profileError) throw new AdminHttpError(500, "USER_CREATE_FAILED", "Failed to read created profile", profileError.message);

    const hydrated = await hydrateUsersWithStudentDetails(supabase, [profile as Record<string, unknown>], "USER_CREATE_FAILED");
    const dto = toUserDto(hydrated[0]);

    await writeAudit({
      actorUserId: actor.userId,
      entity: "users",
      entityId: profileId,
      action: "create",
      after: dto
    });

  return NextResponse.json(dto, { status: 201 });
});
