import type { createClient } from "@/lib/supabase/server";

export type SettingsProfileAvatarClient = Awaited<ReturnType<typeof createClient>>;

const AVATAR_BUCKET = "avatars";

function avatarPath(userId: string) {
  return `${userId}/avatar`;
}

export function createSettingsProfileAvatarGateway(client: SettingsProfileAvatarClient) {
  return {
    deleteAvatar(userId: string) {
      return client.storage.from(AVATAR_BUCKET).remove([avatarPath(userId)]);
    },

    uploadAvatar(userId: string, file: Blob) {
      return client.storage.from(AVATAR_BUCKET).upload(avatarPath(userId), file, {
        upsert: true,
        contentType: "image/png",
        cacheControl: "3600"
      });
    }
  };
}
