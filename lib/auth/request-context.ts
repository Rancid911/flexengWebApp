import { cache } from "react";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import type { UserRole } from "@/lib/auth/get-user-role";
import { toAvatarMediaUrl } from "@/lib/media/urls";
import { measureServerTiming } from "@/lib/server/timing";
import { REQUEST_CONTEXT_ACCESS_POLICIES, type AccessMode } from "@/lib/supabase/access";
import { runAuthRequestWithLockRetry } from "@/lib/supabase/auth-request";
import { createClient } from "@/lib/supabase/server";

type RequestProfileRow = {
  role: string | null;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

type MinimalRequestContext = {
  userId: string;
  email: string;
};

export type AppCapability = "student" | "teacher" | "staff_admin";
type RbacScope = "own" | "assigned" | "all" | "own_demo" | "public" | "service_only";

type ProfileIdentityContext = MinimalRequestContext & {
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

export class AuthAccessError extends Error {
  constructor(message = "Authentication or authorization failed") {
    super(message);
    this.name = "AuthAccessError";
  }
}

type LinkedActorData = {
  studentId: string | null;
  teacherId: string | null;
  accessibleStudentIds: string[] | null;
};

type RbacActorData = {
  rbacRoles: UserRole[];
  rbacPermissions: string[];
  rbacPermissionScopes: Record<string, string[]>;
};

type LinkedActorScopeMode = "layout" | "full";

type LinkedActorScopeRpcRow = {
  student_id: string | null;
  teacher_id: string | null;
  accessible_student_ids: string[] | null;
};

type RbacRolePermissionRow = {
  scope?: string | null;
  permissions?: {
    key?: string | null;
  } | null;
};

type RbacUserRoleRow = {
  roles?:
    | {
        key?: string | null;
        role_permissions?: RbacRolePermissionRow[] | null;
      }
    | null;
};

const REQUEST_CONTEXT_MINIMAL_ACCESS_MODE: AccessMode = REQUEST_CONTEXT_ACCESS_POLICIES.minimal.mode;
const REQUEST_CONTEXT_PROFILE_ACCESS_MODE: AccessMode = REQUEST_CONTEXT_ACCESS_POLICIES.profileIdentity.mode;
const REQUEST_CONTEXT_RBAC_ACCESS_MODE: AccessMode = REQUEST_CONTEXT_ACCESS_POLICIES.rbacActor.mode;
const REQUEST_CONTEXT_LINKED_SCOPE_ACCESS_MODE: AccessMode = REQUEST_CONTEXT_ACCESS_POLICIES.linkedActorScope.mode;
const USER_ROLE_ORDER: UserRole[] = ["admin", "manager", "teacher", "student"];
const RBAC_SCOPE_ORDER: RbacScope[] = ["own", "assigned", "all", "own_demo", "public", "service_only"];

function linkedActorScopeCacheTag(userId: string, mode: LinkedActorScopeMode) {
  return `request-context:linked-scope:${mode}:${userId}`;
}

function buildDisplayName(profile: Pick<RequestProfileRow, "display_name" | "first_name" | "last_name"> | null, email: string) {
  return profile?.display_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || email.split("@")[0] || "";
}

function normalizeRole(value: string | null | undefined): UserRole | null {
  if (value === "student" || value === "teacher" || value === "manager" || value === "admin") {
    return value;
  }

  return null;
}

function normalizeRbacScope(value: string | null | undefined): RbacScope | null {
  if (value === "own" || value === "assigned" || value === "all" || value === "own_demo" || value === "public" || value === "service_only") {
    return value;
  }

  return null;
}

function createEmptyRbacActorData(): RbacActorData {
  return {
    rbacRoles: [],
    rbacPermissions: [],
    rbacPermissionScopes: {}
  };
}

export function isLinkedActorScopeRpcUnavailableMessage(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("does not exist") || normalized.includes("could not find") || normalized.includes("schema cache");
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
    accessibleStudentIds: teacherId && mode === "full" ? row?.accessible_student_ids ?? [] : null
  };
}

export function normalizeRbacActorData(payload: RbacUserRoleRow[] | null | undefined): RbacActorData {
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

  return {
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
}

export function buildAppActor(
  identity: ProfileIdentityContext,
  linked: LinkedActorData,
  rbac: RbacActorData = createEmptyRbacActorData()
): AppActor {
  const capabilities = new Set<AppCapability>();

  if (linked.studentId) {
    capabilities.add("student");
  }

  if (linked.teacherId) {
    capabilities.add("teacher");
  }

  if (identity.profileRole === "manager" || identity.profileRole === "admin") {
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
    rbacRoles: [...rbac.rbacRoles],
    rbacPermissions: [...rbac.rbacPermissions],
    rbacPermissionScopes: Object.fromEntries(
      Object.entries(rbac.rbacPermissionScopes).map(([permission, scopes]) => [permission, [...scopes]])
    ),
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

export function assertStaffAdminCapability(actor: AppActor | null | undefined): asserts actor is StaffAdminActor {
  if (!isStaffAdminActor(actor)) {
    throw new AuthAccessError("Staff admin capability required");
  }
}

export function resolveDefaultWorkspace(actor: Pick<AppActor, "isStaffAdmin" | "isTeacher" | "isStudent" | "profileRole">): UserRole | null {
  if (actor.isStaffAdmin) {
    return actor.profileRole === "admin" ? "admin" : "manager";
  }

  if (actor.isTeacher) {
    return "teacher";
  }

  if (actor.isStudent) {
    return "student";
  }

  return actor.profileRole;
}

const getMinimalRequestContextBase = cache(async (): Promise<MinimalRequestContext | null> =>
  measureServerTiming("request-context", async () => {
    void REQUEST_CONTEXT_MINIMAL_ACCESS_MODE;
    const supabase = await measureServerTiming("request-context-client", async () => await createClient());
    const {
      data: { user },
      error
    } = await measureServerTiming("request-context-auth", async () =>
      await measureServerTiming("request-context-auth-user", async () =>
        await runAuthRequestWithLockRetry(() => supabase.auth.getUser())
      )
    );

    if (error || !user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email ?? ""
    };
  })
);

async function loadProfileIdentityContext(context: MinimalRequestContext): Promise<ProfileIdentityContext> {
  void REQUEST_CONTEXT_PROFILE_ACCESS_MODE;
  const supabase = await createClient();
  const profileResponse = await measureServerTiming("request-context-profile", async () =>
    supabase
      .from("profiles")
      .select("role, email, display_name, first_name, last_name, avatar_url")
      .eq("id", context.userId)
      .maybeSingle()
  );

  if (profileResponse.error) {
    throw profileResponse.error;
  }

  const profileRole = normalizeRole(profileResponse.data?.role);
  const email = profileResponse.data?.email ?? context.email;

  return {
    ...context,
    email,
    role: profileRole,
    profileRole,
    displayName: buildDisplayName(profileResponse.data as RequestProfileRow | null, email),
    avatarUrl: toAvatarMediaUrl(context.userId, profileResponse.data?.avatar_url ?? null)
  };
}

async function getCachedProfileIdentityContext(context: MinimalRequestContext): Promise<ProfileIdentityContext> {
  return measureServerTiming("request-context-profile-user-scoped", async () => loadProfileIdentityContext(context));
}

const getProfileIdentityContextBase = cache(async (): Promise<ProfileIdentityContext | null> => {
  const context = await getMinimalRequestContextBase();
  if (!context) {
    return null;
  }

  return getCachedProfileIdentityContext(context);
});

async function getLinkedActorDataWithUserScopedResolver(
  identity: ProfileIdentityContext,
  mode: LinkedActorScopeMode
): Promise<LinkedActorData> {
  return measureServerTiming("request-context-linked-scope-rpc", async () => {
    void REQUEST_CONTEXT_LINKED_SCOPE_ACCESS_MODE;
    const supabase = await createClient();
    const rpcResponse = await supabase.rpc("get_linked_actor_scope", {
      p_profile_id: identity.userId
    });

    if (!rpcResponse.error) {
      return normalizeLinkedActorScopeRpcData(rpcResponse.data as LinkedActorScopeRpcRow | LinkedActorScopeRpcRow[] | null | undefined, mode);
    }

    if (isLinkedActorScopeRpcUnavailableMessage(rpcResponse.error.message)) {
      console.warn("REQUEST_CONTEXT_SCOPE_RPC_UNAVAILABLE", {
        code: "REQUEST_CONTEXT_SCOPE_RPC_UNAVAILABLE",
        message: rpcResponse.error.message
      });
      return {
        studentId: null,
        teacherId: null,
        accessibleStudentIds: null
      };
    }

    console.warn("REQUEST_CONTEXT_SCOPE_RPC_FAILED", {
      code: "REQUEST_CONTEXT_SCOPE_RPC_FAILED",
      message: rpcResponse.error.message
    });
    throw rpcResponse.error;
  });
}

async function getCachedLinkedActorData(identity: ProfileIdentityContext, mode: LinkedActorScopeMode): Promise<LinkedActorData> {
  return measureServerTiming(
    mode === "full" ? "request-context-linked-scope-full" : "request-context-linked-scope-layout",
    async () => getLinkedActorDataWithUserScopedResolver(identity, mode)
  );
}

async function loadRbacActorData(identity: ProfileIdentityContext): Promise<RbacActorData> {
  try {
    void REQUEST_CONTEXT_RBAC_ACCESS_MODE;
    const supabase = await createClient();
    const response = await measureServerTiming("request-context-rbac", async () =>
      supabase
        .from("user_roles")
        .select("roles(key, role_permissions(scope, permissions(key)))")
        .eq("user_id", identity.userId)
    );

    if (response.error) {
      console.warn("REQUEST_CONTEXT_RBAC_LOAD_FAILED", {
        code: "REQUEST_CONTEXT_RBAC_LOAD_FAILED",
        message: response.error.message
      });
      return createEmptyRbacActorData();
    }

    return normalizeRbacActorData(response.data as RbacUserRoleRow[] | null | undefined);
  } catch (error) {
    console.warn("REQUEST_CONTEXT_RBAC_LOAD_FAILED", {
      code: "REQUEST_CONTEXT_RBAC_LOAD_FAILED",
      message: error instanceof Error ? error.message : "Unknown RBAC load failure"
    });
    return createEmptyRbacActorData();
  }
}

async function getCachedRbacActorData(identity: ProfileIdentityContext): Promise<RbacActorData> {
  return measureServerTiming("request-context-rbac-user-scoped", async () => loadRbacActorData(identity));
}

type RequestContextBootstrap = {
  identity: ProfileIdentityContext;
  linked: LinkedActorData;
  rbac: RbacActorData;
};

const getRequestContextBootstrapBase = cache(async (mode: LinkedActorScopeMode): Promise<RequestContextBootstrap | null> => {
  const context = await getMinimalRequestContextBase();
  if (!context) {
    return null;
  }

  const identity = await getCachedProfileIdentityContext(context);
  const [linked, rbac] = await Promise.all([
    getCachedLinkedActorData(identity, mode),
    getCachedRbacActorData(identity)
  ]);

  return {
    identity,
    linked,
    rbac
  };
});

const getAppActorBase = cache(async (mode: LinkedActorScopeMode): Promise<AppActor | null> => {
  const bootstrap = await getRequestContextBootstrapBase(mode);
  if (!bootstrap) {
    return null;
  }

  return buildAppActor(bootstrap.identity, bootstrap.linked, bootstrap.rbac);
});

export const getAuthActor = cache(async (): Promise<MinimalRequestContext | null> => await getMinimalRequestContextBase());
export const getMinimalRequestContext = cache(async (): Promise<MinimalRequestContext | null> => await getMinimalRequestContextBase());
export const getProfileIdentityContext = cache(async (): Promise<ProfileIdentityContext | null> => await getProfileIdentityContextBase());
export const getProfileRequestContext = cache(async (): Promise<ProfileIdentityContext | null> => await getProfileIdentityContextBase());
export const getLayoutActor = cache(async (): Promise<AppActor | null> => await getAppActorBase("layout"));
export const getAppActor = cache(async (): Promise<AppActor | null> => await getAppActorBase("full"));
export const getRequestContext = cache(async (): Promise<AppActor | null> => await getAppActorBase("full"));
export const getStudentRequestContext = cache(async (): Promise<AppActor | null> => {
  const actor = await getAppActorBase("full");
  if (!actor || !actor.isStudent) {
    return null;
  }

  return actor;
});
export const getStaffRequestContext = cache(async (): Promise<AppActor | null> => {
  const actor = await getAppActorBase("full");
  if (!actor || (!actor.isTeacher && !actor.isStaffAdmin)) {
    return null;
  }

  return actor;
});

export async function requireAuthActor() {
  const actor = await getAuthActor();
  if (!actor) {
    redirect("/login");
  }

  return actor;
}

export async function requireMinimalRequestContext() {
  const context = await getMinimalRequestContext();
  if (!context) {
    redirect("/login");
  }

  return context;
}

export async function requireProfileIdentityContext() {
  const context = await getProfileIdentityContext();
  if (!context) {
    redirect("/login");
  }

  return context;
}

export async function requireProfileRequestContext() {
  return requireProfileIdentityContext();
}

export async function requireAppActor() {
  const actor = await getAppActor();
  if (!actor) {
    redirect("/login");
  }

  return actor;
}

export async function requireAppApiActor() {
  return await getAppActor();
}

export async function requireLayoutActor() {
  const actor = await getLayoutActor();
  if (!actor) {
    redirect("/login");
  }

  return actor;
}

export async function requireRequestContext() {
  const context = await getRequestContext();
  if (!context) {
    redirect("/login");
  }

  return context;
}

export async function invalidateProfileIdentityCache(userId: string) {
  void userId;
}

export async function invalidateLinkedActorScopeCache(userId: string, mode?: LinkedActorScopeMode) {
  if (mode) {
    revalidateTag(linkedActorScopeCacheTag(userId, mode), "max");
    return;
  }

  revalidateTag(linkedActorScopeCacheTag(userId, "layout"), "max");
  revalidateTag(linkedActorScopeCacheTag(userId, "full"), "max");
}

export async function invalidateRbacActorCache(userId: string) {
  void userId;
}

export async function invalidateFullAppActorCache(userId: string) {
  await invalidateLinkedActorScopeCache(userId);
}

export type { MinimalRequestContext, ProfileIdentityContext as ProfileRequestContext, AppActor as RequestContext };
