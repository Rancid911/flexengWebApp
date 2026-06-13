import { describe, expect, it } from "vitest";

import {
  assertScheduleWriteAccess,
  assertStaffAdminCapability,
  assertTeacherScope,
  type ScheduleActor
} from "@/lib/schedule/server";
import {
  assertTeacherStudentNotesWriteAccess,
  assertTeacherWorkspaceWriteAccess,
  canManageTeacherStudentBilling,
  canReadTeacherWorkspace,
  canWriteTeacherWorkspaceNotes
} from "@/lib/teacher-workspace/access";

function actor(overrides: Partial<ScheduleActor>): ScheduleActor {
  return {
    userId: "user-1",
    role: "student",
    accessMode: "student_own",
    studentId: "student-1",
    teacherId: null,
    accessibleStudentIds: null,
    ...overrides
  };
}

describe("security boundary matrix", () => {
  it("keeps schedule writes staff/teacher-only and blocks students", () => {
    expect(() => assertScheduleWriteAccess(actor({ role: "admin", accessMode: "staff_all", studentId: null }))).not.toThrow();
    expect(() => assertScheduleWriteAccess(actor({ role: "manager", accessMode: "staff_all", studentId: null }))).not.toThrow();
    expect(() =>
      assertScheduleWriteAccess(
        actor({ role: "teacher", accessMode: "teacher_assigned", studentId: null, teacherId: "teacher-1", accessibleStudentIds: ["student-1"] })
      )
    ).not.toThrow();
    expect(() => assertScheduleWriteAccess(actor({ role: "student", accessMode: "student_own" }))).toThrow("Students cannot manage schedule lessons");
  });

  it("keeps teacher scope limited to assigned students and own teacher id", () => {
    const teacher = actor({ role: "teacher", accessMode: "teacher_assigned", studentId: null, teacherId: "teacher-1", accessibleStudentIds: ["student-1"] });

    expect(() => assertTeacherScope(teacher, { studentId: "student-1", teacherId: "teacher-1" })).not.toThrow();
    expect(() => assertTeacherScope(teacher, { studentId: "student-2", teacherId: "teacher-1" })).toThrow("Student is outside the teacher scope");
    expect(() => assertTeacherScope(teacher, { studentId: "student-1", teacherId: "teacher-2" })).toThrow("Teachers can only plan lessons for themselves");
  });

  it("keeps staff capabilities separate from teacher workspace writes", () => {
    expect(() => assertStaffAdminCapability(actor({ role: "admin", accessMode: "staff_all", studentId: null }))).not.toThrow();
    expect(() => assertStaffAdminCapability(actor({ role: "manager", accessMode: "staff_all", studentId: null }))).not.toThrow();
    expect(() => assertStaffAdminCapability(actor({ role: "teacher", accessMode: "teacher_assigned", studentId: null, teacherId: "teacher-1" }))).toThrow("Staff access required");

    expect(canReadTeacherWorkspace(actor({ role: "admin", accessMode: "staff_all", studentId: null }))).toBe(true);
    expect(canReadTeacherWorkspace(actor({ role: "teacher", accessMode: "teacher_assigned", studentId: null, teacherId: "teacher-1" }))).toBe(true);
    expect(canReadTeacherWorkspace(actor({ role: "student", accessMode: "student_own" }))).toBe(false);
  });

  it("keeps teacher notes and billing permissions explicit", () => {
    const teacher = actor({ role: "teacher", accessMode: "teacher_assigned", studentId: null, teacherId: "teacher-1", accessibleStudentIds: ["student-1"] });
    const admin = actor({ role: "admin", accessMode: "staff_all", studentId: null });
    const student = actor({ role: "student", accessMode: "student_own" });

    expect(canWriteTeacherWorkspaceNotes(teacher, "student-1")).toBe(true);
    expect(canWriteTeacherWorkspaceNotes(teacher, "student-2")).toBe(false);
    expect(() => assertTeacherWorkspaceWriteAccess(teacher)).not.toThrow();
    expect(() => assertTeacherStudentNotesWriteAccess(admin)).not.toThrow();
    expect(() => assertTeacherStudentNotesWriteAccess(student)).toThrow("Teacher write capability required");

    expect(canManageTeacherStudentBilling(admin)).toBe(true);
    expect(canManageTeacherStudentBilling(actor({ role: "manager", accessMode: "staff_all", studentId: null }))).toBe(true);
    expect(canManageTeacherStudentBilling(teacher)).toBe(false);
    expect(canManageTeacherStudentBilling(student)).toBe(false);
  });

  it("uses accessMode helpers instead of raw role fallback for schedule scope", () => {
    expect(() => assertStaffAdminCapability(actor({ role: "admin", accessMode: "student_own", studentId: null }))).toThrow("Staff access required");
    expect(() => assertStaffAdminCapability(actor({ role: "student", accessMode: "staff_all", studentId: "student-1" }))).not.toThrow();
    expect(() =>
      assertTeacherScope(actor({ role: "teacher", accessMode: "student_own", studentId: null, teacherId: "teacher-1", accessibleStudentIds: ["student-1"] }), {
        studentId: "student-1",
        teacherId: "teacher-1"
      })
    ).not.toThrow();
  });
});
