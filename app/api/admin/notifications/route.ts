import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import { toAdminNotificationDto } from "@/lib/admin/notifications";
import { AdminHttpError, paginated, parsePagination, withAdminErrorHandling } from "@/lib/admin/http";
import { adminNotificationCreateSchema } from "@/lib/admin/validation";
import { writeAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";

export const GET = withAdminErrorHandling(async (request: NextRequest) => {
  await requireAdminApi();
  const supabase = createAdminClient();
  const { page, pageSize, q } = parsePagination(new URL(request.url));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("notifications")
    .select("id, title, body, type, is_active, target_roles, published_at, expires_at, created_by, created_at, updated_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%,type.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new AdminHttpError(500, "NOTIFICATIONS_FETCH_FAILED", "Failed to fetch notifications", error.message);

  return NextResponse.json(paginated((data ?? []).map((row) => toAdminNotificationDto(row as Record<string, unknown>)), count ?? 0, page, pageSize));
});

export const POST = withAdminErrorHandling(async (request: NextRequest) => {
  const actor = await requireAdminApi();
  const supabase = createAdminClient();

  const body = await request.json();
  const parsed = adminNotificationCreateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid notification payload", parsed.error.flatten());

  const payload = {
    title: parsed.data.title,
    body: parsed.data.body,
    type: parsed.data.type,
    is_active: parsed.data.is_active,
    target_roles: parsed.data.target_roles,
    published_at: parsed.data.published_at ?? new Date().toISOString(),
    expires_at: parsed.data.expires_at ?? null,
    created_by: actor.userId
  };

  const { data, error } = await supabase
    .from("notifications")
    .insert(payload)
    .select("id, title, body, type, is_active, target_roles, published_at, expires_at, created_by, created_at, updated_at")
    .single();
  if (error) throw new AdminHttpError(500, "NOTIFICATION_CREATE_FAILED", "Failed to create notification", error.message);

  const dto = toAdminNotificationDto(data as Record<string, unknown>);
  await writeAudit({
    actorUserId: actor.userId,
    entity: "notifications",
    entityId: dto.id,
    action: "create",
    after: dto
  });

  return NextResponse.json(dto, { status: 201 });
});
