import { beforeEach, describe, expect, it, vi } from "vitest";

const requireProfileIdentityContextMock = vi.fn();
const getProfileIdentityContextMock = vi.fn();
const redirectMock = vi.fn((href: string) => {
  throw new Error(`redirect:${href}`);
});

vi.mock("next/navigation", () => ({
  redirect: (href: string) => redirectMock(href)
}));

vi.mock("@/lib/auth/request-context", () => ({
  requireProfileIdentityContext: () => requireProfileIdentityContextMock(),
  getProfileIdentityContext: () => getProfileIdentityContextMock()
}));

describe("staff admin guards", () => {
  beforeEach(() => {
    vi.resetModules();
    requireProfileIdentityContextMock.mockReset();
    getProfileIdentityContextMock.mockReset();
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
});
