import { getAppActor, resolveDefaultWorkspace } from "@/lib/auth/request-context";
import type { AccessMode } from "@/lib/supabase/access";
import type { SearchContext } from "@/lib/search/types";

export const SEARCH_CONTEXT_ACCESS_MODE: AccessMode = "user_scoped";

export async function getSearchContext(): Promise<SearchContext> {
  void SEARCH_CONTEXT_ACCESS_MODE;
  const actor = await getAppActor();
  if (!actor) {
    return {
      userId: null,
      role: null,
      capabilities: [],
      rbacRoles: null,
      rbacPermissions: null,
      rbacPermissionScopes: null,
      studentId: null,
      teacherId: null,
      accessibleStudentIds: null,
      isAuthenticated: false
    };
  }

  return {
    userId: actor.userId,
    role: resolveDefaultWorkspace(actor),
    capabilities: actor.capabilities,
    rbacRoles: actor.rbacRoles,
    rbacPermissions: actor.rbacPermissions,
    rbacPermissionScopes: actor.rbacPermissionScopes,
    studentId: actor.studentId,
    teacherId: actor.teacherId,
    accessibleStudentIds: actor.accessibleStudentIds,
    isAuthenticated: true
  };
}
