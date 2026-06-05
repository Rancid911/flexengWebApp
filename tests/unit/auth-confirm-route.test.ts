import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());
const setRecoveryMarkerMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
}));

vi.mock("@/lib/auth/recovery-marker", () => ({
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
});
