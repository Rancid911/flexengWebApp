import type { AppActor } from "@/lib/auth/request-context";
import { can } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AVATAR_BUCKET,
  CRM_ASSETS_BUCKET,
  extractCrmBackgroundPathFromMediaUrl,
  extractStoragePathFromPublicUrl
} from "@/lib/media/urls";

export type MediaFileResult = {
  blob: Blob;
  contentType: string;
  etag: string;
};

const AVATAR_SELECT = "avatar_url, updated_at";
const CRM_SETTINGS_SELECT = "background_image_url, updated_at";

export function canReadProfileAvatar(actor: AppActor, userId: string) {
  if (actor.userId === userId) {
    return can(actor, "settings.profile.read", { ownerUserId: userId });
  }

  return can(actor, "admin.users.read") || can(actor, "admin.teachers.read");
}

function readBlobContentType(blob: Blob, fallback: string) {
  return blob.type || fallback;
}

async function downloadStorageObject(bucket: string, path: string, fallbackContentType: string, etag: string): Promise<MediaFileResult | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) return null;

  return {
    blob: data,
    contentType: readBlobContentType(data, fallbackContentType),
    etag
  };
}

export async function loadAvatarMediaFile(userId: string): Promise<MediaFileResult | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("profiles").select(AVATAR_SELECT).eq("id", userId).maybeSingle();
  const storedUrl = typeof data?.avatar_url === "string" ? data.avatar_url : null;
  const path = extractStoragePathFromPublicUrl(storedUrl, AVATAR_BUCKET) ?? `${userId}/avatar`;
  const updatedAt = typeof data?.updated_at === "string" ? data.updated_at : "0";

  return downloadStorageObject(AVATAR_BUCKET, path, "image/png", `avatar-${userId}-${updatedAt}`);
}

export async function loadCrmBackgroundMediaFile(explicitPath: string | null = null): Promise<MediaFileResult | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("crm_settings").select(CRM_SETTINGS_SELECT).eq("id", true).maybeSingle();
  const storedUrl = typeof data?.background_image_url === "string" ? data.background_image_url : null;
  const storedPath = extractCrmBackgroundPathFromMediaUrl(storedUrl) ?? extractStoragePathFromPublicUrl(storedUrl, CRM_ASSETS_BUCKET);
  if (explicitPath && storedPath && explicitPath !== storedPath) return null;

  const path = explicitPath ?? storedPath;
  if (!path) return null;

  const updatedAt = typeof data?.updated_at === "string" ? data.updated_at : "0";
  return downloadStorageObject(CRM_ASSETS_BUCKET, path, "image/jpeg", `crm-background-${updatedAt}-${path}`);
}
