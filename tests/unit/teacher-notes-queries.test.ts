import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTeacherStudentNote, deleteTeacherStudentNote, getTeacherStudentNotesFeed, updateTeacherStudentNote } from "@/lib/teacher-workspace/queries";

const { assertTeacherScopeMock, insertMock, updateMock, deleteMock, state } = vi.hoisted(() => ({
  assertTeacherScopeMock: vi.fn(),
  insertMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
  state: {
    studentPrimaryTeacherId: "teacher-primary" as string | null,
    noteExists: true,
    noteRows: [
      {
        id: "note-1",
        student_id: "student-1",
        teacher_id: "teacher-1",
        body: "Existing note",
        visibility: "private",
        created_by_profile_id: "author-1",
        created_at: "2026-04-21T10:00:00.000Z",
        updated_at: "2026-04-21T10:00:00.000Z"
      }
    ],
    profiles: new Map([
      ["student-profile-1", { id: "student-profile-1", display_name: "Student One", first_name: null, last_name: null, email: "student@example.com", phone: null, role: "student" }],
      ["author-1", { id: "author-1", display_name: "Автор Заметки", first_name: null, last_name: null, email: "author@example.com", phone: null, role: "manager" }],
      ["teacher-user-1", { id: "teacher-user-1", display_name: "Мария Teacher", first_name: null, last_name: null, email: "teacher@example.com", phone: null, role: "teacher" }],
      ["admin-user-1", { id: "admin-user-1", display_name: "Анна Admin", first_name: null, last_name: null, email: "admin@example.com", phone: null, role: "admin" }]
    ])
  }
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

vi.mock("@/lib/schedule/server", () => ({
  assertScheduleWriteAccess: vi.fn(),
  assertStaffAdminCapability: (actor: { role: string }) => {
    if (actor.role !== "admin" && actor.role !== "manager") throw new Error("not staff");
  },
  assertTeacherCapability: (actor: { role: string }) => {
    if (actor.role !== "teacher") throw new Error("not teacher");
  },
  assertTeacherScope: (...args: unknown[]) => assertTeacherScopeMock(...args),
  isStaffAdminScheduleActor: (actor: { role: string }) => actor.role === "admin" || actor.role === "manager",
  isTeacherScheduleActor: (actor: { role: string }) => actor.role === "teacher"
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "students") return makeStudentsQuery();
      if (table === "profiles") return makeProfilesQuery();
      if (table === "teacher_student_notes") return makeNotesQuery();
      throw new Error(`Unexpected table ${table}`);
    }
  })
}));

function makeStudentsQuery() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({
      data: {
        id: "student-1",
        profile_id: "student-profile-1",
        primary_teacher_id: state.studentPrimaryTeacherId,
        english_level: "A2",
        target_level: "B1",
        learning_goal: null
      },
      error: null
    }))
  };
}

function makeProfilesQuery() {
  return {
    select: vi.fn().mockReturnThis(),
    in: vi.fn(async (_column: string, ids: string[]) => ({
      data: ids.map((id) => state.profiles.get(id)).filter(Boolean),
      error: null
    }))
  };
}

function makeNotesQuery() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn(async () => ({
      data: state.noteRows,
      error: null
    })),
    maybeSingle: vi.fn(async () => ({
      data: state.noteExists ? state.noteRows[0] : null,
      error: null
    })),
    insert: insertMock.mockImplementation((payload: unknown) => ({
      select: vi.fn().mockReturnThis(),
      single: vi.fn(async () => ({
        data: {
          id: "created-note",
          student_id: "student-1",
          teacher_id: (payload as { teacher_id: string }).teacher_id,
          body: (payload as { body: string }).body,
          visibility: "private",
          created_by_profile_id: (payload as { created_by_profile_id: string }).created_by_profile_id,
          created_at: "2026-04-21T11:00:00.000Z",
          updated_at: "2026-04-21T11:00:00.000Z"
        },
        error: null
      }))
    })),
    update: updateMock.mockImplementation((payload: unknown) => ({
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(async () => ({
        data: {
          ...state.noteRows[0],
          body: (payload as { body: string }).body,
          visibility: (payload as { visibility: string }).visibility,
          updated_at: "2026-04-21T12:00:00.000Z"
        },
        error: null
      }))
    })),
    delete: deleteMock.mockImplementation(() => ({
      eq: vi.fn(async () => ({
        data: null,
        error: null
      }))
    }))
  };
}

