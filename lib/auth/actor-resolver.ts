import type { UserRole } from "@/lib/auth/get-user-role";
import { toAvatarMediaUrl } from "@/lib/media/urls";

export type MinimalRequestContext = {
  userId: string;
  email: string;
};

export type AppCapability = "student" | "teacher" | "staff_admin";
export type RbacStatus = "loaded" | "empty" | "error";
type RbacScope = "own" | "assigned" | "all" | "own_demo" | "public" | "service_only";

export type ProfileIdentityContext = MinimalRequestContext & {
  role: UserRole | null;
  profileRole: UserRole | null;
  displayName: string;
  avatarUrl: string | null;
};

export type AppActor = ProfileIdentityContext & {
  capabilities: AppCapability[];
  studentId: string | null;
  teacherId: string | null;
  accessibleStudentIds: string[] | null;
  rbacRoles: UserRole[];
  rbacPermissions: string[];
  rbacPermissionScopes: Record<string, string[]>;
  rbacStatus: RbacStatus;
  isStudent: boolean;
  isTeacher: boolean;
  isStaffAdmin: boolean;
};

export type StudentActor = AppActor & {
  isStudent: true;
};

export type TeacherActor = AppActor & {
  isTeacher: true;
};

export type StaffAdminActor = AppActor & {
  isStaffAdmin: true;
};

export type LinkedActorData = {
  studentId: string | null;
  teacherId: string | null;
  accessibleStudentIds: string[] | null;
};

export type RbacActorData = {
  rbacRoles: UserRole[];
  rbacPermissions: string[];
  rbacPermissionScopes: Record<string, string[]>;
  rbacStatus: RbacStatus;
};

export type LinkedActorScopeMode = "layout" | "full";

export type ProfileIdentityRow = {
  role?: string | null;
  email?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
};

export type LinkedActorScopeRpcRow = {
  student_id: string | null;
  teacher_id: string | null;
  accessible_student_ids: string[] | null;
};

export type RbacUserRoleRow = {
  roles?:
    | {
        key?: string | null;
        role_permissions?:
          | Array<{
              scope?: string | null;
              permissions?: {
                key?: string | null;
              } | null;
            }>
          | null;
      }
    | null;
};

export class AuthAccessError extends Error {
  constructor(message = "Authentication or authorization failed") {
    super(message);
    this.name = "AuthAccessError";
  }
}

const USER_ROLE_ORDER: UserRole[] = ["admin", "manager", "teacher", "student"];
const RBAC_SCOPE_ORDER: RbacScope[] = ["own", "assigned", "all", "own_demo", "public", "service_only"];
const STAFF_WORKSPACE_RBAC_PERMISSIONS = [
  "users.view",
  "users.manage",
  "roles.view",
  "roles.manage",
  "teachers.view",
  "teachers.manage",
  "students.view",
  "students.manage",
  "crm.leads.view",
  "crm.leads.manage",
  "content.manage",
  "notifications.manage",
  "word_cards.manage",
  "payments.view",
  "payments.manage",
  "billing.adjust"
] as const;

function buildDisplayName(
  profile: Pick<ProfileIdentityRow, "display_name" | "first_name" | "last_name"> | null,
  email: string
) {
  return (
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    email.split("@")[0] ||
    ""
  );
}

function normalizeRole(value: string | null | undefined): UserRole | null {
  if (value === "student" || value === "teacher" || value === "manager" || value === "admin") {
    return value;
  }

  return null;
}

function normalizeRbacScope(value: string | null | undefined): RbacScope | null {
  if (
    value === "own" ||
    value === "assigned" ||
    value === "all" ||
    value === "own_demo" ||
    value === "public" ||
    value === "service_only"
  ) {
    return value;
  }

  return null;
}

export function createEmptyRbacActorData(rbacStatus: RbacStatus = "empty"): RbacActorData {
  return {
    rbacRoles: [],
    rbacPermissions: [],
    rbacPermissionScopes: {},
    rbacStatus
  };
}

