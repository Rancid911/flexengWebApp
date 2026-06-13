import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, runAuthRequestWithLockRetryMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  runAuthRequestWithLockRetryMock: vi.fn(
    async (callback: () => Promise<unknown>) => await callback()
  )
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock
}));

vi.mock("@/lib/supabase/auth-request", () => ({
  runAuthRequestWithLockRetry: runAuthRequestWithLockRetryMock
}));

import {
  createActorRepository,
  createUserScopedActorRepository
} from "@/lib/auth/actor.repository";

function makeProfileQuery() {
  const result = { data: null, error: null };
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result)
  };
  return builder;
}

function makeRbacQuery() {
  const result = { data: [], error: null };
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(async () => result)
  };
  return builder;
}

describe("actor repository", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    runAuthRequestWithLockRetryMock.mockClear();
  });

  it("loads the authenticated user through the existing auth lock retry", async () => {
    const getUser = vi.fn(async () => ({
      data: { user: { id: "user-1", email: "user@example.com" } },
      error: null
    }));
    const repository = createActorRepository({
      auth: { getUser }
    } as never);

    await repository.getAuthenticatedUser();

    expect(runAuthRequestWithLockRetryMock).toHaveBeenCalledTimes(1);
    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it("uses the current profile and RBAC query contracts", async () => {
    const profileQuery = makeProfileQuery();
    const rbacQuery = makeRbacQuery();
    const fromMock = vi.fn((table: string) => {
      if (table === "profiles") return profileQuery;
      if (table === "user_roles") return rbacQuery;
      throw new Error(`Unexpected table: ${table}`);
    });
    const repository = createActorRepository({
      from: fromMock
    } as never);

    await repository.loadProfileIdentity("user-1");
    await repository.loadRbacActorRows("user-1");

    expect(profileQuery.select).toHaveBeenCalledWith(
      "role, email, display_name, first_name, last_name, avatar_url"
    );
    expect(profileQuery.eq).toHaveBeenCalledWith("id", "user-1");
    expect(profileQuery.maybeSingle).toHaveBeenCalledTimes(1);
    expect(rbacQuery.select).toHaveBeenCalledWith(
      "roles(key, role_permissions(scope, permissions(key)))"
    );
    expect(rbacQuery.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("loads linked actor scope through the current RPC and argument", async () => {
    const rpc = vi.fn(async () => ({ data: null, error: null }));
    const repository = createActorRepository({ rpc } as never);

    await repository.loadLinkedActorScope("profile-1");

    expect(rpc).toHaveBeenCalledWith("get_linked_actor_scope", {
      p_profile_id: "profile-1"
    });
  });

  it("creates an injectable repository from the user-scoped SSR client", async () => {
    const client = {
      auth: {
        getUser: vi.fn()
      }
    };
    createClientMock.mockResolvedValue(client);

    const repository = await createUserScopedActorRepository();

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(repository).toEqual(
      expect.objectContaining({
        getAuthenticatedUser: expect.any(Function),
        loadProfileIdentity: expect.any(Function),
        loadLinkedActorScope: expect.any(Function),
        loadRbacActorRows: expect.any(Function)
      })
    );
  });
});
