import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStoreMock = vi.hoisted(() => {
  const values = new Map<string, { value: string }>();
  return {
    get: vi.fn((name: string) => values.get(name)),
    set: vi.fn((name: string, value: string) => {
      values.set(name, { value });
    }),
    values
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => cookieStoreMock
}));

describe("recovery marker", () => {
  beforeEach(() => {
    vi.useRealTimers();
    cookieStoreMock.values.clear();
    cookieStoreMock.get.mockClear();
    cookieStoreMock.set.mockClear();
  });

  it("verifies a marker for the same user", async () => {
    const { setRecoveryMarker, verifyRecoveryMarker } = await import("@/lib/auth/recovery-marker");

    await setRecoveryMarker("user-1");

    await expect(verifyRecoveryMarker("user-1")).resolves.toBe(true);
  });

  it("rejects a marker for another user", async () => {
    const { setRecoveryMarker, verifyRecoveryMarker } = await import("@/lib/auth/recovery-marker");

    await setRecoveryMarker("user-1");

    await expect(verifyRecoveryMarker("user-2")).resolves.toBe(false);
  });

  it("rejects tampered markers", async () => {
    const { RECOVERY_MARKER_COOKIE, setRecoveryMarker, verifyRecoveryMarker } = await import("@/lib/auth/recovery-marker");

    await setRecoveryMarker("user-1");
    const currentValue = cookieStoreMock.values.get(RECOVERY_MARKER_COOKIE)?.value ?? "";
    cookieStoreMock.values.set(RECOVERY_MARKER_COOKIE, { value: `${currentValue}x` });

    await expect(verifyRecoveryMarker("user-1")).resolves.toBe(false);
  });

  it("rejects expired markers", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-05T10:00:00.000Z"));
    const { setRecoveryMarker, verifyRecoveryMarker } = await import("@/lib/auth/recovery-marker");

    await setRecoveryMarker("user-1");
    vi.setSystemTime(new Date("2026-06-05T10:11:00.000Z"));

    await expect(verifyRecoveryMarker("user-1")).resolves.toBe(false);
  });

  it("clears markers", async () => {
    const { clearRecoveryMarker, RECOVERY_MARKER_COOKIE, setRecoveryMarker, verifyRecoveryMarker } = await import("@/lib/auth/recovery-marker");

    await setRecoveryMarker("user-1");
    await clearRecoveryMarker();

    expect(cookieStoreMock.values.get(RECOVERY_MARKER_COOKIE)?.value).toBe("");
    await expect(verifyRecoveryMarker("user-1")).resolves.toBe(false);
  });
});