function hasRbacActorMetadata(
  rbac: Pick<AppActor, "rbacRoles" | "rbacPermissions" | "rbacPermissionScopes">
) {
  return Boolean(
    rbac.rbacRoles.length > 0 ||
      rbac.rbacPermissions.length > 0 ||
      Object.keys(rbac.rbacPermissionScopes).length > 0
  );
}

function resolveRbacStatus(
  rbac:
    | RbacActorData
    | (Pick<AppActor, "rbacRoles" | "rbacPermissions" | "rbacPermissionScopes"> & {
        rbacStatus?: RbacStatus | null;
      })
) {
  return rbac.rbacStatus ?? (hasRbacActorMetadata(rbac) ? "loaded" : "empty");
}

function hasLoadedRbacActorData(
  rbac:
    | RbacActorData
    | Pick<AppActor, "rbacRoles" | "rbacPermissions" | "rbacPermissionScopes" | "rbacStatus">
) {
  return resolveRbacStatus(rbac) === "loaded" && hasRbacActorMetadata(rbac);
}

function resolveRbacStaffRole(
  rbac: RbacActorData | Pick<AppActor, "rbacRoles" | "rbacPermissions" | "rbacPermissionScopes">
): "admin" | "manager" | null {
  if (rbac.rbacRoles.includes("admin")) return "admin";
  if (rbac.rbacRoles.includes("manager")) return "manager";
  return null;
}

function hasAllScopedStaffWorkspacePermission(
  rbac: RbacActorData | Pick<AppActor, "rbacRoles" | "rbacPermissions" | "rbacPermissionScopes">
) {
  return STAFF_WORKSPACE_RBAC_PERMISSIONS.some(
    (permission) =>
      rbac.rbacPermissions.includes(permission) &&
      rbac.rbacPermissionScopes[permission]?.includes("all")
  );
}

function hasStaffWorkspaceAccess(rbac: RbacActorData) {
  return (
    hasLoadedRbacActorData(rbac) &&
    Boolean(resolveRbacStaffRole(rbac) || hasAllScopedStaffWorkspacePermission(rbac))
  );
}

export function normalizeProfileIdentityContext(
  context: MinimalRequestContext,
  profile: ProfileIdentityRow | null
): ProfileIdentityContext {
  const profileRole = normalizeRole(profile?.role);
  const email = profile?.email ?? context.email;

  return {
    ...context,
    email,
    role: profileRole,
    profileRole,
    displayName: buildDisplayName(profile, email),
    avatarUrl: toAvatarMediaUrl(context.userId, profile?.avatar_url ?? null)
  };
}

export function isLinkedActorScopeRpcUnavailableMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("does not exist") ||
    normalized.includes("could not find") ||
    normalized.includes("schema cache")
  );
}

export function normalizeLinkedActorScopeRpcData(
  payload: LinkedActorScopeRpcRow | LinkedActorScopeRpcRow[] | null | undefined,
  mode: LinkedActorScopeMode = "full"
): LinkedActorData {
  const row = Array.isArray(payload) ? payload[0] ?? null : payload ?? null;
  const studentId = row && typeof row.student_id === "string" ? row.student_id : null;
  const teacherId = row && typeof row.teacher_id === "string" ? row.teacher_id : null;

  return {
    studentId,
    teacherId,
    accessibleStudentIds:
      teacherId && mode === "full" ? row?.accessible_student_ids ?? [] : null
  };
}

