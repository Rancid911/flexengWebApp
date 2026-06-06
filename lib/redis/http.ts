import "@/lib/redis/server-only";

import { NextResponse } from "next/server";

export const RATE_LIMITED_CODE = "RATE_LIMITED";

export function formatRetryAfterMessage(retryAfterSeconds: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Слишком много попыток. Попробуйте снова через ${minutes} мин.`;
}

export function rateLimitedResponse(retryAfterSeconds: number) {
  const retryAfter = Math.max(1, Math.ceil(retryAfterSeconds));

  return NextResponse.json(
    {
      error: formatRetryAfterMessage(retryAfter),
      code: RATE_LIMITED_CODE,
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
