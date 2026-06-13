export type RbacPermissionActor = {
  rbacRoles?: string[] | null;
  rbacPermissions?: string[] | null;
  rbacPermissionScopes?: Record<string, string[]> | null;
  rbacStatus?: "loaded" | "empty" | "error" | null;
};

export type RbacPermissionRule = {
  permission: string;
  scopes?: string[];
};

function hasLoadedRbacMetadata(actor: RbacPermissionActor | null | undefined) {
  if (!actor) return false;
  const hasMetadata = Boolean(
    (Array.isArray(actor.rbacRoles) && actor.rbacRoles.length > 0) ||
      (Array.isArray(actor.rbacPermissions) && actor.rbacPermissions.length > 0) ||
      (actor.rbacPermissionScopes && Object.keys(actor.rbacPermissionScopes).length > 0)
  );
  return (actor.rbacStatus ?? (hasMetadata ? "loaded" : "empty")) === "loaded" && hasMetadata;
}

export function canUseRbacPermission(
  actor: RbacPermissionActor | null | undefined,
  permission: string,
  allowedScopes: string[] = []
) {
  if (!hasLoadedRbacMetadata(actor)) {
    return false;
  }

  if (!actor?.rbacPermissions?.includes(permission)) {
    return false;
  }

  if (allowedScopes.length === 0) {
    return true;
  }

  const grantedScopes = actor.rbacPermissionScopes?.[permission] ?? [];
  return grantedScopes.some((scope) => allowedScopes.includes(scope));
}

export function canUseAnyRbacPermission(actor: RbacPermissionActor | null | undefined, rules: RbacPermissionRule[]) {
  return rules.some((rule) => canUseRbacPermission(actor, rule.permission, rule.scopes ?? []));
}
