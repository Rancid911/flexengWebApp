const PUBLIC_STORAGE_MARKER = "/storage/v1/object/public/";

export const AVATAR_BUCKET = "avatars";
export const CRM_ASSETS_BUCKET = "crm-assets";

function appendVersion(url: string, version?: string | number | null) {
  if (version == null || version === "") return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(String(version))}`;
}

export function buildAvatarMediaUrl(userId: string, version?: string | number | null) {
  return appendVersion(`/api/media/avatar/${encodeURIComponent(userId)}`, version);
}

export function buildCrmBackgroundMediaUrl(path: string, version?: string | number | null) {
  const encodedPath = encodeURIComponent(path);
  return appendVersion(`/api/media/crm-background?p=${encodedPath}`, version);
}

export function isInternalAvatarMediaUrl(value: string) {
  return value.startsWith("/api/media/avatar/");
}

export function isInternalCrmBackgroundMediaUrl(value: string) {
  return value.startsWith("/api/media/crm-background");
}

export function extractStoragePathFromPublicUrl(value: string | null | undefined, bucket: string) {
  if (!value) return null;
  const marker = `${PUBLIC_STORAGE_MARKER}${bucket}/`;
  const markerIndex = value.indexOf(marker);
  if (markerIndex === -1) return null;

  const pathWithQuery = value.slice(markerIndex + marker.length);
  const [path] = pathWithQuery.split("?");
  return path ? decodeURIComponent(path) : null;
}

export function extractCrmBackgroundPathFromMediaUrl(value: string | null | undefined) {
  if (!value || !isInternalCrmBackgroundMediaUrl(value)) return null;
  try {
    const url = new URL(value, "http://localhost");
    const path = url.searchParams.get("p");
    return path?.trim() || null;
  } catch {
    return null;
  }
}

export function toAvatarMediaUrl(userId: string, storedUrl: string | null | undefined, version?: string | number | null) {
  if (!storedUrl) return null;
  if (isInternalAvatarMediaUrl(storedUrl)) return storedUrl;
  const path = extractStoragePathFromPublicUrl(storedUrl, AVATAR_BUCKET);
  return path ? buildAvatarMediaUrl(userId, version) : storedUrl;
}

export function toCrmBackgroundMediaUrl(storedUrl: string | null | undefined, version?: string | number | null) {
  if (!storedUrl) return null;
  if (isInternalCrmBackgroundMediaUrl(storedUrl)) return storedUrl;
  const path = extractStoragePathFromPublicUrl(storedUrl, CRM_ASSETS_BUCKET);
  return path ? buildCrmBackgroundMediaUrl(path, version) : storedUrl;
}
