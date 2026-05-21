import { beforeEach, describe, expect, it, vi } from "vitest";

const requireProfileIdentityContextMock = vi.fn();
const getProfileIdentityContextMock = vi.fn();
const requireAppActorMock = vi.fn();
const redirectMock = vi.fn((href: string) => {
  throw new Error(`redirect:${href}`);
});

vi.mock("next/navigation", () => ({
  redirect: (href: string) => redirectMock(href)
}));

vi.mock("@/lib/auth/request-context", () => ({
  requireProfileIdentityContext: () => requireProfileIdentityContextMock(),
  getProfileIdentityContext: () => getProfileIdentityContextMock(),
  requireAppActor: () => requireAppActorMock()
}));

describe("staff admin guards", () => {
  beforeEach(() => {
    vi.resetModules();
    requireProfileIdentityContextMock.mockReset();
    getProfileIdentityContextMock.mockReset();
    requireAppActorMock.mockReset();
    redirectMock.mockClear();
  });

  it("allows manager through the page guard", async () => {
    requireProfileIdentityContextMock.mockResolvedValue({
      userId: "user-1",
      profileRole: "manager"
    });

    const { requireStaffAdminPage } = await import("@/lib/admin/auth");
    await expect(requireStaffAdminPage()).resolves.toEqual({
      userId: "user-1",
      role: "manager"
    });
  });

  it("allows manager through the api guard", async () => {
    getProfileIdentityContextMock.mockResolvedValue({
      userId: "user-2",
      profileRole: "manager"
    });

    const { requireStaffAdminApi } = await import("@/lib/admin/auth");
    await expect(requireStaffAdminApi()).resolves.toEqual({
      userId: "user-2",
      role: "manager"
    });
  });

  it("rejects teacher from the api guard", async () => {
    getProfileIdentityContextMock.mockResolvedValue({
      userId: "user-3",
      profileRole: "teacher"
    });

    const { requireStaffAdminApi } = await import("@/lib/admin/auth");
    await expect(requireStaffAdminApi()).rejects.toMatchObject({
      message: "Admin access required"
    });
  });

  it("redirects teacher away from the page guard", async () => {
    requireProfileIdentityContextMock.mockResolvedValue({
      userId: "user-4",
      profileRole: "teacher"
    });

    const { requireStaffAdminPage } = await import("@/lib/admin/auth");
    await expect(requireStaffAdminPage()).rejects.toThrow("redirect:/");
  });

  it("allows page access through canonical permissions", async () => {
    requireAppActorMock.mockResolvedValue({
      userId: "manager-1",
      role: "manager",
      profileRole: "manager"
    });

    const { requireAdminPagePermission } = await import("@/lib/admin/auth");
    await expect(requireAdminPagePermission("students.view")).resolves.toMatchObject({
      userId: "manager-1"
    });
  });

  it("redirects page access when canonical permission is missing", async () => {
    requireAppActorMock.mockResolvedValue({
      userId: "teacher-1",
      role: "teacher",
      profileRole: "teacher"
    });

    const { requireAdminPagePermission } = await import("@/lib/admin/auth");
    await expect(requireAdminPagePermission("users.manage")).rejects.toThrow("redirect:/");
  });

  it("allows page access when any canonical permission matches", async () => {
    requireAppActorMock.mockResolvedValue({
      userId: "manager-2",
      role: "manager",
      profileRole: "manager"
    });

    const { requireAdminPageAnyPermission } = await import("@/lib/admin/auth");
    await expect(requireAdminPageAnyPermission(["users.manage", "content.manage"])).resolves.toMatchObject({
      userId: "manager-2"
    });
  });
});
