import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type RpcResult = {
  data: unknown;
  error: { message: string } | null;
};

type QueryResponse = {
  data: unknown;
  error: { message: string } | null;
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

function makeProfileClient(role: string | null) {
  let profileReads = 0;
  return {
    stats: {
      get profileReads() {
        return profileReads;
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
    from: (table: string) => {
      if (table !== "profiles") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => {
              profileReads += 1;
              return {
                data: {
                  role,
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
  };
}

function makeFallbackAdminClient(options: {
  rpcResult: RpcResult;
  profileRole?: string | null;
  studentId?: string | null;
  teacherId?: string | null;
  accessibleStudentIds?: string[];
}) {
  let rpcCalls = 0;
  let profileReads = 0;
  return {
    stats: {
      get profileReads() {
        return profileReads;
      },
      get rpcCalls() {
        return rpcCalls;
      }
    },
    rpc: async () => {
      rpcCalls += 1;
      return options.rpcResult;
    },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async (): Promise<QueryResponse> => {
                profileReads += 1;
                return {
                  data: {
                    role: options.profileRole ?? null,
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

      if (table === "students") {
        return {
          select: () => ({
            eq: (column: string) => {
              if (column === "profile_id") {
                return {
                  maybeSingle: async (): Promise<QueryResponse> => ({
                    data: options.studentId ? { id: options.studentId } : null,
                    error: null
                  })
                };
              }

              if (column === "primary_teacher_id") {
                return Promise.resolve({
                  data: (options.accessibleStudentIds ?? []).map((studentId) => ({ id: studentId })),
                  error: null
                } satisfies QueryResponse);
              }

              throw new Error(`Unexpected students.eq column: ${column}`);
            }
          })
        };
      }

      if (table === "teachers") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async (): Promise<QueryResponse> => ({
                data: options.teacherId ? { id: options.teacherId } : null,
                error: null
              })
            })
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
  studentId?: string | null;
  teacherId?: string | null;
  accessibleStudentIds?: string[];
}) {
  const profileClient = makeProfileClient(deps.profileRole);
  const adminClient = makeFallbackAdminClient({
    rpcResult: deps.rpcResult,
    profileRole: deps.profileRole,
    studentId: deps.studentId,
    teacherId: deps.teacherId,
    accessibleStudentIds: deps.accessibleStudentIds
  });

  vi.doMock("@/lib/supabase/server", () => ({
    createClient: async () => profileClient
  }));

  vi.doMock("@/lib/supabase/admin", () => ({
    createAdminClient: () => adminClient
  }));

  return {
    module: await import("@/lib/auth/request-context"),
    profileClient,
    adminClient
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
      isTeacher: true
    });
  });

  it("falls back to chained resolver when linked scope RPC is unavailable", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { module: requestContext } = await loadRequestContextModule({
      profileRole: "teacher",
      rpcResult: {
        data: null,
        error: {
          message: "Could not find the function public.get_linked_actor_scope in the schema cache"
        }
      },
      studentId: "student-1",
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-3", "student-4"]
    });

    const actor = await requestContext.getAppActor();

    expect(actor).toMatchObject({
      studentId: "student-1",
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-3", "student-4"],
      isTeacher: true
    });
    expect(warnSpy).toHaveBeenCalledWith(
      "REQUEST_CONTEXT_SCOPE_RPC_UNAVAILABLE",
      expect.objectContaining({
        code: "REQUEST_CONTEXT_SCOPE_RPC_UNAVAILABLE"
      })
    );
  });

  it("reuses cached identity and linked scope between repeated calls", async () => {
    const { module: requestContext, adminClient } = await loadRequestContextModule({
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

    expect(adminClient.stats.profileReads).toBe(1);
    expect(adminClient.stats.rpcCalls).toBe(1);
  });

  it("invalidates cached actor data explicitly", async () => {
    const { module: requestContext, adminClient } = await loadRequestContextModule({
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

    expect(adminClient.stats.profileReads).toBe(2);
    expect(adminClient.stats.rpcCalls).toBe(2);
  });
});
