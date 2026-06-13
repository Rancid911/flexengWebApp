import { REQUEST_CONTEXT_ACCESS_POLICIES, type AccessMode } from "@/lib/supabase/access";
import { runAuthRequestWithLockRetry } from "@/lib/supabase/auth-request";
import { createClient } from "@/lib/supabase/server";

export type ActorRepositoryClient = Awaited<ReturnType<typeof createClient>>;

export type ActorProfileRow = {
  role: string | null;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export type LinkedActorScopeRpcRow = {
  student_id: string | null;
  teacher_id: string | null;
  accessible_student_ids: string[] | null;
};

export type LinkedActorScopeRpcPayload =
  | LinkedActorScopeRpcRow
  | LinkedActorScopeRpcRow[]
  | null
  | undefined;

export type RbacRolePermissionRow = {
  scope?: string | null;
  permissions?: {
    key?: string | null;
  } | null;
};

export type RbacUserRoleRow = {
  roles?:
    | {
        key?: string | null;
        role_permissions?: RbacRolePermissionRow[] | null;
      }
    | null;
};

const REQUEST_CONTEXT_MINIMAL_ACCESS_MODE: AccessMode =
  REQUEST_CONTEXT_ACCESS_POLICIES.minimal.mode;
const REQUEST_CONTEXT_PROFILE_ACCESS_MODE: AccessMode =
  REQUEST_CONTEXT_ACCESS_POLICIES.profileIdentity.mode;
const REQUEST_CONTEXT_RBAC_ACCESS_MODE: AccessMode =
  REQUEST_CONTEXT_ACCESS_POLICIES.rbacActor.mode;
const REQUEST_CONTEXT_LINKED_SCOPE_ACCESS_MODE: AccessMode =
  REQUEST_CONTEXT_ACCESS_POLICIES.linkedActorScope.mode;

export function createActorRepository(client: ActorRepositoryClient) {
  return {
    getAuthenticatedUser() {
      void REQUEST_CONTEXT_MINIMAL_ACCESS_MODE;
      return runAuthRequestWithLockRetry(() => client.auth.getUser());
    },

    loadProfileIdentity(userId: string) {
      void REQUEST_CONTEXT_PROFILE_ACCESS_MODE;
      return client
        .from("profiles")
        .select("role, email, display_name, first_name, last_name, avatar_url")
        .eq("id", userId)
        .maybeSingle();
    },

    loadLinkedActorScope(profileId: string) {
      void REQUEST_CONTEXT_LINKED_SCOPE_ACCESS_MODE;
      return client.rpc("get_linked_actor_scope", {
        p_profile_id: profileId
      });
    },

    loadRbacActorRows(userId: string) {
      void REQUEST_CONTEXT_RBAC_ACCESS_MODE;
      return client
        .from("user_roles")
        .select("roles(key, role_permissions(scope, permissions(key)))")
        .eq("user_id", userId);
    }
  };
}

export async function createUserScopedActorRepository() {
  return createActorRepository(await createClient());
}

export type ActorRepository = ReturnType<typeof createActorRepository>;
