import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type RpcResult = {
  data: unknown;
  error: { message: string } | null;
};

type RbacRow = {
  roles: {
    key: string;
    role_permissions: Array<{
      scope: string;
      permissions: {
        key: string;
      };
    }>;
  };
};

const cacheStore = new Map<string, unknown>();
const cacheTagIndex = new Map<string, Set<string>>();

vi.mock("next/cache", () => ({
  unstable_cache: (cb: (...args: unknown[]) => Promise<unknown>, keyParts?: string[], options?: { tags?: string[] }) => {
    return async (...args: unknown[]) => {
      const cacheKey = JSON.stringify([keyParts ?? [], args]);
      if (cacheStore.has(cacheKey)) {
        return cacheStore.get(cacheKey);
      }

      const value = await cb(...args);
      cacheStore.set(cacheKey, value);

      for (const tag of options?.tags ?? []) {
        const keys = cacheTagIndex.get(tag) ?? new Set<string>();
        keys.add(cacheKey);
        cacheTagIndex.set(tag, keys);
      }

      return value;
    };
  },
  revalidateTag: (tag: string) => {
    const keys = cacheTagIndex.get(tag);
    if (!keys) return;
    for (const key of keys) {
      cacheStore.delete(key);
    }
    cacheTagIndex.delete(tag);
  }
}));

function makeRequestClient(options: {
  role: string | null;
  rpcResult: RpcResult;
  rbacRows?: RbacRow[];
  rbacError?: { message: string } | null;
}) {
  let profileReads = 0;
  let rbacReads = 0;
  let rpcCalls = 0;
  return {
    stats: {
      get profileReads() {
        return profileReads;
      },
      get rbacReads() {
        return rbacReads;
      },
      get rpcCalls() {
        return rpcCalls;
      }
    },
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: "user-1",
            email: "teacher@example.com"
          }
        },
        error: null
      })
    },
    rpc: async (fn: string) => {
      if (fn !== "get_linked_actor_scope") {
        throw new Error(`Unexpected RPC: ${fn}`);
      }

      rpcCalls += 1;
      return options.rpcResult;
    },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => {
                profileReads += 1;
                return {
                  data: {
                    role: options.role,
                    email: "teacher@example.com",
                    display_name: "Teacher Profile",
                    first_name: "Teacher",
                    last_name: "Profile",
                    avatar_url: null
                  },
                  error: null
                };
              }
            })
          })
        };
      }

      if (table === "user_roles") {
        return {
          select: () => ({
            eq: async () => {
              rbacReads += 1;
              return {
                data: options.rbacRows ?? [],
                error: options.rbacError ?? null
              };
            }
          })
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }
  };
}

async function loadRequestContextModule(deps: {
  profileRole: string | null;
  rpcResult: RpcResult;
  rbacRows?: RbacRow[];
  rbacError?: { message: string } | null;
}) {
  const requestClient = makeRequestClient({
    role: deps.profileRole,
    rpcResult: deps.rpcResult,
    rbacRows: deps.rbacRows,
    rbacError: deps.rbacError
  });

  vi.doMock("@/lib/supabase/server", () => ({
    createClient: async () => requestClient
  }));

  vi.doMock("@/lib/supabase/admin", () => ({
    createAdminClient: () => {
      throw new Error("Admin client should not be used by request context");
    }
  }));

  return {
    module: await import("@/lib/auth/request-context"),
    requestClient
  };
}

