import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { cache } from "react";

import {
  createUserScopedActorRepository,
  type ActorProfileRow,
  type LinkedActorScopeRpcPayload,
  type RbacUserRoleRow
} from "@/lib/auth/actor.repository";
import {
  buildAppActor,
  createEmptyRbacActorData,
  isLinkedActorScopeRpcUnavailableMessage,
  normalizeLinkedActorScopeRpcData,
  normalizeProfileIdentityContext,
  normalizeRbacActorData,
  type AppActor,
  type LinkedActorData,
  type LinkedActorScopeMode,
  type MinimalRequestContext,
  type ProfileIdentityContext,
  type RbacActorData
} from "@/lib/auth/actor-resolver";
import { measureServerTiming } from "@/lib/server/timing";

function linkedActorScopeCacheTag(userId: string, mode: LinkedActorScopeMode) {
  return `request-context:linked-scope:${mode}:${userId}`;
}

const getMinimalRequestContextBase = cache(async (): Promise<MinimalRequestContext | null> =>
  measureServerTiming("request-context", async () => {
    const repository = await measureServerTiming(
      "request-context-client",
      async () => await createUserScopedActorRepository()
    );
    const {
      data: { user },
      error
    } = await measureServerTiming("request-context-auth", async () =>
      await measureServerTiming(
        "request-context-auth-user",
        async () => await repository.getAuthenticatedUser()
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

async function loadProfileIdentityContext(
  context: MinimalRequestContext
): Promise<ProfileIdentityContext> {
  const repository = await createUserScopedActorRepository();
  const profileResponse = await measureServerTiming(
    "request-context-profile",
    async () => await repository.loadProfileIdentity(context.userId)
  );

  if (profileResponse.error) {
    throw profileResponse.error;
  }

  return normalizeProfileIdentityContext(
    context,
    profileResponse.data as ActorProfileRow | null
  );
}

const getCachedProfileIdentityContext = cache(
  async (context: MinimalRequestContext): Promise<ProfileIdentityContext> => {
    return measureServerTiming(
      "request-context-profile-user-scoped",
      async () => await loadProfileIdentityContext(context)
    );
  }
);

const getProfileIdentityContextBase = cache(
  async (): Promise<ProfileIdentityContext | null> => {
    const context = await getMinimalRequestContextBase();
    if (!context) {
      return null;
    }

    return getCachedProfileIdentityContext(context);
  }
);

async function loadLinkedActorScopeRpcPayload(
  identity: ProfileIdentityContext
): Promise<LinkedActorScopeRpcPayload> {
  return measureServerTiming("request-context-linked-scope-rpc", async () => {
    const repository = await createUserScopedActorRepository();
    const rpcResponse = await repository.loadLinkedActorScope(identity.userId);

    if (!rpcResponse.error) {
      return rpcResponse.data as LinkedActorScopeRpcPayload;
    }

    if (isLinkedActorScopeRpcUnavailableMessage(rpcResponse.error.message)) {
      console.warn("REQUEST_CONTEXT_SCOPE_RPC_UNAVAILABLE", {
        code: "REQUEST_CONTEXT_SCOPE_RPC_UNAVAILABLE",
        message: rpcResponse.error.message
      });
      return null;
    }

    console.warn("REQUEST_CONTEXT_SCOPE_RPC_FAILED", {
      code: "REQUEST_CONTEXT_SCOPE_RPC_FAILED",
      message: rpcResponse.error.message
    });
    throw rpcResponse.error;
  });
}

const getCachedLinkedActorScopeRpcPayload = cache(
  async (identity: ProfileIdentityContext): Promise<LinkedActorScopeRpcPayload> =>
    loadLinkedActorScopeRpcPayload(identity)
);

async function getCachedLinkedActorData(
  identity: ProfileIdentityContext,
  mode: LinkedActorScopeMode
): Promise<LinkedActorData> {
  return measureServerTiming(
    mode === "full"
      ? "request-context-linked-scope-full"
      : "request-context-linked-scope-layout",
    async () =>
      normalizeLinkedActorScopeRpcData(
        await getCachedLinkedActorScopeRpcPayload(identity),
        mode
      )
  );
}

async function loadRbacActorData(
  identity: ProfileIdentityContext
): Promise<RbacActorData> {
  try {
    const repository = await createUserScopedActorRepository();
    const response = await measureServerTiming(
      "request-context-rbac",
      async () => await repository.loadRbacActorRows(identity.userId)
    );

    if (response.error) {
      console.warn("REQUEST_CONTEXT_RBAC_LOAD_FAILED", {
        code: "REQUEST_CONTEXT_RBAC_LOAD_FAILED",
        message: response.error.message
      });
      return createEmptyRbacActorData("error");
    }

    return normalizeRbacActorData(
      response.data as RbacUserRoleRow[] | null | undefined
    );
  } catch (error) {
    console.warn("REQUEST_CONTEXT_RBAC_LOAD_FAILED", {
      code: "REQUEST_CONTEXT_RBAC_LOAD_FAILED",
      message: error instanceof Error ? error.message : "Unknown RBAC load failure"
    });
    return createEmptyRbacActorData("error");
  }
}

const getCachedRbacActorData = cache(
  async (identity: ProfileIdentityContext): Promise<RbacActorData> => {
    return measureServerTiming(
      "request-context-rbac-user-scoped",
      async () => await loadRbacActorData(identity)
    );
  }
);

type RequestContextBootstrap = {
  identity: ProfileIdentityContext;
  linked: LinkedActorData;
  rbac: RbacActorData;
};

const getRequestContextBootstrapBase = cache(
  async (mode: LinkedActorScopeMode): Promise<RequestContextBootstrap | null> => {
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
  }
);

const getAppActorBase = cache(
  async (mode: LinkedActorScopeMode): Promise<AppActor | null> => {
    const bootstrap = await getRequestContextBootstrapBase(mode);
    if (!bootstrap) {
      return null;
    }

    return buildAppActor(bootstrap.identity, bootstrap.linked, bootstrap.rbac);
  }
);

export const getAuthActor = cache(
  async (): Promise<MinimalRequestContext | null> =>
    await getMinimalRequestContextBase()
);
export const getMinimalRequestContext = cache(
  async (): Promise<MinimalRequestContext | null> =>
    await getMinimalRequestContextBase()
);
export const getProfileIdentityContext = cache(
  async (): Promise<ProfileIdentityContext | null> =>
    await getProfileIdentityContextBase()
);
export const getProfileRequestContext = cache(
  async (): Promise<ProfileIdentityContext | null> =>
    await getProfileIdentityContextBase()
);
export const getLayoutActor = cache(
  async (): Promise<AppActor | null> => await getAppActorBase("layout")
);
export const getAppActor = cache(
  async (): Promise<AppActor | null> => await getAppActorBase("full")
);
export const getRequestContext = cache(
  async (): Promise<AppActor | null> => await getAppActorBase("full")
);
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

export async function invalidateLinkedActorScopeCache(
  userId: string,
  mode?: LinkedActorScopeMode
) {
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
