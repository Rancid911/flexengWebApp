import type { createClient } from "@/lib/supabase/server";

export type TeacherNotesRepositoryClient = Awaited<ReturnType<typeof createClient>>;

const NOTE_SELECT = "id, student_id, teacher_id, body, visibility, created_by_profile_id, created_at, updated_at";

export function createTeacherNotesRepository(client: TeacherNotesRepositoryClient) {
  return {
    async loadProfiles(profileIds: string[]) {
      if (profileIds.length === 0) return { data: [], error: null };
      return await client.rpc("get_accessible_profile_labels", { p_profile_ids: profileIds });
    },

    async createNote(input: {
      studentId: string;
      teacherId: string;
      body: string;
      visibility: "private" | "manager_visible";
      actorProfileId: string;
    }) {
      return await client
        .from("teacher_student_notes")
        .insert({
          student_id: input.studentId,
          teacher_id: input.teacherId,
          body: input.body,
          visibility: input.visibility,
          created_by_profile_id: input.actorProfileId,
          updated_by_profile_id: input.actorProfileId
        })
        .select(NOTE_SELECT)
        .single();
    },

    async loadNote(noteId: string) {
      return await client.from("teacher_student_notes").select(NOTE_SELECT).eq("id", noteId).maybeSingle();
    },

    async updateNote(noteId: string, input: { body: string; visibility: "private" | "manager_visible"; actorProfileId: string }) {
      return await client
        .from("teacher_student_notes")
        .update({
          body: input.body,
          visibility: input.visibility,
          updated_by_profile_id: input.actorProfileId
        })
        .eq("id", noteId)
        .select(NOTE_SELECT)
        .single();
    },

    async deleteNote(noteId: string) {
      return await client.from("teacher_student_notes").delete().eq("id", noteId);
    }
  };
}
