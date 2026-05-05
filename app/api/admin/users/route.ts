import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { parsePagination, AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { createAdminUser } from "@/lib/admin/user-service";
import { listAdminUsers } from "@/lib/admin/user-directory";
import { adminUserCreateSchema } from "@/lib/admin/validation";
import type { AdminUserRole } from "@/lib/admin/types";

export const GET = withAdminErrorHandling(async (request: NextRequest) => {
  await requireStaffAdminApi();
  const requestUrl = new URL(request.url);
  const { page, pageSize, q } = parsePagination(requestUrl);
  const roleParam = (requestUrl.searchParams.get("role") ?? "all").trim().toLowerCase();
  const roleFilter: AdminUserRole | "all" = roleParam === "all" ? "all" : (roleParam as AdminUserRole);
  const validRoles = new Set<AdminUserRole>(["student", "teacher", "manager", "admin"]);
  if (roleFilter !== "all" && !validRoles.has(roleFilter)) {
    throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid role filter");
  }
  return NextResponse.json(await listAdminUsers({ page, pageSize, q, roleFilter }));
});

export const POST = withAdminErrorHandling(async (request: NextRequest) => {
  const actor = await requireStaffAdminApi();
  const body = await request.json();
  const parsed = adminUserCreateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid user payload", parsed.error.flatten());

  return NextResponse.json(await createAdminUser(actor, parsed.data), { status: 201 });
});
