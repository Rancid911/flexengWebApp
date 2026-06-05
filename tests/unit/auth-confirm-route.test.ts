import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());
const setRecoveryMarkerMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
}));

vi.mock("@/lib/auth/recovery-marker", () => ({
  RECOVERY_MARKER_COOKIE: "auth-recovery-marker",
  setRecoveryMarker: (...args: unknown[]) => setRecoveryMarkerMock(...args)
}));

describe("/auth/confirm", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    setRecoveryMarkerMock.mockReset();
  });

  it("redirects successful account email confirmation back to settings profile", async () => {
    const auth = {
      exchangeCodeForSession: vi.fn(() => Promise.resolve({ error: null })),
      verifyOtp: vi.fn(),
      getUser: vi.fn()
    };
    createClientMock.mockResolvedValue({ auth });

    const { GET } = await import("@/app/auth/confirm/route");
    const response = await GET(new Request("https://app.example.com/auth/confirm?code=confirm-code&next=/settings/profile"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://app.example.com/settings/profile");
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("confirm-code");
    expect(auth.getUser).not.toHaveBeenCalled();
    expect(setRecoveryMarkerMock).not.toHaveBeenCalled();
  });

  it("sets the recovery marker and redirects recovery token confirmations to reset password", async () => {
    const auth = {
      exchangeCodeForSession: vi.fn(),
      verifyOtp: vi.fn(() => Promise.resolve({ error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "user-1" } } }))
    };
    createClientMock.mockResolvedValue({ auth });

    const { GET } = await import("@/app/auth/confirm/route");
    const response = await GET(
      new Request("https://app.example.com/auth/confirm?token_hash=recovery-token&type=recovery&next=/reset-password")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://app.example.com/reset-password");
    expect(auth.verifyOtp).toHaveBeenCalledWith({ type: "recovery", token_hash: "recovery-token" });
    expect(auth.getUser).toHaveBeenCalledTimes(1);
    expect(setRecoveryMarkerMock).toHaveBeenCalledWith("user-1");
  });

  it("sets the recovery marker for PKCE recovery redirects to reset password", async () => {
    const auth = {
      exchangeCodeForSession: vi.fn(() => Promise.resolve({ error: null })),
      verifyOtp: vi.fn(),
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "user-1" } } }))
    };
    createClientMock.mockResolvedValue({ auth });

    const { GET } = await import("@/app/auth/confirm/route");
    const response = await GET(new Request("https://app.example.com/auth/confirm?code=recovery-code&next=/reset-password"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://app.example.com/reset-password");
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("recovery-code");
    expect(auth.getUser).toHaveBeenCalledTimes(1);
    expect(setRecoveryMarkerMock).toHaveBeenCalledWith("user-1");
  });

  it("keeps the legacy recovery reset next value compatible", async () => {
    const auth = {
      exchangeCodeForSession: vi.fn(),
      verifyOtp: vi.fn(() => Promise.resolve({ error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "user-1" } } }))
    };
    createClientMock.mockResolvedValue({ auth });

    const { GET } = await import("@/app/auth/confirm/route");
    const response = await GET(
      new Request("https://app.example.com/auth/confirm?token_hash=recovery-token&type=recovery&next=/reset-password?flow=recovery")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://app.example.com/reset-password?flow=recovery");
    expect(setRecoveryMarkerMock).toHaveBeenCalledWith("user-1");
  });
});
