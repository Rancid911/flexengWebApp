import "@/lib/redis/server-only";

import { NextResponse } from "next/server";

import { formatAuthRateLimitMessage, type AuthRateLimitMessageFlow } from "@/lib/auth/rate-limit-messages";

export const RATE_LIMITED_CODE = "RATE_LIMITED";

export function rateLimitedResponse(flow: AuthRateLimitMessageFlow, retryAfterSeconds: number) {
  const retryAfter = Math.max(1, Math.ceil(retryAfterSeconds));

  return NextResponse.json(
    {
      error: formatAuthRateLimitMessage(flow, retryAfter),
      code: RATE_LIMITED_CODE,
      flow,
      retryAfter
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter)
      }
    }
  );
}
