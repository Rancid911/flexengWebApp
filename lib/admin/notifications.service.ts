import { writeAudit } from "@/lib/admin/audit";
import { AdminHttpError, paginated } from "@/lib/admin/http";
import { toAdminNotificationDto } from "@/lib/admin/notifications";
import { createAdminNotificationsRepository } from "@/lib/admin/notifications.repository";
import type { AdminActor, AdminNotificationDto, PaginatedResponse } from "@/lib/admin/types";
import type { adminNotificationCreateSchema, adminNotificationUpdateSchema } from "@/lib/admin/validation";
import type { z } from "zod";

type AdminNotificationCreatePayload = z.infer<typeof adminNotificationCreateSchema>;
type AdminNotificationUpdatePayload = z.infer<typeof adminNotificationUpdateSchema>;

type PaginationInput = {
  page: number;
  pageSize: number;
  q?: string | null;
};

export async function listAdminNotifications(params: PaginationInput): Promise<PaginatedResponse<AdminNotificationDto>> {
  const repository = createAdminNotificationsRepository();
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;
  const { data, error, count } = await repository.listNotifications({ from, to, q: params.q });
  if (error) throw new AdminHttpError(500, "NOTIFICATIONS_FETCH_FAILED", "Failed to fetch notifications", error.message);

  return paginated((data ?? []).map((row) => toAdminNotificationDto(row as Record<string, unknown>)), count ?? 0, params.page, params.pageSize);
}

export async function createAdminNotification(actor: AdminActor, payload: AdminNotificationCreatePayload): Promise<AdminNotificationDto> {
  const repository = createAdminNotificationsRepository();
  const { data, error } = await repository.createNotification({
    title: payload.title,
    body: payload.body,
    type: payload.type,
    is_active: payload.is_active,
    target_roles: payload.target_roles,
    published_at: payload.published_at ?? new Date().toISOString(),
    expires_at: payload.expires_at ?? null,
    created_by: actor.userId
  });
  if (error) throw new AdminHttpError(500, "NOTIFICATION_CREATE_FAILED", "Failed to create notification", error.message);

  const dto = toAdminNotificationDto(data as Record<string, unknown>);
  await writeAudit({ actorUserId: actor.userId, entity: "notifications", entityId: dto.id, action: "create", after: dto });
  return dto;
}

export async function updateAdminNotification(actor: AdminActor, id: string, payload: AdminNotificationUpdatePayload): Promise<AdminNotificationDto> {
  const repository = createAdminNotificationsRepository();
  const { data: before, error: beforeError } = await repository.loadNotification(id);
  if (beforeError) throw new AdminHttpError(500, "NOTIFICATION_UPDATE_FAILED", "Failed to fetch notification", beforeError.message);
  if (!before) throw new AdminHttpError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");

  const { data, error } = await repository.updateNotification(id, { ...payload, updated_at: new Date().toISOString() });
  if (error) throw new AdminHttpError(500, "NOTIFICATION_UPDATE_FAILED", "Failed to update notification", error.message);

  const beforeDto = toAdminNotificationDto(before as Record<string, unknown>);
  const dto = toAdminNotificationDto(data as Record<string, unknown>);
  await writeAudit({ actorUserId: actor.userId, entity: "notifications", entityId: dto.id, action: "update", before: beforeDto, after: dto });
  return dto;
}

export async function deleteAdminNotification(actor: AdminActor, id: string): Promise<{ ok: true }> {
  const repository = createAdminNotificationsRepository();
  const { data: before, error: beforeError } = await repository.loadNotification(id);
  if (beforeError) throw new AdminHttpError(500, "NOTIFICATION_DELETE_FAILED", "Failed to fetch notification", beforeError.message);
  if (!before) throw new AdminHttpError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");

  const { error } = await repository.deleteNotification(id);
  if (error) throw new AdminHttpError(500, "NOTIFICATION_DELETE_FAILED", "Failed to delete notification", error.message);

  await writeAudit({ actorUserId: actor.userId, entity: "notifications", entityId: id, action: "delete", before: toAdminNotificationDto(before as Record<string, unknown>) });
  return { ok: true };
}
