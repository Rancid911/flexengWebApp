import { act, renderHook, waitFor } from "@testing-library/react";
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

function errorJson(status: number, payload: unknown) {
  return {
    ok: false,
    status,
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

  it("changes password through the explicit auth password change endpoint", async () => {
    fetchMock.mockResolvedValue(okJson(profileResponse));
    const { result } = renderHook(() => useSettingsFormState());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    fetchMock.mockClear();
    fetchMock.mockResolvedValue(okJson({ ok: true }));

    act(() => {
      result.current.setCurrentPassword("OldPassword123!");
      result.current.setNextPassword("TestPassword123!");
      result.current.setConfirmPassword("TestPassword123!");
    });

    await act(async () => {
      await result.current.handleSaveAll({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/password/change",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            currentPassword: "OldPassword123!",
            nextPassword: "TestPassword123!"
          })
        })
      );
    });
    expect(fetchMock).not.toHaveBeenCalledWith("/api/auth/password/reset", expect.anything());
    expect(fetchMock).not.toHaveBeenCalledWith("/api/auth/password/update", expect.anything());
  });

  it("keeps pending email visible after Supabase requires confirmation", async () => {
    fetchMock.mockResolvedValue(okJson(profileResponse));
    const { result } = renderHook(() => useSettingsFormState());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    fetchMock.mockClear();
    fetchMock.mockResolvedValueOnce(
      okJson({
        profile: {
          ...profileResponse,
          email: "student@example.com",
          pendingEmail: "new@example.com"
        },
        applied: {
          profile: false,
          avatar: false,
          email: false,
          password: false
        },
        avatarMessage: "",
        hasAppliedChanges: false,
        hasEmailPendingConfirmation: true
      })
    );

    act(() => {
      result.current.setNewEmail("new@example.com");
    });

    await act(async () => {
      await result.current.handleSaveAll({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    await waitFor(() => {
      expect(result.current.newEmail).toBe("new@example.com");
      expect(result.current.pendingEmailAwaitingConfirm).toBe("new@example.com");
      expect(result.current.saveMessage).toBe("Письмо подтверждения отправлено на новый email. Перейдите по ссылке из письма.");
    });
  });

  it("falls back to the submitted email when pending email is missing from the response", async () => {
    fetchMock.mockResolvedValue(okJson(profileResponse));
    const { result } = renderHook(() => useSettingsFormState());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    fetchMock.mockClear();
    fetchMock.mockResolvedValueOnce(
      okJson({
        profile: {
          ...profileResponse,
          email: "student@example.com",
          pendingEmail: ""
        },
        applied: {
          profile: false,
          avatar: false,
          email: false,
          password: false
        },
        avatarMessage: "",
        hasAppliedChanges: false,
        hasEmailPendingConfirmation: true
      })
    );

    act(() => {
      result.current.setNewEmail("fallback@example.com");
    });

    await act(async () => {
      await result.current.handleSaveAll({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    await waitFor(() => {
      expect(result.current.newEmail).toBe("fallback@example.com");
      expect(result.current.pendingEmailAwaitingConfirm).toBe("fallback@example.com");
    });
  });

  it("shows structured duplicate email errors under the email field", async () => {
    fetchMock.mockResolvedValue(okJson(profileResponse));
    const { result } = renderHook(() => useSettingsFormState());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    fetchMock.mockClear();
    fetchMock.mockResolvedValueOnce(
      errorJson(400, {
        code: "SETTINGS_PROFILE_UPDATE_FAILED",
        message: "Email update failed",
        details: {
          fieldErrors: {
            email: ["Пользователь с таким email уже существует."]
          }
        }
      })
    );

    act(() => {
      result.current.setNewEmail("taken@example.com");
    });

    await act(async () => {
      await result.current.handleSaveAll({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    await waitFor(() => {
      expect(result.current.fieldErrors.email).toBe("Пользователь с таким email уже существует.");
      expect(result.current.accessSectionError).toBe("Пользователь с таким email уже существует.");
    });
  });

  it("shows email provider form errors in the access section", async () => {
    fetchMock.mockResolvedValue(okJson(profileResponse));
    const { result } = renderHook(() => useSettingsFormState());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    fetchMock.mockClear();
    fetchMock.mockResolvedValueOnce(
      errorJson(400, {
        code: "SETTINGS_PROFILE_UPDATE_FAILED",
        message: "Email update failed",
        details: {
          formErrors: ["Не удалось отправить письмо подтверждения. Проверьте настройки email-провайдера Supabase."]
        }
      })
    );

    act(() => {
      result.current.setNewEmail("new@example.com");
    });

    await act(async () => {
      await result.current.handleSaveAll({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    await waitFor(() => {
      expect(result.current.accessSectionError).toBe("Не удалось отправить письмо подтверждения. Проверьте настройки email-провайдера Supabase.");
      expect(result.current.fieldErrors.email).toBeUndefined();
    });
  });
});
