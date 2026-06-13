import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTeacherStudentNote, deleteTeacherStudentNote, getTeacherStudentNotesFeed, updateTeacherStudentNote } from "@/lib/teacher-workspace/queries";
import { createScheduleActor } from "@/tests/unit/helpers/actors";

const { assertTeacherScopeMock, createClientMock, insertMock, updateMock, deleteMock, profileLabelsRpcMock, state } = vi.hoisted(() => ({
  assertTeacherScopeMock: vi.fn(),
  createClientMock: vi.fn(),
  insertMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
  profileLabelsRpcMock: vi.fn(),
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

const teacherActor = (overrides = {}) =>
  createScheduleActor({ role: "teacher", userId: "teacher-user-1", teacherId: "teacher-1", studentId: null, accessibleStudentIds: ["student-1"], ...overrides });
const adminActor = (overrides = {}) => createScheduleActor({ role: "admin", userId: "admin-user-1", teacherId: null, studentId: null, accessibleStudentIds: null, ...overrides });
const managerActor = (overrides = {}) => createScheduleActor({ role: "manager", userId: "admin-user-1", teacherId: null, studentId: null, accessibleStudentIds: null, ...overrides });

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
  assertTeacherScope: (actor: { role: string; teacherId?: string | null; accessibleStudentIds?: string[] | null }, input: { studentId?: string | null; teacherId?: string | null }) => {
    assertTeacherScopeMock(actor, input);
    if (actor.role !== "teacher") return;
    if (!actor.teacherId) {
      throw Object.assign(new Error("Teacher profile is not linked"), { status: 403, code: "FORBIDDEN" });
    }
    if (!Array.isArray(actor.accessibleStudentIds)) {
      throw Object.assign(new Error("Teacher scope is not loaded"), { status: 403, code: "FORBIDDEN" });
    }
    if (input.teacherId && input.teacherId !== actor.teacherId) {
      throw Object.assign(new Error("Teachers can only plan lessons for themselves"), { status: 403, code: "FORBIDDEN" });
    }
    if (input.studentId && !actor.accessibleStudentIds.includes(input.studentId)) {
      throw Object.assign(new Error("Student is outside the teacher scope"), { status: 403, code: "FORBIDDEN" });
    }
  },
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

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
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
    createClientMock.mockReset();
    insertMock.mockClear();
    updateMock.mockClear();
    deleteMock.mockClear();
    profileLabelsRpcMock.mockReset();
    assertTeacherScopeMock.mockClear();
    state.studentPrimaryTeacherId = "teacher-primary";
    state.noteExists = true;
    profileLabelsRpcMock.mockImplementation(async (_fn: string, args: { p_profile_ids: string[] }) => ({
      data: args.p_profile_ids
        .map((id) => state.profiles.get(id))
        .filter(Boolean)
        .map((profile) => ({
          profile_id: profile?.id,
          display_name: profile?.display_name,
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          role: profile?.role
        })),
      error: null
    }));
    createClientMock.mockResolvedValue({
      from: (table: string) => {
        if (table === "students") return makeStudentsQuery();
        if (table === "teacher_student_notes") return makeNotesQuery();
        throw new Error(`Unexpected user-scoped table ${table}`);
      },
      rpc: profileLabelsRpcMock
    });
  });

  it("loads notes with author names", async () => {
    const notes = await getTeacherStudentNotesFeed(teacherActor({ accessibleStudentIds: null }), "student-1");

    expect(notes[0]).toEqual(expect.objectContaining({
      body: "Existing note",
      createdByProfileId: "author-1",
      createdByName: "Автор Заметки",
      createdByRole: "manager"
    }));
  });

  it("creates teacher notes with actor teacher id", async () => {
    const note = await createTeacherStudentNote(
      teacherActor(),
      "student-1",
      { body: "Teacher note" }
    );

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      teacher_id: "teacher-1",
      created_by_profile_id: "teacher-user-1"
    }));
    expect(note.createdByName).toBe("Мария Teacher");
    expect(note.createdByRole).toBe("teacher");
    expect(profileLabelsRpcMock).toHaveBeenCalledWith("get_accessible_profile_labels", {
      p_profile_ids: ["teacher-user-1"]
    });
  });

  it("creates admin notes with student's primary teacher id", async () => {
    const note = await createTeacherStudentNote(
      adminActor(),
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
        managerActor(),
        "student-1",
        { body: "Admin note" }
      )
    ).rejects.toMatchObject({
      message: "Сначала назначьте ученику преподавателя"
    });
  });

  it("allows admin to update teacher notes", async () => {
    const note = await updateTeacherStudentNote(
      adminActor(),
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
      adminActor(),
      "note-1"
    );

    expect(deleteMock).toHaveBeenCalled();
    expect(result).toEqual({ id: "note-1" });
  });

  it("checks teacher scope before deleting teacher notes", async () => {
    await deleteTeacherStudentNote(
      teacherActor(),
      "note-1"
    );

    expect(assertTeacherScopeMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "teacher", teacherId: "teacher-1" }),
      { studentId: "student-1", teacherId: "teacher-1" }
    );
    expect(deleteMock).toHaveBeenCalled();
  });

  it("denies teacher note update for students outside teacher scope before write", async () => {
    await expect(
      updateTeacherStudentNote(
        teacherActor({ accessibleStudentIds: ["student-2"] }),
        "note-1",
        { body: "Out of scope", visibility: "private" }
      )
    ).rejects.toMatchObject({
      code: "FORBIDDEN"
    });

    expect(assertTeacherScopeMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "teacher", teacherId: "teacher-1" }),
      { studentId: "student-1", teacherId: "teacher-1" }
    );
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("denies teacher note delete when teacher scope is missing before write", async () => {
    await expect(
      deleteTeacherStudentNote(
        teacherActor({ accessibleStudentIds: null }),
        "note-1"
      )
    ).rejects.toMatchObject({
      code: "FORBIDDEN"
    });

    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("denies teacher note delete when teacher scope is malformed before write", async () => {
    await expect(
      deleteTeacherStudentNote(
        teacherActor({ accessibleStudentIds: "student-1" as never }),
        "note-1"
      )
    ).rejects.toMatchObject({
      code: "FORBIDDEN"
    });

    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("returns not found when deleting a missing note", async () => {
    state.noteExists = false;

    await expect(
      deleteTeacherStudentNote(
        adminActor(),
        "missing-note"
      )
    ).rejects.toMatchObject({
      code: "TEACHER_NOTE_NOT_FOUND"
    });
  });
});
