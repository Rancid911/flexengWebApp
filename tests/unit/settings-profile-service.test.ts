import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAppActor } from "@/tests/unit/helpers/actors";

const createClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
}));

vi.mock("@/lib/supabase/auth-request", () => ({
  runAuthRequestWithLockRetry: async (callback: () => Promise<unknown>) => await callback()
}));

function createSettingsClientMock(params: {
  userId: string;
  email: string;
  birthDateUpdateError?: { message: string } | null;
  profileBirthDate?: string | null;
}) {
  const profileUpdateResponses = [
    { error: null },
    { error: params.birthDateUpdateError ?? null }
  ];
  const profileSelectResponses = [
    {
      data: {
        first_name: "Teacher",
        last_name: "One",
        phone: "+79990000000",
        avatar_url: null,
        role: "teacher",
        email: params.email,
        birth_date: params.profileBirthDate ?? "1980-01-01"
      },
      error: null
    }
  ];

  const profileBuilder = {
    select: vi.fn(() => profileBuilder),
    update: vi.fn(() => profileBuilder),
    eq: vi.fn(() => {
      if (profileUpdateResponses.length > 0) {
        return Promise.resolve(profileUpdateResponses.shift());
      }
      return profileBuilder;
    }),
    maybeSingle: vi.fn(() => Promise.resolve(profileSelectResponses.shift()))
  };

  const studentsBuilder = {
    upsert: vi.fn(() => Promise.resolve({ error: null })),
    update: vi.fn(() => studentsBuilder),
    eq: vi.fn(() => Promise.resolve({ error: null })),
    select: vi.fn(() => studentsBuilder),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
  };

  const client = {
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: {
            user: {
              id: params.userId,
              email: params.email
            }
          },
          error: null
        })
      )
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") return profileBuilder;
      if (table === "students") return studentsBuilder;
      throw new Error(`Unexpected table: ${table}`);
    }),
    storage: {
      from: vi.fn()
    }
  };

  return {
    client,
    profileBuilder,
    studentsBuilder
  };
}

describe("settings profile service teacher preview boundary", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
  });

  it("does not create or update student rows for teacher-primary profile birth date fallback", async () => {
    const { client, studentsBuilder } = createSettingsClientMock({
      userId: "teacher-profile-1",
      email: "teacher@example.com",
      birthDateUpdateError: { message: "column profiles.birth_date does not exist" }
    });
    createClientMock.mockResolvedValue(client);

    const { updateSettingsProfile } = await import("@/lib/settings/profile.service");
    await updateSettingsProfile(
      createAppActor({
        userId: "teacher-profile-1",
        email: "teacher@example.com",
        displayName: "Teacher One",
        profileRole: "teacher",
        role: "teacher",
        capabilities: ["teacher"],
        isStudent: false,
        isTeacher: true,
        isStaffAdmin: false,
        studentId: "student-preview-1",
        teacherId: "teacher-1",
        accessibleStudentIds: ["student-1"]
      }),
      {
        firstName: "Teacher",
        lastName: "One",
        phone: "+79990000000",
        birthDate: "1980-01-01",
        email: "teacher@example.com",
        currentPassword: "",
        nextPassword: "",
        profileDirty: true,
        emailDirty: false,
        passwordDirty: false,
        avatarDelete: false,
        avatarFile: null
      }
    );

    expect(client.from).not.toHaveBeenCalledWith("students");
    expect(studentsBuilder.upsert).not.toHaveBeenCalled();
    expect(studentsBuilder.update).not.toHaveBeenCalled();
  });

  it("keeps the student birth date fallback for confirmed real students", async () => {
    const { client, studentsBuilder } = createSettingsClientMock({
      userId: "student-profile-1",
      email: "student@example.com",
      birthDateUpdateError: { message: "column profiles.birth_date does not exist" }
    });
    createClientMock.mockResolvedValue(client);

    const { updateSettingsProfile } = await import("@/lib/settings/profile.service");
    await updateSettingsProfile(
      createAppActor({
        userId: "student-profile-1",
        email: "student@example.com",
        displayName: "Student One",
        profileRole: "student",
        role: "student",
        capabilities: ["student"],
        isStudent: true,
        isTeacher: false,
        isStaffAdmin: false,
        studentId: "student-1",
        teacherId: null,
        accessibleStudentIds: null
      }),
      {
        firstName: "Student",
        lastName: "One",
        phone: "+79990000001",
        birthDate: "2010-01-01",
        email: "student@example.com",
        currentPassword: "",
        nextPassword: "",
        profileDirty: true,
        emailDirty: false,
        passwordDirty: false,
        avatarDelete: false,
        avatarFile: null
      }
    );

    expect(client.from).toHaveBeenCalledWith("students");
    expect(studentsBuilder.upsert).toHaveBeenCalledWith(
      { profile_id: "student-profile-1", birth_date: "2010-01-01" },
      { onConflict: "profile_id" }
    );
  });
});