describe("teacher note queries", () => {
  beforeEach(() => {
    insertMock.mockClear();
    updateMock.mockClear();
    deleteMock.mockClear();
    assertTeacherScopeMock.mockClear();
    state.studentPrimaryTeacherId = "teacher-primary";
    state.noteExists = true;
  });

  it("loads notes with author names", async () => {
    const notes = await getTeacherStudentNotesFeed({ role: "teacher", userId: "teacher-user-1", teacherId: "teacher-1", studentId: null, accessibleStudentIds: null }, "student-1");

    expect(notes[0]).toEqual(expect.objectContaining({
      body: "Existing note",
      createdByProfileId: "author-1",
      createdByName: "Автор Заметки",
      createdByRole: "manager"
    }));
  });

  it("creates teacher notes with actor teacher id", async () => {
    const note = await createTeacherStudentNote(
      { role: "teacher", userId: "teacher-user-1", teacherId: "teacher-1", studentId: null, accessibleStudentIds: null },
      "student-1",
      { body: "Teacher note" }
    );

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      teacher_id: "teacher-1",
      created_by_profile_id: "teacher-user-1"
    }));
    expect(note.createdByName).toBe("Мария Teacher");
    expect(note.createdByRole).toBe("teacher");
  });

  it("creates admin notes with student's primary teacher id", async () => {
    const note = await createTeacherStudentNote(
      { role: "admin", userId: "admin-user-1", teacherId: null, studentId: null, accessibleStudentIds: null },
      "student-1",
      { body: "Admin note" }
    );

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      teacher_id: "teacher-primary",
      created_by_profile_id: "admin-user-1"
    }));
    expect(note.createdByName).toBe("Анна Admin");
    expect(note.createdByRole).toBe("admin");
  });

  it("rejects admin note creation when student has no primary teacher", async () => {
    state.studentPrimaryTeacherId = null;

    await expect(
      createTeacherStudentNote(
        { role: "manager", userId: "admin-user-1", teacherId: null, studentId: null, accessibleStudentIds: null },
        "student-1",
        { body: "Admin note" }
      )
    ).rejects.toMatchObject({
      message: "Сначала назначьте ученику преподавателя"
    });
  });

  it("allows admin to update teacher notes", async () => {
    const note = await updateTeacherStudentNote(
      { role: "admin", userId: "admin-user-1", teacherId: null, studentId: null, accessibleStudentIds: null },
      "note-1",
      { body: "Updated by admin", visibility: "manager_visible" }
    );

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      body: "Updated by admin",
      visibility: "manager_visible",
      updated_by_profile_id: "admin-user-1"
    }));
    expect(note.body).toBe("Updated by admin");
    expect(note.createdByRole).toBe("manager");
  });

  it("allows admin to delete teacher notes", async () => {
    const result = await deleteTeacherStudentNote(
      { role: "admin", userId: "admin-user-1", teacherId: null, studentId: null, accessibleStudentIds: null },
      "note-1"
    );

    expect(deleteMock).toHaveBeenCalled();
    expect(result).toEqual({ id: "note-1" });
  });

  it("checks teacher scope before deleting teacher notes", async () => {
    await deleteTeacherStudentNote(
      { role: "teacher", userId: "teacher-user-1", teacherId: "teacher-1", studentId: null, accessibleStudentIds: ["student-1"] },
      "note-1"
    );

    expect(assertTeacherScopeMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "teacher", teacherId: "teacher-1" }),
      { studentId: "student-1", teacherId: "teacher-1" }
    );
    expect(deleteMock).toHaveBeenCalled();
  });

  it("returns not found when deleting a missing note", async () => {
    state.noteExists = false;

    await expect(
      deleteTeacherStudentNote(
        { role: "admin", userId: "admin-user-1", teacherId: null, studentId: null, accessibleStudentIds: null },
        "missing-note"
      )
    ).rejects.toMatchObject({
      code: "TEACHER_NOTE_NOT_FOUND"
    });
  });
});
