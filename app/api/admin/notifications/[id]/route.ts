import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import { toAdminNotificationDto } from "@/lib/admin/notifications";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { adminNotificationUpdateSchema } from "@/lib/admin/validation";
import { writeAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";

export const PATCH = withAdminErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireAdminApi();
  const { id } = await params;
  const supabase = createAdminClient();

  const body = await request.json();
  const parsed = adminNotificationUpdateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid notification payload", parsed.error.flatten());

  const { data: before, error: beforeError } = await supabase
    .from("notifications")
    .select("id, title, body, type, is_active, target_roles, published_at, expires_at, created_by, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (beforeError) throw new AdminHttpError(500, "NOTIFICATION_UPDATE_FAILED", "Failed to fetch notification", beforeError.message);
  if (!before) throw new AdminHttpError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");

  const payload: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from("notifications")
    .update(payload)
    .eq("id", id)
    .select("id, title, body, type, is_active, target_roles, published_at, expires_at, created_by, created_at, updated_at")
    .single();
  if (error) throw new AdminHttpError(500, "NOTIFICATION_UPDATE_FAILED", "Failed to update notification", error.message);

  const beforeDto = toAdminNotificationDto(before as Record<string, unknown>);
  const dto = toAdminNotificationDto(data as Record<string, unknown>);
  await writeAudit({
    actorUserId: actor.userId,
    entity: "notifications",
    entityId: dto.id,
    action: "update",
    before: beforeDto,
    after: dto
  });

  return NextResponse.json(dto);
});

export const DELETE = withAdminErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireAdminApi();
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: before, error: beforeError } = await supabase
    .from("notifications")
    .select("id, title, body, type, is_active, target_roles, published_at, expires_at, created_by, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (beforeError) throw new AdminHttpError(500, "NOTIFICATION_DELETE_FAILED", "Failed to fetch notification", beforeError.message);
  if (!before) throw new AdminHttpError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");

  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) throw new AdminHttpError(500, "NOTIFICATION_DELETE_FAILED", "Failed to delete notification", error.message);

  await writeAudit({
    actorUserId: actor.userId,
    entity: "notifications",
    entityId: id,
    action: "delete",
    before: toAdminNotificationDto(before as Record<string, unknown>)
  });

  return NextResponse.json({ ok: true });
});
