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
  getAppActor: () => requireAppActorMock(),
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

  it("redirects role-only manager from the deprecated page guard", async () => {
    requireAppActorMock.mockResolvedValue({
      userId: "user-1",
      profileRole: "manager"
    });

    const { requireStaffAdminPage } = await import("@/lib/admin/auth");
    await expect(requireStaffAdminPage()).rejects.toThrow("redirect:/");
  });

  it("denies role-only manager from the deprecated api guard", async () => {
    requireAppActorMock.mockResolvedValue({
      userId: "user-2",
      profileRole: "manager"
    });

    const { requireStaffAdminApi } = await import("@/lib/admin/auth");
    await expect(requireStaffAdminApi()).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN"
    });
  });

  it("allows the deprecated guards only through RBAC roles.view", async () => {
    requireAppActorMock.mockResolvedValue({
      userId: "admin-compat",
      profileRole: "student",
      rbacRoles: ["admin"],
      rbacPermissions: ["roles.view"],
      rbacPermissionScopes: {
        "roles.view": ["all"]
      }
    });

    const { requireStaffAdminPage, requireStaffAdminApi } = await import("@/lib/admin/auth");
    await expect(requireStaffAdminPage()).resolves.toEqual({ userId: "admin-compat", role: "admin" });
    await expect(requireStaffAdminApi()).resolves.toEqual({ userId: "admin-compat", role: "admin" });
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
      profileRole: "manager",
      rbacRoles: ["manager"],
      rbacPermissions: ["students.view"],
      rbacPermissionScopes: {
        "students.view": ["all"]
      }
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
      profileRole: "manager",
      rbacRoles: ["manager"],
      rbacPermissions: ["content.manage"],
      rbacPermissionScopes: {
        "content.manage": ["all"]
      }
    });

    const { requireAdminPageAnyPermission } = await import("@/lib/admin/auth");
    await expect(requireAdminPageAnyPermission(["users.manage", "content.manage"])).resolves.toMatchObject({
      userId: "manager-2"
    });
  });

  it("allows API access through loaded RBAC metadata", async () => {
    requireAppActorMock.mockResolvedValue({
      userId: "manager-3",
      role: "manager",
      profileRole: "manager",
      rbacRoles: ["manager"],
      rbacPermissions: ["notifications.manage"],
      rbacPermissionScopes: {
        "notifications.manage": ["all"]
      }
    });

    const { requireAdminApiPermission } = await import("@/lib/admin/auth");
    await expect(requireAdminApiPermission("notifications.manage")).resolves.toMatchObject({
      userId: "manager-3",
      role: "manager",
      rbacPermissions: ["notifications.manage"]
    });
  });

  it("denies API access when loaded RBAC metadata is missing the grant despite admin profile role", async () => {
    requireAppActorMock.mockResolvedValue({
      userId: "admin-without-grant",
      role: "admin",
      profileRole: "admin",
      rbacRoles: ["admin"],
      rbacPermissions: ["users.view"],
      rbacPermissionScopes: {
        "users.view": ["all"]
      }
    });

    const { requireAdminApiPermission } = await import("@/lib/admin/auth");
    await expect(requireAdminApiPermission("notifications.manage")).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
      message: "Permission denied"
    });
  });

  it("denies API access without an actor", async () => {
    requireAppActorMock.mockResolvedValue(null);

    const { requireAdminApiPermission } = await import("@/lib/admin/auth");
    await expect(requireAdminApiPermission("notifications.manage")).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN"
    });
  });
});
