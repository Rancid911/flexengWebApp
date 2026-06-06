import { NextResponse } from "next/server";

import { signInWithPasswordFromRequest } from "@/lib/auth/auth-api.service";
import { enforceAuthRateLimit, getAuthRateLimitIpPart, readEmailRateLimitPart } from "@/lib/redis/auth-rate-limit";
import { AUTH_RATE_LIMITS } from "@/lib/redis/rate-limit-config";
import { withApiErrorHandling } from "@/lib/server/http";

export const POST = withApiErrorHandling(async (request: Request) => {
  const ipPart = getAuthRateLimitIpPart(request);
  const emailPart = await readEmailRateLimitPart(request);

  const ipRateLimitResponse = await enforceAuthRateLimit(request, AUTH_RATE_LIMITS.loginIp, {
    parts: [ipPart]
  });
  if (ipRateLimitResponse) return ipRateLimitResponse;

  const rateLimitResponse = await enforceAuthRateLimit(request, AUTH_RATE_LIMITS.login, {
    parts: [ipPart, emailPart]
  });
  if (rateLimitResponse) return rateLimitResponse;

  await signInWithPasswordFromRequest(request);
  return NextResponse.json({ ok: true });
});
