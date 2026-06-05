import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

describe("auth browser API client", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("posts login credentials to the same-origin auth endpoint", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true })
    });

    const { loginWithPassword } = await import("@/features/auth/client/auth-api");
    await expect(loginWithPassword({ email: "user@example.com", password: "secret" })).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", password: "secret" })
    }));
  });

  it("throws backend auth messages for form error mapping", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ code: "AUTH_ERROR", message: "Invalid login credentials" })
    });

    const { loginWithPassword, AuthApiError } = await import("@/features/auth/client/auth-api");
    await expect(loginWithPassword({ email: "user@example.com", password: "bad" })).rejects.toBeInstanceOf(AuthApiError);
    await expect(loginWithPassword({ email: "user@example.com", password: "bad" })).rejects.toMatchObject({
      status: 400,
      code: "AUTH_ERROR",
      message: "Invalid login credentials"
    });
  });

  it("uses explicit same-origin endpoints for reset, change, session lookup and logout", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, user: { id: "user-1", email: "user@example.com" } })
    });

    const {
      changePassword,
      getCurrentAuthUser,
      logoutCurrentSession,
      requestPasswordReset,
      resetPassword
    } = await import("@/features/auth/client/auth-api");

    await requestPasswordReset({ email: "user@example.com" });
    await changePassword({ currentPassword: "OldPassword123!", nextPassword: "NewPassword123!" });
    await resetPassword({ nextPassword: "NewPassword123!" });
    await getCurrentAuthUser();
    await logoutCurrentSession();

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/password/reset-request", expect.objectContaining({ method: "POST" }));
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/password/change", expect.objectContaining({ method: "POST" }));
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/password/reset", expect.objectContaining({ method: "POST" }));
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/me", expect.objectContaining({ method: "GET", cache: "no-store" }));
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({ method: "POST" }));
  });
});
