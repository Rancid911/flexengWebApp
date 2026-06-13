import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const RECOVERY_MARKER_COOKIE = "auth-recovery-marker";
const RECOVERY_MARKER_TTL_MS = 10 * 60 * 1000;

type RecoveryMarkerPayload = {
  userId: string;
  expiresAt: number;
  nonce: string;
};

function getRecoveryMarkerSecret() {
  const secret = process.env.AUTH_RECOVERY_MARKER_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_RECOVERY_MARKER_SECRET is required in production");
  }
  return "development-recovery-marker-secret";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getRecoveryMarkerSecret()).update(encodedPayload).digest("base64url");
}

function createMarkerValue(payload: RecoveryMarkerPayload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

function readMarkerValue(value: string): RecoveryMarkerPayload | null {
  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<RecoveryMarkerPayload>;
    if (typeof parsed.userId !== "string" || typeof parsed.expiresAt !== "number" || typeof parsed.nonce !== "string") {
      return null;
    }
    return {
      userId: parsed.userId,
      expiresAt: parsed.expiresAt,
      nonce: parsed.nonce
    };
  } catch {
    return null;
  }
}

export async function setRecoveryMarker(userId: string) {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + RECOVERY_MARKER_TTL_MS;
  cookieStore.set(RECOVERY_MARKER_COOKIE, createMarkerValue({ userId, expiresAt, nonce: randomBytes(16).toString("base64url") }), {
    httpOnly: true,
    maxAge: RECOVERY_MARKER_TTL_MS / 1000,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

export async function clearRecoveryMarker() {
  const cookieStore = await cookies();
  cookieStore.set(RECOVERY_MARKER_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

export async function verifyRecoveryMarker(userId: string) {
  const cookieStore = await cookies();
  const value = cookieStore.get(RECOVERY_MARKER_COOKIE)?.value;
  if (!value) return false;

  const payload = readMarkerValue(value);
  if (!payload) return false;
  if (payload.expiresAt < Date.now()) return false;
  return payload.userId === userId;
}
