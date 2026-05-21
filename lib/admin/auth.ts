import { redirect } from "next/navigation";

import {
  getProfileIdentityContext,
  requireAppActor,
  requireProfileIdentityContext
} from "@/lib/auth/request-context";
import { can, type Permission, type PermissionResource } from "@/lib/permissions";
import type { UserRole } from "@/lib/auth/get-user-role";
import { AdminHttpError } from "@/lib/admin/http";
import type { AdminActor } from "@/lib/admin/types";

export function assertStaffAdminCapability(actor: { userId: string } & Partial<{ isStaffAdmin: boolean }>) {
  if (!actor.isStaffAdmin) {
    throw new AdminHttpError(403, "FORBIDDEN", "Admin access required");
  }
}

function resolveStaffAdminRole(profileRole: UserRole | null | undefined): AdminActor["role"] | null {
  if (profileRole === "admin") return "admin";
  if (profileRole === "manager") return "manager";
  return null;
}

export async function requireStaffAdminPage(): Promise<AdminActor> {
  const actor = await requireProfileIdentityContext();
  const role = resolveStaffAdminRole(actor.profileRole);
  if (!role) {
    redirect("/");
  }

  return {
    userId: actor.userId,
    role
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

export async function requireStaffAdminApi(): Promise<AdminActor> {
  const actor = await getProfileIdentityContext();
  const role = resolveStaffAdminRole(actor?.profileRole);
  if (!actor || !role) {
    throw new AdminHttpError(403, "FORBIDDEN", "Admin access required");
  }

  return {
    userId: actor.userId,
    role
  };
}
