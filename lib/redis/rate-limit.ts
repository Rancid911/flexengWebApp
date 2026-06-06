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

type RateLimitReadResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};

type RateLimitConsumeResult = RateLimitReadResult;

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

function getRetryAfterSeconds(reset: number) {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
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
      retryAfter: getRetryAfterSeconds(result.reset)
    };
  } catch (error) {
    logRateLimitFailOpen(config, identifier, error);
    return { allowed: true };
  }
}

export async function readRateLimit(config: RateLimitConfig, identifier: string): Promise<RateLimitReadResult> {
  try {
    const limiter = getLimiter(config);
    if (!limiter) {
      return { allowed: true, remaining: Number.POSITIVE_INFINITY, retryAfter: 0 };
    }

    const result = await limiter.getRemaining(identifier);
    const retryAfter = getRetryAfterSeconds(result.reset);
    return {
      allowed: result.remaining > 0,
      remaining: result.remaining,
      retryAfter
    };
  } catch (error) {
    logRateLimitFailOpen(config, identifier, error);
    return { allowed: true, remaining: Number.POSITIVE_INFINITY, retryAfter: 0 };
  }
}

export async function consumeRateLimit(config: RateLimitConfig, identifier: string): Promise<RateLimitConsumeResult> {
  try {
    const limiter = getLimiter(config);
    if (!limiter) {
      return { allowed: true, remaining: Number.POSITIVE_INFINITY, retryAfter: 0 };
    }

    const result = await limiter.limit(identifier);
    if (result.success && result.reason === "timeout") {
      logRateLimitFailOpen(config, identifier, new Error("Upstash rate-limit check timed out"));
      return { allowed: true, remaining: Number.POSITIVE_INFINITY, retryAfter: 0 };
    }

    return {
      allowed: result.success,
      remaining: result.remaining,
      retryAfter: getRetryAfterSeconds(result.reset)
    };
  } catch (error) {
    logRateLimitFailOpen(config, identifier, error);
    return { allowed: true, remaining: Number.POSITIVE_INFINITY, retryAfter: 0 };
  }
}

export async function resetRateLimit(config: RateLimitConfig, identifier: string) {
  try {
    const limiter = getLimiter(config);
    if (!limiter) return;

    await limiter.resetUsedTokens(identifier);
  } catch (error) {
    logRateLimitFailOpen(config, identifier, error);
  }
}
