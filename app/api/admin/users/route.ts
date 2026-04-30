import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { parsePagination, paginated, AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { createAdminUser } from "@/lib/admin/user-service";
import { adminUserCreateSchema } from "@/lib/admin/validation";
import { hydrateUsersWithStudentDetails, toUserDto } from "@/lib/admin/users";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminUserRole } from "@/lib/admin/types";

export const GET = withAdminErrorHandling(async (request: NextRequest) => {
  await requireStaffAdminApi();
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
  const actor = await requireStaffAdminApi();
  const body = await request.json();
  const parsed = adminUserCreateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid user payload", parsed.error.flatten());

  return NextResponse.json(await createAdminUser(actor, parsed.data), { status: 201 });
});
