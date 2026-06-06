import { NextResponse } from "next/server";

import { signInWithPasswordFromRequest } from "@/lib/auth/auth-api.service";
import { enforceAuthRateLimit, getAuthRateLimitIpPart, readEmailRateLimitPart } from "@/lib/redis/auth-rate-limit";
import { AUTH_RATE_LIMITS } from "@/lib/redis/rate-limit-config";
import { withApiErrorHandling } from "@/lib/server/http";

export const POST = withApiErrorHandling(async (request: Request) => {
  const rateLimitResponse = await enforceAuthRateLimit(request, AUTH_RATE_LIMITS.login, {
    parts: [getAuthRateLimitIpPart(request), await readEmailRateLimitPart(request)]
  });
  if (rateLimitResponse) return rateLimitResponse;

  await signInWithPasswordFromRequest(request);
  return NextResponse.json({ ok: true });
});
