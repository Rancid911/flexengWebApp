import type { createClient } from "@/lib/supabase/server";

export type SettingsProfileRepositoryClient = Awaited<ReturnType<typeof createClient>>;

export type SettingsProfileRow = {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string | null;
  email?: string | null;
  birth_date?: string | null;
};

export function createSettingsProfileRepository(client: SettingsProfileRepositoryClient) {
  return {
    loadProfileWithBirthDate(userId: string) {
      return client
        .from("profiles")
        .select("first_name, last_name, phone, avatar_url, role, email, birth_date")
        .eq("id", userId)
        .maybeSingle();
    },

    loadProfileWithoutBirthDate(userId: string) {
      return client
        .from("profiles")
        .select("first_name, last_name, phone, avatar_url, role, email")
        .eq("id", userId)
        .maybeSingle();
    },

    loadStudentBirthDate(userId: string) {
      return client.from("students").select("birth_date").eq("profile_id", userId).maybeSingle();
    },

    updateProfileFields(
      userId: string,
      payload: {
        first_name: string;
        last_name: string;
        display_name: string;
        phone: string;
      }
    ) {
      return client.from("profiles").update(payload).eq("id", userId);
    },

    updateProfileBirthDate(userId: string, birthDate: string | null) {
      return client.from("profiles").update({ birth_date: birthDate }).eq("id", userId);
    },

    upsertStudentBirthDate(userId: string, birthDate: string) {
      return client
        .from("students")
        .upsert({ profile_id: userId, birth_date: birthDate }, { onConflict: "profile_id" });
    },

    clearStudentBirthDate(userId: string) {
      return client.from("students").update({ birth_date: null }).eq("profile_id", userId);
    },

    updateProfileEmail(userId: string, email: string) {
      return client.from("profiles").update({ email }).eq("id", userId);
    },

    updateProfileAvatarUrl(userId: string, avatarUrl: string | null) {
      return client.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId);
    }
  };
}
