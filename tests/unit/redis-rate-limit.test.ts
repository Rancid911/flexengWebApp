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
    await expect(checkRateLimit({ flow: "login", limit: 5, window: "15 m" }, "ip:1")).resolves.toEqual({
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
    await expect(checkRateLimit({ flow: "login", limit: 5, window: "15 m" }, "ip:1")).resolves.toEqual({
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
    await expect(checkRateLimit({ flow: "login", limit: 5, window: "15 m" }, "ip:1:email:user@example.com")).resolves.toEqual({
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
    await expect(checkRateLimit({ flow: "signup", limit: 3, window: "1 h" }, "ip:unknown")).resolves.toEqual({
      allowed: true
    });
  });
});