export function normalizeRbacActorData(
  payload: RbacUserRoleRow[] | null | undefined
): RbacActorData {
  const roles = new Set<UserRole>();
  const permissions = new Set<string>();
  const scopesByPermission = new Map<string, Set<RbacScope>>();

  for (const row of payload ?? []) {
    const role = normalizeRole(row.roles?.key);
    if (role) {
      roles.add(role);
    }

    for (const rolePermission of row.roles?.role_permissions ?? []) {
      const permissionKey = rolePermission.permissions?.key;
      const scope = normalizeRbacScope(rolePermission.scope);

      if (!permissionKey || !scope) {
        continue;
      }

      permissions.add(permissionKey);
      const scopes = scopesByPermission.get(permissionKey) ?? new Set<RbacScope>();
      scopes.add(scope);
      scopesByPermission.set(permissionKey, scopes);
    }
  }

  const normalized = {
    rbacRoles: USER_ROLE_ORDER.filter((role) => roles.has(role)),
    rbacPermissions: Array.from(permissions).sort(),
    rbacPermissionScopes: Object.fromEntries(
      Array.from(scopesByPermission.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([permission, scopes]) => [
          permission,
          RBAC_SCOPE_ORDER.filter((scope) => scopes.has(scope))
        ])
    )
  };

  return {
    ...normalized,
    rbacStatus: hasRbacActorMetadata(normalized) ? "loaded" : "empty"
  };
}

export function buildAppActor(
  identity: ProfileIdentityContext,
  linked: LinkedActorData,
  rbac: RbacActorData = createEmptyRbacActorData()
): AppActor {
  const rbacStatus = resolveRbacStatus(rbac);
  const normalizedRbac = {
    ...rbac,
    rbacStatus
  };
  const capabilities = new Set<AppCapability>();

  if (linked.studentId) {
    capabilities.add("student");
  }

  if (linked.teacherId) {
    capabilities.add("teacher");
  }

  if (hasStaffWorkspaceAccess(normalizedRbac)) {
    capabilities.add("staff_admin");
  }

  const capabilityList = Array.from(capabilities);
  const isStudent = capabilities.has("student");
  const isTeacher = capabilities.has("teacher");
  const isStaffAdmin = capabilities.has("staff_admin");

  return {
    ...identity,
    capabilities: capabilityList,
    studentId: linked.studentId,
    teacherId: linked.teacherId,
    accessibleStudentIds: isTeacher ? linked.accessibleStudentIds ?? [] : null,
    rbacRoles: [...normalizedRbac.rbacRoles],
    rbacPermissions: [...normalizedRbac.rbacPermissions],
    rbacPermissionScopes: Object.fromEntries(
      Object.entries(normalizedRbac.rbacPermissionScopes).map(([permission, scopes]) => [
        permission,
        [...scopes]
      ])
    ),
    rbacStatus,
    isStudent,
    isTeacher,
    isStaffAdmin
  };
}

export function isStudentActor(actor: AppActor | null | undefined): actor is StudentActor {
  return Boolean(actor?.isStudent);
}

export function isTeacherActor(actor: AppActor | null | undefined): actor is TeacherActor {
  return Boolean(actor?.isTeacher);
}

export function isStaffAdminActor(actor: AppActor | null | undefined): actor is StaffAdminActor {
  return Boolean(actor?.isStaffAdmin);
}

export function assertStaffAdminCapability(
  actor: AppActor | null | undefined
): asserts actor is StaffAdminActor {
  if (!isStaffAdminActor(actor)) {
    throw new AuthAccessError("Staff admin capability required");
  }
}

export function resolveDefaultWorkspace(
  actor: Pick<
    AppActor,
    | "isStaffAdmin"
    | "isTeacher"
    | "isStudent"
    | "rbacRoles"
    | "rbacPermissions"
    | "rbacPermissionScopes"
    | "rbacStatus"
  >
): UserRole | null {
  if (actor.isStaffAdmin) {
    return resolveRbacStaffRole(actor) ?? "manager";
  }

  if (actor.isTeacher) {
    return "teacher";
  }

  if (actor.isStudent) {
    return "student";
  }

  return null;
}

export type ProfileRequestContext = ProfileIdentityContext;
export type RequestContext = AppActor;
