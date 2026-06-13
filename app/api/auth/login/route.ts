import { NextResponse } from "next/server";

import { signInWithPasswordFromRequest } from "@/lib/auth/auth-api.service";
import { getAuthRateLimitIpPart, readEmailRateLimitPart } from "@/lib/redis/auth-rate-limit";
import { rateLimitedResponse } from "@/lib/redis/http";
import { buildAuthRateLimitIdentifier } from "@/lib/redis/keys";
import { consumeRateLimit, readRateLimit, resetRateLimit } from "@/lib/redis/rate-limit";
import { AUTH_RATE_LIMITS } from "@/lib/redis/rate-limit-config";
import { withApiErrorHandling } from "@/lib/server/http";

type LoginRateLimitState = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};

function isLoginRateLimitExhausted(result: LoginRateLimitState) {
  return !result.allowed || result.remaining <= 0;
}

function getLargestRetryAfter(...results: LoginRateLimitState[]) {
  return Math.max(1, ...results.filter(isLoginRateLimitExhausted).map((result) => result.retryAfter));
}

export const POST = withApiErrorHandling(async (request: Request) => {
  const ipPart = getAuthRateLimitIpPart(request);
  const emailPart = await readEmailRateLimitPart(request);
  const ipIdentifier = buildAuthRateLimitIdentifier([ipPart]);
  const ipEmailIdentifier = buildAuthRateLimitIdentifier([ipPart, emailPart]);

  const ipRateLimit = await readRateLimit(AUTH_RATE_LIMITS.loginIp, ipIdentifier);
  const ipEmailRateLimit = await readRateLimit(AUTH_RATE_LIMITS.login, ipEmailIdentifier);

  if (isLoginRateLimitExhausted(ipRateLimit) || isLoginRateLimitExhausted(ipEmailRateLimit)) {
    return rateLimitedResponse("login", getLargestRetryAfter(ipRateLimit, ipEmailRateLimit));
  }

  try {
    await signInWithPasswordFromRequest(request);
  } catch (error) {
    const consumedIpRateLimit = await consumeRateLimit(AUTH_RATE_LIMITS.loginIp, ipIdentifier);
    const consumedIpEmailRateLimit = await consumeRateLimit(AUTH_RATE_LIMITS.login, ipEmailIdentifier);

    if (isLoginRateLimitExhausted(consumedIpRateLimit) || isLoginRateLimitExhausted(consumedIpEmailRateLimit)) {
      return rateLimitedResponse("login", getLargestRetryAfter(consumedIpRateLimit, consumedIpEmailRateLimit));
    }

    throw error;
  }

  await resetRateLimit(AUTH_RATE_LIMITS.login, ipEmailIdentifier);
  return NextResponse.json({ ok: true });
});
