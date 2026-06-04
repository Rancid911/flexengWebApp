import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
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
    const response = await POST(jsonRequest("http://localhost/api/auth/signup", { email: "NEW@EXAMPLE.COM", password: "secret" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, hasSession: true });
    expect(auth.signUp).toHaveBeenCalledWith({ email: "new@example.com", password: "secret" });
  });

  it("does not forward caller-supplied provisioning metadata during public signup", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/signup/route");
    const response = await POST(
      jsonRequest("http://localhost/api/auth/signup", {
        email: "new@example.com",
        password: "secret",
        role: "admin",
        app_metadata: { provision_role: "admin" }
      })
    );

    expect(response.status).toBe(200);
    expect(auth.signUp).toHaveBeenCalledWith({ email: "new@example.com", password: "secret" });
  });

  it("returns the same neutral response when public signup reports an existing email", async () => {
    const auth = buildAuthMock();
    auth.signUp.mockResolvedValue({
      data: { session: null },
      error: { message: "User already registered" }
    });
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/signup/route");
    const response = await POST(jsonRequest("http://localhost/api/auth/signup", { email: "USER@EXAMPLE.COM", password: "secret" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, hasSession: false });
    expect(auth.signUp).toHaveBeenCalledWith({ email: "user@example.com", password: "secret" });
  });

  it("requests password reset with a backend-generated recovery redirect", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/password/reset-request/route");
    const response = await POST(jsonRequest("https://school.example/api/auth/password/reset-request", { email: " USER@EXAMPLE.COM " }));

    expect(response.status).toBe(200);
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
      redirectTo: "https://school.example/auth/confirm?next=/reset-password%3Fflow%3Drecovery"
    });
  });

  it("updates password only for a valid recovery/session request", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/password/update/route");
    const response = await POST(jsonRequest("http://localhost/api/auth/password/update", { password: "new-secret" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "new-secret" });
  });

  it("rejects too-short password updates before calling Supabase", async () => {
    const auth = buildAuthMock();
    createClientMock.mockResolvedValue({ auth });

    const { POST } = await import("@/app/api/auth/password/update/route");
    const response = await POST(jsonRequest("http://localhost/api/auth/password/update", { password: "123" }));

    expect(response.status).toBe(400);
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
