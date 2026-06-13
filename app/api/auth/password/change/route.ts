import { NextResponse } from "next/server";

import { changePasswordFromRequest, getCurrentAuthUser } from "@/lib/auth/auth-api.service";
import { enforceAuthRateLimit, getAuthRateLimitIpPart } from "@/lib/redis/auth-rate-limit";
import { AUTH_RATE_LIMITS } from "@/lib/redis/rate-limit-config";
import { HttpError, withApiErrorHandling } from "@/lib/server/http";

export const POST = withApiErrorHandling(async (request: Request) => {
  const user = await getCurrentAuthUser();
  if (!user) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
  }

  const rateLimitResponse = await enforceAuthRateLimit(request, AUTH_RATE_LIMITS.changePassword, {
    parts: [`user:${user.id}`, getAuthRateLimitIpPart(request)]
  });
  if (rateLimitResponse) return rateLimitResponse;

  await changePasswordFromRequest(request);
  return NextResponse.json({ ok: true });
});
