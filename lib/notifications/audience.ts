import type { AppActor } from "@/lib/auth/request-context";

export const NOTIFICATION_RBAC_TARGET_ROLES = ["student", "teacher", "manager", "admin"] as const;
export const NOTIFICATION_TARGET_AUDIENCES = ["all", ...NOTIFICATION_RBAC_TARGET_ROLES] as const;

export type NotificationRbacTargetRole = (typeof NOTIFICATION_RBAC_TARGET_ROLES)[number];
export type NotificationTargetAudience = (typeof NOTIFICATION_TARGET_AUDIENCES)[number];

function isNotificationTargetAudience(value: string): value is NotificationTargetAudience {
  return (NOTIFICATION_TARGET_AUDIENCES as readonly string[]).includes(value);
}

export function normalizeNotificationTargetRoles(value: unknown): NotificationTargetAudience[] {
  if (!Array.isArray(value)) return [];
  const roles = value.filter((item): item is NotificationTargetAudience => typeof item === "string" && isNotificationTargetAudience(item));
  if (roles.includes("all")) return ["all"];
  return Array.from(new Set(roles));
}

function normalizeTargetUserIds(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function hasLoadedRbacRoles(actor: Pick<AppActor, "rbacStatus" | "rbacRoles">) {
  return actor.rbacStatus === "loaded" && Array.isArray(actor.rbacRoles) && actor.rbacRoles.length > 0;
}

export function isNotificationVisibleForActor(row: Record<string, unknown>, actor: Pick<AppActor, "userId" | "rbacStatus" | "rbacRoles">) {
  const targetUserIds = normalizeTargetUserIds(row.target_user_ids);
  if (targetUserIds.includes(actor.userId)) return true;

  const targetRoles = normalizeNotificationTargetRoles(row.target_roles);
  if (targetRoles.includes("all")) return true;
  if (targetRoles.length === 0) return false;
  if (!hasLoadedRbacRoles(actor)) return false;

  const actorRoles = new Set(actor.rbacRoles);
  return targetRoles.some((role) => role !== "all" && actorRoles.has(role));
}
