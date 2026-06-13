import "@/lib/redis/server-only";

const ROOT_NAMESPACE = "app";

function sanitizeKeyPart(part: string) {
  return part.trim().toLowerCase().replace(/[^a-z0-9@._:-]/gi, "_") || "unknown";
}

export function buildRedisKey(...parts: string[]) {
  return [ROOT_NAMESPACE, ...parts.map(sanitizeKeyPart)].join(":");
}

export function buildAuthRateLimitPrefix(flow: string) {
  return buildRedisKey("auth", "rl", flow);
}

export function buildAuthRateLimitIdentifier(parts: string[]) {
  return parts.map(sanitizeKeyPart).join(":");
}
