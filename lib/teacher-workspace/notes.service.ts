import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";
import { ScheduleHttpError } from "@/lib/schedule/http";
import {
  assertScheduleWriteAccess,
  assertTeacherScope,
  isTeacherScheduleActor,
  type ScheduleActor
} from "@/lib/schedule/server";
import type { AccessMode } from "@/lib/supabase/access";
import { createClient } from "@/lib/supabase/server";
import { assertTeacherStudentNotesWriteAccess } from "@/lib/teacher-workspace/access";
import {
  createTeacherNotesRepository,
  type TeacherNotesRepositoryClient
} from "@/lib/teacher-workspace/notes.repository";
import {
  buildDisplayName,
  type TeacherStudentNoteRow,
  type TeacherStudentProfileRow
} from "@/lib/teacher-workspace/student-profile.mappers";
import {
  getTeacherStudentNotesFeed,
  loadTeacherStudentCore,
  TEACHER_STUDENT_NOTES_DATA_LOADING
} from "@/lib/teacher-workspace/student-profile.queries";
import type {
  TeacherNoteMutationPayload,
  TeacherStudentNoteDto
} from "@/lib/teacher-workspace/types";

const TEACHER_NOTES_MUTATION_ACCESS_MODE: AccessMode = "privileged";

export const TEACHER_NOTES_MUTATION_DATA_LOADING = defineDataLoadingDescriptor({
  id: "teacher-notes-mutation",
  owner: "@/lib/teacher-workspace/queries#createTeacherStudentNote",
  accessMode: TEACHER_NOTES_MUTATION_ACCESS_MODE,
  loadLevel: "client_interaction",
  shape: "detail",
  issues: [],
  notes: ["Teacher-scoped note creation/update interaction."]
});

export { getTeacherStudentNotesFeed, TEACHER_STUDENT_NOTES_DATA_LOADING };

type TeacherProfileLabelRow = TeacherStudentProfileRow & {
  profile_id?: string | null;
};

function mapProfiles(rows: TeacherProfileLabelRow[]) {
  return new Map(rows.map((profile) => [profile.id ?? profile.profile_id, profile]).filter((entry): entry is [string, TeacherProfileLabelRow] => Boolean(entry[0])));
}

function mapNoteDto(row: TeacherStudentNoteRow, author: TeacherStudentProfileRow | null | undefined): TeacherStudentNoteDto {
  return {
    id: row.id,
    studentId: row.student_id,
    teacherId: row.teacher_id,
    body: row.body,
    visibility: row.visibility,
    createdByProfileId: row.created_by_profile_id,
    createdByName: author ? buildDisplayName(author, "Пользователь") : null,
    createdByRole: author?.role ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function loadAuthor(profileId: string | null, repository: ReturnType<typeof createTeacherNotesRepository>) {
  const response = await repository.loadProfiles(profileId ? [profileId] : []);
  if (response.error) {
    throw new ScheduleHttpError(500, "PROFILE_FETCH_FAILED", "Failed to load profiles", response.error.message);
  }

  return profileId ? mapProfiles((response.data ?? []) as TeacherProfileLabelRow[]).get(profileId) ?? null : null;
}

async function createNotesRepository(client?: TeacherNotesRepositoryClient) {
  return createTeacherNotesRepository(client ?? (await createClient()));
}

export async function createTeacherStudentNote(actor: ScheduleActor, studentId: string, payload: TeacherNoteMutationPayload) {
  assertScheduleWriteAccess(actor);
  assertTeacherStudentNotesWriteAccess(actor);
  if (isTeacherScheduleActor(actor)) {
    assertTeacherScope(actor, { studentId, teacherId: actor.teacherId });
  }

  const { student } = await loadTeacherStudentCore(actor, studentId);
  const teacherId = isTeacherScheduleActor(actor) ? actor.teacherId : student.primary_teacher_id;
  if (!teacherId) {
    throw new ScheduleHttpError(400, "TEACHER_REQUIRED", "Сначала назначьте ученику преподавателя");
  }

  const repository = await createNotesRepository();
  const response = await repository.createNote({
    studentId,
    teacherId,
    body: payload.body.trim(),
    visibility: payload.visibility ?? "private",
    actorProfileId: actor.userId
  });

  if (response.error) {
    throw new ScheduleHttpError(500, "TEACHER_NOTE_SAVE_FAILED", "Failed to create teacher note", response.error.message);
  }

  const row = response.data as TeacherStudentNoteRow;
  const author = await loadAuthor(actor.userId, repository);
  return mapNoteDto(row, author);
}

export async function updateTeacherStudentNote(actor: ScheduleActor, noteId: string, payload: TeacherNoteMutationPayload) {
  assertScheduleWriteAccess(actor);
  assertTeacherStudentNotesWriteAccess(actor);
  const repository = await createNotesRepository();
  const existingResponse = await repository.loadNote(noteId);

  if (existingResponse.error) {
    throw new ScheduleHttpError(500, "TEACHER_NOTE_FETCH_FAILED", "Failed to load teacher note", existingResponse.error.message);
  }
  if (!existingResponse.data) {
    throw new ScheduleHttpError(404, "TEACHER_NOTE_NOT_FOUND", "Teacher note not found");
  }

  const existing = existingResponse.data as TeacherStudentNoteRow;
  if (isTeacherScheduleActor(actor)) {
    assertTeacherScope(actor, {
      studentId: existing.student_id,
      teacherId: existing.teacher_id
    });
  }

  const response = await repository.updateNote(noteId, {
    body: payload.body.trim(),
    visibility: payload.visibility ?? existing.visibility,
    actorProfileId: actor.userId
  });

  if (response.error) {
    throw new ScheduleHttpError(500, "TEACHER_NOTE_SAVE_FAILED", "Failed to update teacher note", response.error.message);
  }

  const row = response.data as TeacherStudentNoteRow;
  const author = await loadAuthor(row.created_by_profile_id, repository);
  return mapNoteDto(row, author);
}

export async function deleteTeacherStudentNote(actor: ScheduleActor, noteId: string) {
  assertScheduleWriteAccess(actor);
  assertTeacherStudentNotesWriteAccess(actor);
  const repository = await createNotesRepository();
  const existingResponse = await repository.loadNote(noteId);

  if (existingResponse.error) {
    throw new ScheduleHttpError(500, "TEACHER_NOTE_FETCH_FAILED", "Failed to load teacher note", existingResponse.error.message);
  }
  if (!existingResponse.data) {
    throw new ScheduleHttpError(404, "TEACHER_NOTE_NOT_FOUND", "Teacher note not found");
  }

  const existing = existingResponse.data as TeacherStudentNoteRow;
  if (isTeacherScheduleActor(actor)) {
    assertTeacherScope(actor, {
      studentId: existing.student_id,
      teacherId: existing.teacher_id
    });
  }

  const response = await repository.deleteNote(noteId);
  if (response.error) {
    throw new ScheduleHttpError(500, "TEACHER_NOTE_DELETE_FAILED", "Failed to delete teacher note", response.error.message);
  }

  return { id: noteId };
}
