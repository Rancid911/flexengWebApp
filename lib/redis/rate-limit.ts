import "@/lib/redis/server-only";

import { Ratelimit } from "@upstash/ratelimit";

import { getRedisClient } from "@/lib/redis/client";
import { buildAuthRateLimitPrefix } from "@/lib/redis/keys";
import type { RateLimitConfig } from "@/lib/redis/rate-limit-config";

type RateLimitAllowed = {
  allowed: true;
};

type RateLimitBlocked = {
  allowed: false;
  retryAfter: number;
};

type RateLimitResult = RateLimitAllowed | RateLimitBlocked;

const limiters = new Map<string, Ratelimit>();

function getLimiter(config: RateLimitConfig) {
  const redis = getRedisClient();
  if (!redis) return null;

  const limiterKey = `${config.flow}:${config.limit}:${config.window}`;
  const existing = limiters.get(limiterKey);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    prefix: buildAuthRateLimitPrefix(config.flow),
    analytics: false
  });
  limiters.set(limiterKey, limiter);
  return limiter;
}

function logRateLimitFailOpen(config: RateLimitConfig, identifier: string, error: unknown) {
  console.error("REDIS_RATE_LIMIT_FAIL_OPEN", {
    flow: config.flow,
    identifier,
    error
  });
}

export async function checkRateLimit(config: RateLimitConfig, identifier: string): Promise<RateLimitResult> {
  try {
    const limiter = getLimiter(config);
    if (!limiter) return { allowed: true };

    const result = await limiter.limit(identifier);
    if (result.success && result.reason === "timeout") {
      logRateLimitFailOpen(config, identifier, new Error("Upstash rate-limit check timed out"));
      return { allowed: true };
    }
    if (result.success) return { allowed: true };

    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
    };
  } catch (error) {
    logRateLimitFailOpen(config, identifier, error);
    return { allowed: true };
  }
}
