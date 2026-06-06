import "@/lib/redis/server-only";

import type { NextResponse } from "next/server";

import { normalizeEmail } from "@/lib/auth/email";
import { rateLimitedResponse } from "@/lib/redis/http";
import { buildAuthRateLimitIdentifier } from "@/lib/redis/keys";
import { getClientIp } from "@/lib/redis/request";
import { checkRateLimit } from "@/lib/redis/rate-limit";
import type { RateLimitConfig } from "@/lib/redis/rate-limit-config";

export type AuthRateLimitIdentity = {
  parts: string[];
};

export async function enforceAuthRateLimit(
  request: Request,
  config: RateLimitConfig,
  identity: AuthRateLimitIdentity
): Promise<NextResponse | null> {
  const identifier = buildAuthRateLimitIdentifier(identity.parts);
  const result = await checkRateLimit(config, identifier);

  if (result.allowed) return null;
  return rateLimitedResponse(result.retryAfter);
}

export function getAuthRateLimitIpPart(request: Request) {
  return `ip:${getClientIp(request)}`;
}

export async function readEmailRateLimitPart(request: Request) {
  try {
    const payload = (await request.clone().json()) as { email?: unknown };
    if (typeof payload.email === "string" && payload.email.trim()) {
      return `email:${normalizeEmail(payload.email)}`;
    }
  } catch {
    // Invalid JSON is handled by the auth route's existing validation.
  }

  return "email:unknown";
}
