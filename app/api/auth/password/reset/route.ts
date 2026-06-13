import { NextResponse } from "next/server";

import { resetPasswordFromRequest } from "@/lib/auth/auth-api.service";
import { enforceAuthRateLimit, getAuthRateLimitIpPart } from "@/lib/redis/auth-rate-limit";
import { AUTH_RATE_LIMITS } from "@/lib/redis/rate-limit-config";
import { withApiErrorHandling } from "@/lib/server/http";

export const POST = withApiErrorHandling(async (request: Request) => {
  const rateLimitResponse = await enforceAuthRateLimit(request, AUTH_RATE_LIMITS.resetPassword, {
    parts: [getAuthRateLimitIpPart(request)]
  });
  if (rateLimitResponse) return rateLimitResponse;

  await resetPasswordFromRequest(request);
  return NextResponse.json({ ok: true });
});
