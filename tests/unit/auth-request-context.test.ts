import { describe, expect, it } from "vitest";

import { buildAppActor, resolveDefaultWorkspace } from "@/lib/auth/request-context";
import { resolveScheduleActor } from "@/lib/schedule/server";

describe("app actor resolution", () => {
  it("builds student capability from linked student row", () => {
    const actor = buildAppActor(
      {
        userId: "user-1",
        email: "student@example.com",
        displayName: "Student",
        avatarUrl: null,
        role: "student",
        profileRole: "student"
      },
      {
        studentId: "student-1",
        teacherId: null,
        accessibleStudentIds: null
      }
    );

    expect(actor.capabilities).toContain("student");
    expect(actor.isStudent).toBe(true);
    expect(actor.isTeacher).toBe(false);
    expect(actor.isStaffAdmin).toBe(false);
  });

  it("builds dual-role capability from linked teacher and student rows", () => {
    const actor = buildAppActor(
      {
        userId: "user-2",
        email: "dual@example.com",
        displayName: "Dual",
        avatarUrl: null,
        role: "student",
        profileRole: "student"
      },
      {
        studentId: "student-2",
        teacherId: "teacher-2",
        accessibleStudentIds: ["student-2", "student-3"]
      }
    );

    expect(actor.capabilities.sort()).toEqual(["student", "teacher"]);
    expect(actor.isStudent).toBe(true);
    expect(actor.isTeacher).toBe(true);
    expect(resolveDefaultWorkspace(actor)).toBe("teacher");
  });

  it("treats manager as staff-admin capability", () => {
    const actor = buildAppActor(
      {
        userId: "user-3",
        email: "manager@example.com",
        displayName: "Manager",
        avatarUrl: null,
        role: "manager",
        profileRole: "manager"
      },
      {
        studentId: null,
        teacherId: null,
        accessibleStudentIds: null
      }
    );

    expect(actor.capabilities).toContain("staff_admin");
    expect(actor.isStaffAdmin).toBe(true);
    expect(resolveDefaultWorkspace(actor)).toBe("manager");
  });

  it("does not infer student or teacher capability from profileRole without linked rows", () => {
    const actor = buildAppActor(
      {
        userId: "user-legacy",
        email: "legacy@example.com",
        displayName: "Legacy",
        avatarUrl: null,
        role: "teacher",
        profileRole: "teacher"
      },
      {
        studentId: null,
        teacherId: null,
        accessibleStudentIds: []
      }
    );

    expect(actor.capabilities).toEqual([]);
    expect(actor.isStudent).toBe(false);
    expect(actor.isTeacher).toBe(false);
    expect(resolveDefaultWorkspace(actor)).toBe("teacher");
  });

  it("prefers admin workspace over teacher and student", () => {
    const actor = buildAppActor(
      {
        userId: "user-4",
        email: "admin@example.com",
        displayName: "Admin",
        avatarUrl: null,
        role: "admin",
        profileRole: "admin"
      },
      {
        studentId: "student-4",
        teacherId: "teacher-4",
        accessibleStudentIds: ["student-4"]
      }
    );

    expect(resolveDefaultWorkspace(actor)).toBe("admin");
  });
});

describe("schedule actor resolution", () => {
  it("keeps teacher profile linkage failure explicit", async () => {
    const actor = buildAppActor(
      {
        userId: "user-5",
        email: "teacher@example.com",
        displayName: "Teacher",
        avatarUrl: null,
        role: "teacher",
        profileRole: "teacher"
      },
      {
        studentId: null,
        teacherId: null,
        accessibleStudentIds: []
      }
    );

    await expect(resolveScheduleActor(actor)).rejects.toMatchObject({
      message: "Teacher profile is not linked"
    });
  });
});
