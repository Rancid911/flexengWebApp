import { beforeEach, describe, expect, it, vi } from "vitest";

const getAppActorMock = vi.fn();
const createClientMock = vi.fn();

vi.mock("@/lib/auth/request-context", () => ({
  getAppActor: () => getAppActorMock()
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
}));

function makeStudentsQuery(data: unknown, error: unknown = null) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve({ data, error }))
  };
  return builder;
}

describe("getCurrentStudentProfile", () => {
  beforeEach(() => {
    getAppActorMock.mockReset();
    createClientMock.mockReset();
  });

  it("uses a user-scoped server client to resolve the current student's english level", async () => {
    const studentsQuery = makeStudentsQuery({ english_level: "B1" });
    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        expect(table).toBe("students");
        return studentsQuery;
      })
    });
    getAppActorMock.mockResolvedValue({
      userId: "user-1",
      email: "student@example.com",
      displayName: "Student Name",
      profileRole: "student",
      isStudent: true,
      studentId: "student-1"
    });

    const { getCurrentStudentProfile } = await import("@/lib/students/current-student");
    const profile = await getCurrentStudentProfile();

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(studentsQuery.select).toHaveBeenCalledWith("english_level");
    expect(studentsQuery.eq).toHaveBeenCalledWith("id", "student-1");
    expect(profile).toEqual({
      userId: "user-1",
      studentId: "student-1",
      role: "student",
      displayName: "Student Name",
      email: "student@example.com",
      englishLevel: "B1"
    });
  });

  it("does not create a Supabase client for non-student actors", async () => {
    getAppActorMock.mockResolvedValue({
      userId: "teacher-1",
      email: "teacher@example.com",
      displayName: "Teacher Name",
      profileRole: "teacher",
      isStudent: false,
      studentId: null
    });

    const { getCurrentStudentProfile } = await import("@/lib/students/current-student");
    const profile = await getCurrentStudentProfile();

    expect(profile).toBeNull();
    expect(createClientMock).not.toHaveBeenCalled();
  });
});

describe("requireRealStudentWriteContext", () => {
  it("accepts a confirmed real student actor", async () => {
    const { requireRealStudentWriteContext } = await import("@/lib/students/current-student");

    expect(
      requireRealStudentWriteContext({
        userId: "student-profile-1",
        email: "student@example.com",
        displayName: "Student",
        profileRole: "student",
        role: "student",
        capabilities: ["student"],
        isStudent: true,
        isTeacher: false,
        isStaffAdmin: false,
        studentId: "student-1",
        teacherId: null,
        accessibleStudentIds: null
      })
    ).toEqual({
      userId: "student-profile-1",
      studentId: "student-1"
    });
  });

  it("denies teacher-primary preview actors even when a preview studentId is present", async () => {
    const { requireRealStudentWriteContext } = await import("@/lib/students/current-student");

    expect(() =>
      requireRealStudentWriteContext({
        userId: "teacher-profile-1",
        email: "teacher@example.com",
        displayName: "Teacher",
        profileRole: "teacher",
        role: "teacher",
        capabilities: ["teacher"],
        isStudent: false,
        isTeacher: true,
        isStaffAdmin: false,
        studentId: "student-preview-1",
        teacherId: "teacher-1",
        accessibleStudentIds: ["student-1"]
      })
    ).toThrow("Real student write context required");
  });

  it("denies teacher-linked dual-role actors even when profileRole is student metadata", async () => {
    const { requireRealStudentWriteContext } = await import("@/lib/students/current-student");

    expect(() =>
      requireRealStudentWriteContext({
        userId: "dual-profile-1",
        email: "dual@example.com",
        displayName: "Dual Role",
        profileRole: "student",
        role: "student",
        capabilities: ["student", "teacher"],
        isStudent: true,
        isTeacher: true,
        isStaffAdmin: false,
        studentId: "student-1",
        teacherId: "teacher-1",
        accessibleStudentIds: ["student-2"]
      })
    ).toThrow("Real student write context required");
  });
});
