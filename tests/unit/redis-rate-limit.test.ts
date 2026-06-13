import { beforeEach, describe, expect, it, vi } from "vitest";

const getRedisClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/redis/client", () => ({
  getRedisClient: () => getRedisClientMock()
}));

describe("Redis rate-limit utility", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doUnmock("@upstash/ratelimit");
    getRedisClientMock.mockReset();
  });

  it("fails open and logs when the rate-limit check throws", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    class ThrowingRatelimit {
      static slidingWindow = vi.fn(() => "sliding-window");

      limit = vi.fn().mockRejectedValue(new Error("redis unavailable"));
    }

    vi.doMock("@upstash/ratelimit", () => ({
      Ratelimit: ThrowingRatelimit
    }));
    getRedisClientMock.mockReturnValue({ kind: "redis" });

    const { checkRateLimit } = await import("@/lib/redis/rate-limit");
    await expect(checkRateLimit({ flow: "login", messageFlow: "login", limit: 5, window: "15 m" }, "ip:1")).resolves.toEqual({
      allowed: true
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "REDIS_RATE_LIMIT_FAIL_OPEN",
      expect.objectContaining({
        flow: "login",
        identifier: "ip:1",
        error: expect.any(Error)
      })
    );

    consoleErrorSpy.mockRestore();
    vi.doUnmock("@upstash/ratelimit");
  });

  it("fails open and logs when Upstash returns a timeout response", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    class TimeoutRatelimit {
      static slidingWindow = vi.fn(() => "sliding-window");

      limit = vi.fn().mockResolvedValue({
        success: true,
        reason: "timeout",
        reset: 0,
        pending: Promise.resolve()
      });
    }

    vi.doMock("@upstash/ratelimit", () => ({
      Ratelimit: TimeoutRatelimit
    }));
    getRedisClientMock.mockReturnValue({ kind: "redis" });

    const { checkRateLimit } = await import("@/lib/redis/rate-limit");
    await expect(checkRateLimit({ flow: "login", messageFlow: "login", limit: 5, window: "15 m" }, "ip:1")).resolves.toEqual({
      allowed: true
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "REDIS_RATE_LIMIT_FAIL_OPEN",
      expect.objectContaining({
        flow: "login",
        identifier: "ip:1",
        error: expect.any(Error)
      })
    );

    consoleErrorSpy.mockRestore();
    vi.doUnmock("@upstash/ratelimit");
  });

  it("passes the app auth namespace as the Upstash prefix and identity as the identifier", async () => {
    const constructorMock = vi.fn();
    const limitMock = vi.fn().mockResolvedValue({
      success: true,
      reset: Date.now() + 60_000,
      pending: Promise.resolve()
    });

    class PrefixRecordingRatelimit {
      static slidingWindow = vi.fn(() => "sliding-window");

      constructor(config: unknown) {
        constructorMock(config);
      }

      limit = limitMock;
    }

    vi.doMock("@upstash/ratelimit", () => ({
      Ratelimit: PrefixRecordingRatelimit
    }));
    getRedisClientMock.mockReturnValue({ kind: "redis" });

    const { checkRateLimit } = await import("@/lib/redis/rate-limit");
    await expect(checkRateLimit({ flow: "login", messageFlow: "login", limit: 5, window: "15 m" }, "ip:1:email:user@example.com")).resolves.toEqual({
      allowed: true
    });

    expect(constructorMock).toHaveBeenCalledWith(expect.objectContaining({
      prefix: "app:auth:rl:login",
      analytics: false
    }));
    expect(limitMock).toHaveBeenCalledWith("ip:1:email:user@example.com");

    vi.doUnmock("@upstash/ratelimit");
  });

  it("allows requests when Redis credentials are not configured", async () => {
    getRedisClientMock.mockReturnValue(null);

    const { checkRateLimit } = await import("@/lib/redis/rate-limit");
    await expect(checkRateLimit({ flow: "signup", messageFlow: "signup", limit: 3, window: "1 h" }, "ip:unknown")).resolves.toEqual({
      allowed: true
    });
  });

  it("reads remaining quota without consuming tokens", async () => {
    const getRemainingMock = vi.fn().mockResolvedValue({
      remaining: 2,
      reset: Date.now() + 120_000
    });
    const limitMock = vi.fn();

    class ReadRecordingRatelimit {
      static slidingWindow = vi.fn(() => "sliding-window");

      getRemaining = getRemainingMock;
      limit = limitMock;
    }

    vi.doMock("@upstash/ratelimit", () => ({
      Ratelimit: ReadRecordingRatelimit
    }));
    getRedisClientMock.mockReturnValue({ kind: "redis" });

    const { readRateLimit } = await import("@/lib/redis/rate-limit");
    await expect(readRateLimit({ flow: "login", messageFlow: "login", limit: 5, window: "15 m" }, "ip:1")).resolves.toEqual({
      allowed: true,
      remaining: 2,
      retryAfter: 120
    });
    expect(getRemainingMock).toHaveBeenCalledWith("ip:1");
    expect(limitMock).not.toHaveBeenCalled();

    vi.doUnmock("@upstash/ratelimit");
  });

  it("consumes quota and exposes remaining tokens and retryAfter", async () => {
    const limitMock = vi.fn().mockResolvedValue({
      success: true,
      remaining: 0,
      reset: Date.now() + 300_000,
      pending: Promise.resolve()
    });

    class ConsumeRecordingRatelimit {
      static slidingWindow = vi.fn(() => "sliding-window");

      limit = limitMock;
    }

    vi.doMock("@upstash/ratelimit", () => ({
      Ratelimit: ConsumeRecordingRatelimit
    }));
    getRedisClientMock.mockReturnValue({ kind: "redis" });

    const { consumeRateLimit } = await import("@/lib/redis/rate-limit");
    await expect(consumeRateLimit({ flow: "login", messageFlow: "login", limit: 5, window: "15 m" }, "ip:1")).resolves.toEqual({
      allowed: true,
      remaining: 0,
      retryAfter: 300
    });
    expect(limitMock).toHaveBeenCalledWith("ip:1");

    vi.doUnmock("@upstash/ratelimit");
  });

  it("resets used tokens for an identifier", async () => {
    const resetUsedTokensMock = vi.fn().mockResolvedValue(undefined);

    class ResetRecordingRatelimit {
      static slidingWindow = vi.fn(() => "sliding-window");

      resetUsedTokens = resetUsedTokensMock;
    }

    vi.doMock("@upstash/ratelimit", () => ({
      Ratelimit: ResetRecordingRatelimit
    }));
    getRedisClientMock.mockReturnValue({ kind: "redis" });

    const { resetRateLimit } = await import("@/lib/redis/rate-limit");
    await resetRateLimit({ flow: "login", messageFlow: "login", limit: 5, window: "15 m" }, "ip:1");

    expect(resetUsedTokensMock).toHaveBeenCalledWith("ip:1");

    vi.doUnmock("@upstash/ratelimit");
  });

  it("fails open when reading or consuming quota throws and logs reset failures", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    class ThrowingRatelimit {
      static slidingWindow = vi.fn(() => "sliding-window");

      getRemaining = vi.fn().mockRejectedValue(new Error("read failed"));
      limit = vi.fn().mockRejectedValue(new Error("consume failed"));
      resetUsedTokens = vi.fn().mockRejectedValue(new Error("reset failed"));
    }

    vi.doMock("@upstash/ratelimit", () => ({
      Ratelimit: ThrowingRatelimit
    }));
    getRedisClientMock.mockReturnValue({ kind: "redis" });

    const { consumeRateLimit, readRateLimit, resetRateLimit } = await import("@/lib/redis/rate-limit");
    const config = { flow: "login", messageFlow: "login", limit: 5, window: "15 m" } as const;

    await expect(readRateLimit(config, "ip:1")).resolves.toEqual({
      allowed: true,
      remaining: Number.POSITIVE_INFINITY,
      retryAfter: 0
    });
    await expect(consumeRateLimit(config, "ip:1")).resolves.toEqual({
      allowed: true,
      remaining: Number.POSITIVE_INFINITY,
      retryAfter: 0
    });
    await expect(resetRateLimit(config, "ip:1")).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalledTimes(3);

    consoleErrorSpy.mockRestore();
    vi.doUnmock("@upstash/ratelimit");
  });
});
