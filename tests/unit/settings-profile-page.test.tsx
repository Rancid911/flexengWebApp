import { describe, expect, it, vi, beforeEach } from "vitest";

const requireLayoutActorMock = vi.fn();
const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("@/lib/auth/request-context", () => ({
  requireLayoutActor: () => requireLayoutActorMock()
}));

vi.mock("next/navigation", () => ({
  notFound: () => notFoundMock()
}));

vi.mock("@/features/settings/components/settings-client", () => ({
  SettingsClient: () => <div>settings profile</div>
}));

describe("ProfileSettingsPage", () => {
  beforeEach(() => {
    vi.resetModules();
    requireLayoutActorMock.mockReset();
    notFoundMock.mockClear();
  });

  it("denies direct access when RBAC metadata is empty", async () => {
    requireLayoutActorMock.mockResolvedValue({
      userId: "student-profile-1",
      rbacRoles: [],
      rbacPermissions: [],
      rbacPermissionScopes: {}
    });

    const { default: ProfileSettingsPage } = await import("@/app/(workspace)/(shared-zone)/settings/profile/page");
    await expect(ProfileSettingsPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("renders when RBAC grants profile.view own scope", async () => {
    requireLayoutActorMock.mockResolvedValue({
      userId: "student-profile-1",
      rbacRoles: ["student"],
      rbacPermissions: ["profile.view"],
      rbacPermissionScopes: {
        "profile.view": ["own"]
      }
    });

    const { default: ProfileSettingsPage } = await import("@/app/(workspace)/(shared-zone)/settings/profile/page");
    const result = await ProfileSettingsPage();

    expect(result).toBeTruthy();
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("denies direct access when RBAC metadata is present without profile.view", async () => {
    requireLayoutActorMock.mockResolvedValue({
      userId: "student-profile-1",
      rbacRoles: ["student"],
      rbacPermissions: ["schedule.view"],
      rbacPermissionScopes: {
        "schedule.view": ["own"]
      }
    });

    const { default: ProfileSettingsPage } = await import("@/app/(workspace)/(shared-zone)/settings/profile/page");
    await expect(ProfileSettingsPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
