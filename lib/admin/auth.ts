import { redirect } from "next/navigation";

import {
  getAppActor,
  requireAppActor
} from "@/lib/auth/request-context";
import { can, type Permission, type PermissionResource } from "@/lib/permissions";
import { AdminHttpError } from "@/lib/admin/http";
import type { AdminActor } from "@/lib/admin/types";
import type { AppActor } from "@/lib/auth/request-context";

type AdminApiActor = AppActor & AdminActor;

export function assertStaffAdminCapability(actor: { userId: string } & Partial<{ isStaffAdmin: boolean }>) {
  if (!actor.isStaffAdmin) {
    throw new AdminHttpError(403, "FORBIDDEN", "Admin access required");
  }
}

/**
 * @deprecated Compatibility helper for unmigrated callers/tests only.
 * Production pages must use requireAdminPagePermission() or requireAdminPageAnyPermission().
 */
export async function requireStaffAdminPage(): Promise<AdminActor> {
  const actor = await requireAppActor();
  if (!can(actor, "roles.view")) {
    redirect("/");
  }

  return {
    userId: actor.userId,
    role: resolveAdminApiRole(actor)
  };
}

export async function requireAdminPagePermission(permission: Permission, resource?: PermissionResource) {
  const actor = await requireAppActor();
  if (!can(actor, permission, resource)) {
    redirect("/");
  }

  return actor;
}

export async function requireAdminPageAnyPermission(permissions: Permission[], resource?: PermissionResource) {
  const actor = await requireAppActor();
  if (!permissions.some((permission) => can(actor, permission, resource))) {
    redirect("/");
  }

  return actor;
}

function resolveAdminApiRole(actor: AppActor): AdminActor["role"] {
  if (actor.rbacRoles.includes("admin")) return "admin";
  return "manager";
}

export async function requireAdminApiPermission(permission: Permission, resource?: PermissionResource): Promise<AdminApiActor> {
  const actor = await getAppActor();
  if (!actor || !can(actor, permission, resource)) {
    throw new AdminHttpError(403, "FORBIDDEN", "Permission denied");
  }

  return {
    ...actor,
    role: resolveAdminApiRole(actor)
  };
}

export async function requireAdminApiAnyPermission(permissions: Permission[], resource?: PermissionResource): Promise<AdminApiActor> {
  const actor = await getAppActor();
  if (!actor || !permissions.some((permission) => can(actor, permission, resource))) {
    throw new AdminHttpError(403, "FORBIDDEN", "Permission denied");
  }

  return {
    ...actor,
    role: resolveAdminApiRole(actor)
  };
}

/**
 * @deprecated Compatibility helper for unmigrated callers/tests only.
 * Production API routes must use requireAdminApiPermission() or requireAdminApiAnyPermission().
 */
export async function requireStaffAdminApi(): Promise<AdminActor> {
  const actor = await getAppActor();
  if (!actor || !can(actor, "roles.view")) {
    throw new AdminHttpError(403, "FORBIDDEN", "Admin access required");
  }

  return {
    userId: actor.userId,
    role: resolveAdminApiRole(actor)
  };
}
