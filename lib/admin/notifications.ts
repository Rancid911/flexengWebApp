import type { AdminNotificationDto, NotificationTargetRole, NotificationType, UserNotificationDto } from "@/lib/admin/types";

function toNotificationType(value: unknown): NotificationType {
  if (value === "maintenance" || value === "update" || value === "news" || value === "assignments") return value;
  return "update";
}

function toTargetRoles(value: unknown): NotificationTargetRole[] {
  if (!Array.isArray(value)) return ["all"];
  const roles = value
    .map((item) => (typeof item === "string" ? item : ""))
    .filter((item): item is NotificationTargetRole => item === "all" || item === "admin" || item === "manager" || item === "teacher" || item === "student");
  if (roles.length === 0) return ["all"];
  if (roles.includes("all")) return ["all"];
  return Array.from(new Set(roles));
}

export function toAdminNotificationDto(row: Record<string, unknown>): AdminNotificationDto {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    type: toNotificationType(row.type),
    is_active: row.is_active === true,
    target_roles: toTargetRoles(row.target_roles),
    published_at: row.published_at == null ? null : String(row.published_at),
    expires_at: row.expires_at == null ? null : String(row.expires_at),
    created_by: row.created_by == null ? null : String(row.created_by),
    created_at: row.created_at == null ? null : String(row.created_at),
    updated_at: row.updated_at == null ? null : String(row.updated_at)
  };
}

export function toUserNotificationDto(row: Record<string, unknown>, state?: { read_at: string | null } | null): UserNotificationDto {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    type: toNotificationType(row.type),
    published_at: row.published_at == null ? null : String(row.published_at),
    expires_at: row.expires_at == null ? null : String(row.expires_at),
    created_at: row.created_at == null ? null : String(row.created_at),
    is_read: Boolean(state?.read_at)
  };
}
