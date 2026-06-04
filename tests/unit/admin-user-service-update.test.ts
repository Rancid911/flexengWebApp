import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  createAdminAuthUserClient: vi.fn(),
  readProfileById: vi.fn(),
  updateAuthUserById: vi.fn(),
  updateProfileById: vi.fn(),
  readHydratedAdminUserByProfileId: vi.fn()
}));
const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/admin/user.repository", () => repositoryMocks);
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("@/lib/admin/audit", () => ({ writeAudit: vi.fn() }));
vi.mock("@/lib/auth/request-context", () => ({ invalidateFullAppActorCache: vi.fn() }));

const actor = { userId: "admin-1", role: "admin" as const };
const beforeProfile = {
  id: "manager-1",
  role: "manager",
  first_name: "Old",
  last_name: "Name",
  email: "old@example.com",
  phone: "+79990000000"
};

describe("updateAdminUser email consistency", () => {
  beforeEach(() => {
    vi.resetModules();
    for (const mock of Object.values(repositoryMocks)) mock.mockReset();
    createClientMock.mockReset();

    createClientMock.mockResolvedValue({ kind: "table-client" });
    repositoryMocks.createAdminAuthUserClient.mockReturnValue({ kind: "auth-client" });
    repositoryMocks.readProfileById.mockResolvedValue({ data: beforeProfile, error: null });
    repositoryMocks.updateAuthUserById.mockResolvedValue({ error: null });
    repositoryMocks.updateProfileById.mockResolvedValue({ error: null });
    repositoryMocks.readHydratedAdminUserByProfileId.mockResolvedValue({ ...beforeProfile, email: "new@example.com" });
  });

  it("updates Auth before profile fields and leaves profile email to the database sync trigger", async () => {
    const { updateAdminUser } = await import("@/lib/admin/user-service");

    await updateAdminUser(actor, "manager-1", {
      email: "new@example.com",
      first_name: "New"
    });

    expect(repositoryMocks.updateAuthUserById).toHaveBeenCalledWith(
      { kind: "auth-client" },
      "manager-1",
      { email: "new@example.com" }
    );
    expect(repositoryMocks.updateProfileById).toHaveBeenCalledWith(
      { kind: "table-client" },
      "manager-1",
      { first_name: "New", display_name: "New Name" }
    );
    expect(repositoryMocks.updateAuthUserById.mock.invocationCallOrder[0]).toBeLessThan(
      repositoryMocks.updateProfileById.mock.invocationCallOrder[0]
    );
  });

  it("returns a conflict and does not update profile fields when the Auth email already exists", async () => {
    repositoryMocks.updateAuthUserById.mockResolvedValue({ error: { message: "User already registered" } });
    const { updateAdminUser } = await import("@/lib/admin/user-service");

    await expect(updateAdminUser(actor, "manager-1", { email: "existing@example.com", first_name: "New" })).rejects.toMatchObject({
      status: 409,
      code: "USER_EMAIL_EXISTS"
    });

    expect(repositoryMocks.updateProfileById).not.toHaveBeenCalled();
  });
});