describe("request-context rpc linked scope", () => {
  beforeEach(() => {
    vi.resetModules();
    cacheStore.clear();
    cacheTagIndex.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("prefers RPC linked scope when function is available", async () => {
    const { module: requestContext } = await loadRequestContextModule({
      profileRole: "teacher",
      rpcResult: {
        data: [
          {
            student_id: "student-1",
            teacher_id: "teacher-1",
            accessible_student_ids: ["student-1", "student-2"]
          }
        ],
        error: null
      }
    });

    const actor = await requestContext.getAppActor();

    expect(actor).toMatchObject({
      studentId: "student-1",
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1", "student-2"],
      isStudent: true,
      isTeacher: true,
      rbacRoles: [],
      rbacPermissions: [],
      rbacPermissionScopes: {}
    });
  });

  it("adds RBAC metadata when role permission rows are available", async () => {
    const { module: requestContext } = await loadRequestContextModule({
      profileRole: "teacher",
      rpcResult: {
        data: [
          {
            student_id: null,
            teacher_id: "teacher-1",
            accessible_student_ids: ["student-1"]
          }
        ],
        error: null
      },
      rbacRows: [
        {
          roles: {
            key: "teacher",
            role_permissions: [
              { scope: "assigned", permissions: { key: "students.view" } },
              { scope: "assigned", permissions: { key: "schedule.view" } },
              { scope: "own_demo", permissions: { key: "learning.preview_as_student" } }
            ]
          }
        }
      ]
    });

    const actor = await requestContext.getAppActor();

    expect(actor).toMatchObject({
      isTeacher: true,
      rbacRoles: ["teacher"],
      rbacPermissions: ["learning.preview_as_student", "schedule.view", "students.view"],
      rbacPermissionScopes: {
        "learning.preview_as_student": ["own_demo"],
        "schedule.view": ["assigned"],
        "students.view": ["assigned"]
      }
    });
  });

  it("keeps legacy actor behavior when RBAC load fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { module: requestContext } = await loadRequestContextModule({
      profileRole: "teacher",
      rpcResult: {
        data: [
          {
            student_id: "student-1",
            teacher_id: "teacher-1",
            accessible_student_ids: ["student-1"]
          }
        ],
        error: null
      },
      rbacError: {
        message: "relation public.user_roles does not exist"
      }
    });

    const actor = await requestContext.getAppActor();

    expect(actor).toMatchObject({
      studentId: "student-1",
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      isStudent: true,
      isTeacher: true,
      rbacRoles: [],
      rbacPermissions: [],
      rbacPermissionScopes: {}
    });
    expect(warnSpy).toHaveBeenCalledWith(
      "REQUEST_CONTEXT_RBAC_LOAD_FAILED",
      expect.objectContaining({
        code: "REQUEST_CONTEXT_RBAC_LOAD_FAILED"
      })
    );
  });

  it("degrades conservatively when linked scope RPC is unavailable", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { module: requestContext } = await loadRequestContextModule({
      profileRole: "teacher",
      rpcResult: {
        data: null,
        error: {
          message: "Could not find the function public.get_linked_actor_scope in the schema cache"
        }
      }
    });

    const actor = await requestContext.getAppActor();

    expect(actor).toMatchObject({
      studentId: null,
      teacherId: null,
      accessibleStudentIds: null,
      isStudent: false,
      isTeacher: false
    });
    expect(warnSpy).toHaveBeenCalledWith(
      "REQUEST_CONTEXT_SCOPE_RPC_UNAVAILABLE",
      expect.objectContaining({
        code: "REQUEST_CONTEXT_SCOPE_RPC_UNAVAILABLE"
      })
    );
  });

  it("uses user-scoped profile, RBAC and linked scope reads without cross-request cache", async () => {
    const { module: requestContext, requestClient } = await loadRequestContextModule({
      profileRole: "teacher",
      rpcResult: {
        data: [
          {
            student_id: "student-1",
            teacher_id: "teacher-1",
            accessible_student_ids: ["student-1", "student-2"]
          }
        ],
        error: null
      }
    });

    await requestContext.getAppActor();
    await requestContext.getAppActor();

    expect(requestClient.stats.profileReads).toBe(2);
    expect(requestClient.stats.rbacReads).toBe(2);
    expect(requestClient.stats.rpcCalls).toBe(2);
  });

  it("keeps linked scope invalidation callable", async () => {
    const { module: requestContext, requestClient } = await loadRequestContextModule({
      profileRole: "teacher",
      rpcResult: {
        data: [
          {
            student_id: "student-1",
            teacher_id: "teacher-1",
            accessible_student_ids: ["student-1", "student-2"]
          }
        ],
        error: null
      }
    });

    await requestContext.getAppActor();
    await requestContext.invalidateFullAppActorCache("user-1");
    await requestContext.getAppActor();

    expect(requestClient.stats.profileReads).toBe(2);
    expect(requestClient.stats.rbacReads).toBe(2);
    expect(requestClient.stats.rpcCalls).toBe(2);
  });
});
