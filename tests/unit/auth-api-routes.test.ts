import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());
const clearRecoveryMarkerMock = vi.hoisted(() => vi.fn());
const verifyRecoveryMarkerMock = vi.hoisted(() => vi.fn());
const checkRateLimitMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
}));

vi.mock("@/lib/auth/recovery-marker", () => ({
  clearRecoveryMarker: () => clearRecoveryMarkerMock(),
  setRecoveryMarker: vi.fn(),
  verifyRecoveryMarker: (userId: string) => verifyRecoveryMarkerMock(userId)
}));

vi.mock("@/lib/redis/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args)
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
    checkRateLimitMock.mockReset();
    checkRateLimitMock.mockResolvedValue({ allowed: true });
  });

  it("signs in with normalized credentials through the server Supabase client", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(jsonRequest("http://localhost/api/auth/login", { email: " USER@EXAMPLE.COM ", password: "secret" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "user@example.com", password: "secret" });
    expect(checkRateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ flow: "login", limit: 5, window: "15 m" }),
      "ip:unknown:email:user@example.com"
    );
  });

  it("uses forwarded IP and normalized email in the login rate-limit key", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/login/route");
    await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: " USER@EXAMPLE.COM ", password: "secret" }),
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.10, 10.0.0.1"
        }
      })
    );

    expect(checkRateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ flow: "login" }),
      "ip:203.0.113.10:email:user@example.com"
    );
  });

  it("blocks login attempts with a 429 response before calling Supabase auth", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });
    checkRateLimitMock.mockResolvedValue({ allowed: false, retryAfter: 300 });

    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(jsonRequest("http://localhost/api/auth/login", { email: "user@example.com", password: "secret" }));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("300");
    await expect(response.json()).resolves.toMatchObject({
      error: "Слишком много попыток входа. Попробуйте снова через 05 мин 00 сек.",
      code: "RATE_LIMITED",
      flow: "login",
      retryAfter: 300
    });
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
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
    expect(checkRateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ flow: "signup", limit: 3, window: "1 h" }),
      "ip:unknown"
    );
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
    expect(checkRateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ flow: "forgot-password-ip", messageFlow: "forgot-password", limit: 10, window: "1 h" }),
      "ip:unknown"
    );
    expect(checkRateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ flow: "forgot-password", limit: 3, window: "1 h" }),
      "ip:unknown:email:user@example.com"
    );
  });

  it("blocks forgot-password requests when the IP-only limiter is exceeded", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });
    checkRateLimitMock.mockResolvedValueOnce({ allowed: false, retryAfter: 2530 });

    const { POST } = await import("@/app/api/auth/password/reset-request/route");
    const response = await POST(jsonRequest("https://school.example/api/auth/password/reset-request", { email: "user@example.com" }));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("2530");
    await expect(response.json()).resolves.toMatchObject({
      error: "Слишком много запросов на сброс пароля. Попробуйте снова через 42 мин 10 сек.",
      code: "RATE_LIMITED",
      flow: "forgot-password",
      retryAfter: 2530
    });
    expect(checkRateLimitMock).toHaveBeenCalledTimes(1);
    expect(checkRateLimitMock).toHaveBeenCalledWith(expect.objectContaining({ flow: "forgot-password-ip" }), "ip:unknown");
    expect(auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("blocks forgot-password requests when the IP and email limiter is exceeded", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });
    checkRateLimitMock
      .mockResolvedValueOnce({ allowed: true })
      .mockResolvedValueOnce({ allowed: false, retryAfter: 45 });

    const { POST } = await import("@/app/api/auth/password/reset-request/route");
    const response = await POST(jsonRequest("https://school.example/api/auth/password/reset-request", { email: " USER@EXAMPLE.COM " }));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("45");
    await expect(response.json()).resolves.toMatchObject({
      error: "Слишком много запросов на сброс пароля. Попробуйте снова через 00 мин 45 сек.",
      code: "RATE_LIMITED",
      flow: "forgot-password",
      retryAfter: 45
    });
    expect(checkRateLimitMock).toHaveBeenNthCalledWith(1, expect.objectContaining({ flow: "forgot-password-ip" }), "ip:unknown");
    expect(checkRateLimitMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ flow: "forgot-password" }), "ip:unknown:email:user@example.com");
    expect(auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("uses an unknown email part for forgot-password rate limiting when the payload is not parseable", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/password/reset-request/route");
    const response = await POST(
      new Request("https://school.example/api/auth/password/reset-request", {
        method: "POST",
        body: "not-json",
        headers: {
          "Content-Type": "application/json",
          "x-real-ip": "198.51.100.8"
        }
      })
    );

    expect(response.status).toBe(400);
    expect(checkRateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ flow: "forgot-password-ip" }),
      "ip:198.51.100.8"
    );
    expect(checkRateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ flow: "forgot-password" }),
      "ip:198.51.100.8:email:unknown"
    );
    expect(auth.resetPasswordForEmail).not.toHaveBeenCalled();
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
    expect(checkRateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ flow: "change-password", limit: 5, window: "15 m" }),
      "user:user-1:ip:unknown"
    );
  });

  it("uses user id and IP in the change-password rate-limit key", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/password/change/route");
    await POST(
      new Request("http://localhost/api/auth/password/change", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "OldPassword123!",
          nextPassword: "NewPassword123!"
        }),
        headers: {
          "Content-Type": "application/json",
          "x-real-ip": "198.51.100.12"
        }
      })
    );

    expect(checkRateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ flow: "change-password" }),
      "user:user-1:ip:198.51.100.12"
    );
  });

  it("blocks account password changes with a 429 before updating the password", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });
    checkRateLimitMock.mockResolvedValue({ allowed: false, retryAfter: 60 });

    const { POST } = await import("@/app/api/auth/password/change/route");
    const response = await POST(
      jsonRequest("http://localhost/api/auth/password/change", {
        currentPassword: "OldPassword123!",
        nextPassword: "NewPassword123!"
      })
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    await expect(response.json()).resolves.toMatchObject({
      code: "RATE_LIMITED",
      flow: "change-password",
      retryAfter: 60,
      error: "Слишком много попыток смены пароля. Попробуйте снова через 01 мин 00 сек."
    });
    expect(auth.updateUser).not.toHaveBeenCalled();
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
    expect(checkRateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ flow: "reset-password", limit: 5, window: "15 m" }),
      "ip:unknown"
    );
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

  it("maps Supabase same-password recovery reset errors to the next password field", async () => {
    const auth = buildAuthMock();
    verifyRecoveryMarkerMock.mockResolvedValue(true);
    auth.updateUser.mockResolvedValue({
      error: {
        code: "same_password",
        message: "New password should be different from the old password."
      }
    });
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/password/reset/route");
    const response = await POST(jsonRequest("http://localhost/api/auth/password/reset", { nextPassword: "NewPassword123!" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "AUTH_PASSWORD_ERROR",
      message: "Password reset failed",
      details: {
        fieldErrors: {
          nextPassword: ["Новый пароль должен отличаться от текущего."]
        }
      }
    });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "NewPassword123!" });
    expect(clearRecoveryMarkerMock).not.toHaveBeenCalled();
  });

  it("maps unknown recovery reset update errors to a safe form-level error", async () => {
    const auth = buildAuthMock();
    verifyRecoveryMarkerMock.mockResolvedValue(true);
    auth.updateUser.mockResolvedValue({ error: { message: "Unexpected provider failure" } });
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/password/reset/route");
    const response = await POST(jsonRequest("http://localhost/api/auth/password/reset", { nextPassword: "NewPassword123!" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "AUTH_PASSWORD_ERROR",
      message: "Password reset failed",
      details: {
        formErrors: ["Не удалось обновить пароль. Запросите новую ссылку восстановления или попробуйте позже."]
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
