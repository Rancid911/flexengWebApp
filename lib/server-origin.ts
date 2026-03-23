import { headers } from "next/headers";

const PROTOCOL_REGEX = /^(https?)$/i;

function normalizeEnvOrigin(value: string | undefined | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!PROTOCOL_REGEX.test(url.protocol.replace(":", ""))) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export async function getRequestOrigin() {
  const canonicalOrigin = normalizeEnvOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? null);
  if (canonicalOrigin) return canonicalOrigin;

  const nodeEnv = process.env.NODE_ENV ?? "development";
  if (nodeEnv !== "production") {
    const headerStore = await headers();
    const hostHeader = headerStore.get("host")?.trim().toLowerCase() ?? "localhost:3000";
    const protocolHeader = headerStore.get("x-forwarded-proto");
    const protocol = PROTOCOL_REGEX.test(protocolHeader ?? "") ? (protocolHeader as string).toLowerCase() : "http";

    if (hostHeader.startsWith("localhost") || hostHeader.startsWith("127.0.0.1")) {
      return `${protocol}://${hostHeader}`;
    }
  }

  return "http://localhost:3000";
}
