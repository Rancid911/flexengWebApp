import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getAppActorMock = vi.fn();
const loadSettingsProfileMock = vi.fn();
const updateSettingsProfileMock = vi.fn();

vi.mock("@/lib/auth/request-context", () => ({
  getAppActor: () => getAppActorMock()
}));

vi.mock("@/lib/settings/profile.service", () => ({
  loadSettingsProfile: (...args: unknown[]) => loadSettingsProfileMock(...args),
  updateSettingsProfile: (...args: unknown[]) => updateSettingsProfileMock(...args)
}));

describe("/api/settings/profile", () => {
  beforeEach(() => {
    vi.resetModules();
    getAppActorMock.mockReset();
    loadSettingsProfileMock.mockReset();
    updateSettingsProfileMock.mockReset();
  });

  it("returns current profile settings after read permission check", async () => {
    const actor = {
      userId: "profile-1",
      role: "student",
      rbacRoles: ["student"],
      rbacPermissions: ["profile.view"],
      rbacPermissionScopes: {
        "profile.view": ["own"]
      }
    };
    const profile = {
      userId: "profile-1",
      email: "student@example.com",
      pendingEmail: "",
      cachedAvatarUrl: null,
      profile: {
        firstName: "Ann",
        lastName: "Lee",
        phone: "+79990000000",
        avatarUrl: null,
        role: "student",
        email: "student@example.com"
      },
      resolvedBirthDate: "2010-01-01"
    };
    getAppActorMock.mockResolvedValue(actor);
    loadSettingsProfileMock.mockResolvedValue(profile);

    const { GET } = await import("@/app/api/settings/profile/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(profile);
    expect(loadSettingsProfileMock).toHaveBeenCalledWith(actor);
  });

  it("returns 401 when the actor is missing", async () => {
    getAppActorMock.mockResolvedValue(null);

    const { GET } = await import("@/app/api/settings/profile/route");
    const response = await GET();

    expect(response.status).toBe(401);
    expect(loadSettingsProfileMock).not.toHaveBeenCalled();
  });

  it("does not call update service when profile update permission is denied", async () => {
    getAppActorMock.mockResolvedValue({ role: "student" });

    const { PATCH } = await import("@/app/api/settings/profile/route");
    const response = await PATCH(
      new NextRequest("http://localhost/api/settings/profile", {
        method: "PATCH",
        body: "not form data"
      })
    );

    expect(response.status).toBe(403);
    expect(updateSettingsProfileMock).not.toHaveBeenCalled();
  });

  it("parses settings form data and updates profile after update permission check", async () => {
    const actor = {
      userId: "profile-1",
      role: "teacher",
      rbacRoles: ["teacher"],
      rbacPermissions: ["profile.update"],
      rbacPermissionScopes: {
        "profile.update": ["own"]
      }
    };
    const formData = new URLSearchParams();
    formData.set("firstName", "Ann");
    formData.set("lastName", "Lee");
    formData.set("phone", "+79990000000");
    formData.set("birthDate", "2010-01-01");
    formData.set("email", "ann@example.com");
    formData.set("currentPassword", "old-password");
    formData.set("nextPassword", "new-password");
    formData.set("profileDirty", "true");
    formData.set("emailDirty", "true");
    formData.set("passwordDirty", "true");
    formData.set("avatarDelete", "false");

    const result = {
      profile: {
        userId: "profile-1",
        email: "ann@example.com",
        pendingEmail: "",
        cachedAvatarUrl: null,
        profile: {
          firstName: "Ann",
          lastName: "Lee",
          phone: "+79990000000",
          avatarUrl: "/api/media/avatar/profile-1?v=1",
          role: "teacher",
          email: "ann@example.com"
        },
        resolvedBirthDate: "2010-01-01"
      },
      applied: { profile: true, avatar: true, email: true, password: true },
      avatarMessage: "Аватар обновлён",
      hasAppliedChanges: true,
      hasEmailPendingConfirmation: false
    };
    getAppActorMock.mockResolvedValue(actor);
    updateSettingsProfileMock.mockResolvedValue(result);

    const { PATCH } = await import("@/app/api/settings/profile/route");
    const response = await PATCH(
      new Request("http://localhost/api/settings/profile", {
        method: "PATCH",
        body: formData
      }) as NextRequest
    );

    const payload = await response.json();
    expect(response.status, JSON.stringify(payload)).toBe(200);
    expect(payload).toEqual(result);
    expect(updateSettingsProfileMock).toHaveBeenCalledWith(
      actor,
      expect.objectContaining({
        firstName: "Ann",
        lastName: "Lee",
        phone: "+79990000000",
        birthDate: "2010-01-01",
        email: "ann@example.com",
        currentPassword: "old-password",
        nextPassword: "new-password",
        profileDirty: true,
        emailDirty: true,
        passwordDirty: true,
        avatarDelete: false,
        avatarFile: null
      })
    );
  });
});
