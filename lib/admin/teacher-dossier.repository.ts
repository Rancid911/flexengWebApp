import type { createClient } from "@/lib/supabase/server";

export type TeacherDossierRepositoryClient = Awaited<ReturnType<typeof createClient>>;

export type TeacherProfileRow = {
  id: string;
  profile_id: string;
  profiles:
    | {
        id: string;
        first_name: string | null;
        last_name: string | null;
        display_name: string | null;
        email: string | null;
        phone: string | null;
      }
    | Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
        display_name: string | null;
        email: string | null;
        phone: string | null;
      }>
    | null;
};

export function createTeacherDossierRepository(client: TeacherDossierRepositoryClient) {
  return {
    async loadTeacher(teacherId: string) {
      return await client.from("teachers").select("id").eq("id", teacherId).maybeSingle();
    },

    async loadTeacherWithProfile(teacherId: string) {
      return await client
        .from("teachers")
        .select("id, profile_id, profiles!inner(id, first_name, last_name, display_name, email, phone)")
        .eq("id", teacherId)
        .maybeSingle();
    },

    async loadDossierSnapshot(teacherId: string, select: string) {
      return await client.from("teacher_dossiers").select(select).eq("teacher_id", teacherId).maybeSingle();
    },

    async updateProfile(profileId: string, patch: Record<string, unknown>) {
      return await client.from("profiles").update(patch).eq("id", profileId);
    },

    async upsertDossier(patch: Record<string, unknown>) {
      return await client.from("teacher_dossiers").upsert(patch, { onConflict: "teacher_id" });
    }
  };
}
