import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveSettingsProfile, useSettingsFormState } from "@/features/settings/client/use-settings-form-state";

const replaceMock = vi.fn();
const refreshMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    refresh: refreshMock
  })
}));

vi.stubGlobal("fetch", fetchMock);

const profileResponse = {
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

function okJson(payload: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => payload
  };
}

describe("useSettingsFormState", () => {
  beforeEach(() => {
    window.localStorage.clear();
    replaceMock.mockReset();
    refreshMock.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(okJson(profileResponse));
  });

  it("loads settings profile through the settings API", async () => {
    const { result } = renderHook(() => useSettingsFormState());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/settings/profile", expect.any(Object));
    expect(result.current.firstName).toBe("Ann");
    expect(result.current.lastName).toBe("Lee");
    expect(result.current.newEmail).toBe("student@example.com");
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("saves changed profile fields through one settings API form-data request", async () => {
    const updateResponse = {
      profile: {
        ...profileResponse,
        profile: {
          ...profileResponse.profile,
          firstName: "Anna"
        }
      },
      applied: {
        profile: true,
        avatar: false,
        email: false,
        password: false
      },
      avatarMessage: "",
      hasAppliedChanges: true,
      hasEmailPendingConfirmation: false
    };
    fetchMock.mockResolvedValueOnce(okJson(updateResponse));
    const formData = new FormData();
    formData.set("firstName", "Anna");
    formData.set("profileDirty", "true");

    await expect(saveSettingsProfile(formData)).resolves.toEqual(updateResponse);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/settings/profile",
      expect.objectContaining({
        method: "PATCH",
        body: expect.any(FormData)
      })
    );
    const patchBody = fetchMock.mock.calls[0]?.[1]?.body as FormData;
    expect(patchBody.get("firstName")).toBe("Anna");
    expect(patchBody.get("profileDirty")).toBe("true");
  });
});
