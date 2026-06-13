import "@/lib/redis/server-only";

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwardedFor) return forwardedFor;

  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || "unknown";
}
