import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());
const clearRecoveryMarkerMock = vi.hoisted(() => vi.fn());
const verifyRecoveryMarkerMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
}));

vi.mock("@/lib/auth/recovery-marker", () => ({
  clearRecoveryMarker: () => clearRecoveryMarkerMock(),
  setRecoveryMarker: vi.fn(),
  verifyRecoveryMarker: (userId: string) => verifyRecoveryMarkerMock(userId)
}));

function jsonRequest(url: string, body: Record<string, unknown>) {
  return new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function buildAuthMock() {
  return {
    signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "user@example.com" } }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null })
  };
}

describe("auth BFF API routes", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    clearRecoveryMarkerMock.mockReset();
    verifyRecoveryMarkerMock.mockReset();
    verifyRecoveryMarkerMock.mockResolvedValue(false);
  });

  it("signs in with normalized credentials through the server Supabase client", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(jsonRequest("http://localhost/api/auth/login", { email: " USER@EXAMPLE.COM ", password: "secret" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "user@example.com", password: "secret" });
  });

  it("returns provider auth errors without exposing a browser Supabase call", async () => {
    const auth = buildAuthMock();
    auth.signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(jsonRequest("http://localhost/api/auth/login", { email: "user@example.com", password: "bad" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "AUTH_ERROR",
      message: "Invalid login credentials"
    });
  });

  it("signs up and reports whether Supabase created a session immediately", async () => {
    const auth = buildAuthMock();
    auth.signUp.mockResolvedValue({ data: { session: { access_token: "token" } }, error: null });
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/signup/route");
    const response = await POST(jsonRequest("http://localhost/api/auth/signup", { email: "NEW@EXAMPLE.COM", password: "Password123!" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, hasSession: true });
    expect(auth.signUp).toHaveBeenCalledWith({ email: "new@example.com", password: "Password123!" });
  });

  it("does not forward caller-supplied provisioning metadata during public signup", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/signup/route");
    const response = await POST(
      jsonRequest("http://localhost/api/auth/signup", {
        email: "new@example.com",
        password: "Password123!",
        role: "admin",
        app_metadata: { provision_role: "admin" }
      })
    );

    expect(response.status).toBe(200);
    expect(auth.signUp).toHaveBeenCalledWith({ email: "new@example.com", password: "Password123!" });
  });

  it("returns the same neutral response when public signup reports an existing email", async () => {
    const auth = buildAuthMock();
    auth.signUp.mockResolvedValue({
      data: { session: null },
      error: { message: "User already registered" }
    });
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/signup/route");
    const response = await POST(jsonRequest("http://localhost/api/auth/signup", { email: "USER@EXAMPLE.COM", password: "Password123!" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, hasSession: false });
    expect(auth.signUp).toHaveBeenCalledWith({ email: "user@example.com", password: "Password123!" });
  });

  it("requests password reset with a backend-generated recovery redirect", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/password/reset-request/route");
    const response = await POST(jsonRequest("https://school.example/api/auth/password/reset-request", { email: " USER@EXAMPLE.COM " }));

    expect(response.status).toBe(200);
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
      redirectTo: "https://school.example/auth/confirm?next=/reset-password"
    });
  });

  it("changes account password with current_password through Supabase Auth", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/password/change/route");
    const response = await POST(
      jsonRequest("http://localhost/api/auth/password/change", {
        currentPassword: "OldPassword123!",
        nextPassword: "NewPassword123!"
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "NewPassword123!", current_password: "OldPassword123!" });
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("rejects weak account password changes before calling Supabase", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/password/change/route");
    const response = await POST(
      jsonRequest("http://localhost/api/auth/password/change", {
        currentPassword: "OldPassword123!",
        nextPassword: "123"
      })
    );

    expect(response.status).toBe(400);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("maps missing current password to the currentPassword field", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/password/change/route");
    const response = await POST(jsonRequest("http://localhost/api/auth/password/change", { nextPassword: "TestPassword123!" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
      details: { fieldErrors: { currentPassword: ["Введите текущий пароль"] } }
    });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("maps missing next password to the nextPassword field", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/password/change/route");
    const response = await POST(jsonRequest("http://localhost/api/auth/password/change", { currentPassword: "OldPassword123!" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "VALIDATION_ERROR",
      details: { fieldErrors: { nextPassword: ["Введите новый пароль"] } }
    });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("maps wrong current password to the currentPassword field", async () => {
    const auth = buildAuthMock();
    auth.updateUser.mockResolvedValue({ error: { message: "Current password is invalid" } });
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/password/change/route");
    const response = await POST(
      jsonRequest("http://localhost/api/auth/password/change", {
        currentPassword: "wrong",
        nextPassword: "NewPassword123!"
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "AUTH_PASSWORD_ERROR",
      details: { fieldErrors: { currentPassword: ["Текущий пароль указан неверно."] } }
    });
  });

  it("maps reauthentication-required password change errors to a session message", async () => {
    const auth = buildAuthMock();
    auth.updateUser.mockResolvedValue({ error: { message: "Password change requires reauthentication nonce" } });
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/password/change/route");
    const response = await POST(
      jsonRequest("http://localhost/api/auth/password/change", {
        currentPassword: "OldPassword123!",
        nextPassword: "TestPassword123!"
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: "REAUTHENTICATION_REQUIRED",
      message: "Сессия устарела. Войдите заново и повторите попытку."
    });
  });

  it("rejects recovery password reset without a recovery marker", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/password/reset/route");
    const response = await POST(jsonRequest("http://localhost/api/auth/password/reset", { nextPassword: "NewPassword123!" }));

    expect(response.status).toBe(403);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("resets password only with a valid recovery marker and clears it after success", async () => {
    const auth = buildAuthMock();
    verifyRecoveryMarkerMock.mockResolvedValue(true);
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/password/reset/route");
    const response = await POST(jsonRequest("http://localhost/api/auth/password/reset", { nextPassword: "NewPassword123!" }));

    expect(response.status).toBe(200);
    expect(verifyRecoveryMarkerMock).toHaveBeenCalledWith("user-1");
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "NewPassword123!" });
    expect(clearRecoveryMarkerMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the recovery marker when Supabase rejects the reset password update", async () => {
    const auth = buildAuthMock();
    verifyRecoveryMarkerMock.mockResolvedValue(true);
    auth.updateUser.mockResolvedValue({ error: { message: "Password is too weak" } });
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/password/reset/route");
    const response = await POST(jsonRequest("http://localhost/api/auth/password/reset", { nextPassword: "NewPassword123!" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "AUTH_PASSWORD_ERROR",
      message: "Password reset failed",
      details: {
        fieldErrors: {
          nextPassword: ["Проверьте требования к новому паролю."]
        }
      }
    });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "NewPassword123!" });
    expect(clearRecoveryMarkerMock).not.toHaveBeenCalled();
  });

  it("retires the mixed password update endpoint without changing passwords", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/password/update/route");
    const response = await POST();

    expect(response.status).toBe(410);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("returns the current auth user from the server session", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });

    const { GET } = await import("@/app/api/auth/me/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user: { id: "user-1", email: "user@example.com" } });
  });

  it("returns 401 when no auth user exists in the server session", async () => {
    const auth = buildAuthMock();
    auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    createClientMock.mockResolvedValue({ auth });

    const { GET } = await import("@/app/api/auth/me/route");
    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("logs out through the server Supabase client", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/logout/route");
    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});
