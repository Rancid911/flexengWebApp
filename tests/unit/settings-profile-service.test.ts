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
  authUsers?: Array<{ id: string; email: string; new_email?: string }>;
  updateUserResponse?: { data: { user: { id: string; email: string; new_email?: string } | null }; error: null };
  updateUserError?: { message: string; code?: string; status?: number } | null;
  birthDateUpdateError?: { message: string } | null;
  profileBirthDate?: string | null;
  profileFirstName?: string | null;
  profileLastName?: string | null;
  profileDisplayName?: string | null;
  profileRole?: string | null;
}) {
  const profileUpdateResponses = [
    { error: null },
    { error: params.birthDateUpdateError ?? null }
  ];
  const profileSelectResponses = [
    {
      data: {
        first_name: params.profileFirstName ?? "Teacher",
        last_name: params.profileLastName ?? "One",
        display_name: params.profileDisplayName ?? null,
        phone: "+79990000000",
        avatar_url: null,
        role: params.profileRole ?? "teacher",
        email: params.email,
        birth_date: params.profileBirthDate ?? "1980-01-01"
      },
      error: null
    }
  ];
  let profileOperation: "select" | "update" | null = null;

  const profileBuilder = {
    select: vi.fn(() => {
      profileOperation = "select";
      return profileBuilder;
    }),
    update: vi.fn(() => {
      profileOperation = "update";
      return profileBuilder;
    }),
    eq: vi.fn(() => {
      if (profileOperation === "update" && profileUpdateResponses.length > 0) {
        profileOperation = null;
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
  const authUsers = [...(params.authUsers ?? [{ id: params.userId, email: params.email }])];
  const getUser = vi.fn(() => {
    const user = authUsers.shift() ?? authUsers[authUsers.length - 1] ?? { id: params.userId, email: params.email };
    return Promise.resolve({
      data: {
        user
      },
      error: null
    });
  });
  const updateUser = vi.fn(() =>
    Promise.resolve(
      params.updateUserError
        ? { data: { user: null }, error: params.updateUserError }
        : params.updateUserResponse ?? {
            data: {
              user: {
                id: params.userId,
                email: params.email
              }
            },
            error: null
          }
    )
  );

  const client = {
    auth: {
      getUser,
      updateUser
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
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    if (originalSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    }
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

  it("overwrites self-registration display name with trimmed full name on profile save", async () => {
    const { client, profileBuilder } = createSettingsClientMock({
      userId: "student-profile-1",
      email: "rens911@example.com",
      profileFirstName: "Иван",
      profileLastName: "Петров",
      profileDisplayName: "rens911",
      profileRole: "student"
    });
    createClientMock.mockResolvedValue(client);

    const { updateSettingsProfile } = await import("@/lib/settings/profile.service");
    await updateSettingsProfile(
      createAppActor({
        userId: "student-profile-1",
        email: "rens911@example.com",
        displayName: "rens911",
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
        firstName: "  Иван  ",
        lastName: "  Петров  ",
        phone: "+79990000001",
        birthDate: "2010-01-01",
        email: "rens911@example.com",
        currentPassword: "",
        nextPassword: "",
        profileDirty: true,
        emailDirty: false,
        passwordDirty: false,
        avatarDelete: false,
        avatarFile: null
      }
    );

    expect(profileBuilder.update).toHaveBeenNthCalledWith(1, {
      first_name: "Иван",
      last_name: "Петров",
      display_name: "Иван Петров",
      phone: "+79990000001"
    });
  });

  it("rejects a noncanonical phone before writing profile fields", async () => {
    const { client, profileBuilder } = createSettingsClientMock({
      userId: "student-profile-1",
      email: "student@example.com"
    });
    createClientMock.mockResolvedValue(client);

    const { updateSettingsProfile } = await import("@/lib/settings/profile.service");
    await expect(
      updateSettingsProfile(
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
          phone: "123",
          birthDate: "",
          email: "student@example.com",
          currentPassword: "",
          nextPassword: "",
          profileDirty: true,
          emailDirty: false,
          passwordDirty: false,
          avatarDelete: false,
          avatarFile: null
        }
      )
    ).rejects.toMatchObject({ status: 400, code: "VALIDATION_ERROR" });

    expect(profileBuilder.update).not.toHaveBeenCalled();
  });

  it("passes emailRedirectTo when updating the auth email", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://app.example.com";
    const { client } = createSettingsClientMock({
      userId: "profile-1",
      email: "old@example.com",
      updateUserResponse: {
        data: {
          user: {
            id: "profile-1",
            email: "old@example.com",
            new_email: "new@example.com"
          }
        },
        error: null
      }
    });
    createClientMock.mockResolvedValue(client);

    const { updateSettingsProfile } = await import("@/lib/settings/profile.service");
    await updateSettingsProfile(
      createAppActor({
        userId: "profile-1",
        email: "old@example.com",
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
        birthDate: "",
        email: " New@Example.com ",
        currentPassword: "",
        nextPassword: "",
        profileDirty: false,
        emailDirty: true,
        passwordDirty: false,
        avatarDelete: false,
        avatarFile: null
      }
    );

    expect(client.auth.updateUser).toHaveBeenCalledWith(
      { email: "new@example.com" },
      { emailRedirectTo: "https://app.example.com/auth/confirm?next=/settings/profile" }
    );
  });

  it("preserves pending email from the first auth update response", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://app.example.com";
    const { client } = createSettingsClientMock({
      userId: "profile-1",
      email: "old@example.com",
      updateUserResponse: {
        data: {
          user: {
            id: "profile-1",
            email: "old@example.com",
            new_email: "new@example.com"
          }
        },
        error: null
      }
    });
    createClientMock.mockResolvedValue(client);

    const { updateSettingsProfile } = await import("@/lib/settings/profile.service");
    const result = await updateSettingsProfile(
      createAppActor({
        userId: "profile-1",
        email: "old@example.com",
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
        birthDate: "",
        email: "new@example.com",
        currentPassword: "",
        nextPassword: "",
        profileDirty: false,
        emailDirty: true,
        passwordDirty: false,
        avatarDelete: false,
        avatarFile: null
      }
    );

    expect(result.hasEmailPendingConfirmation).toBe(true);
    expect(result.applied.email).toBe(false);
    expect(result.profile.email).toBe("old@example.com");
    expect(result.profile.pendingEmail).toBe("new@example.com");
  });

  it("marks immediate auth email changes as applied", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://app.example.com";
    const { client } = createSettingsClientMock({
      userId: "profile-1",
      email: "old@example.com",
      authUsers: [
        { id: "profile-1", email: "old@example.com" },
        { id: "profile-1", email: "new@example.com" }
      ],
      updateUserResponse: {
        data: {
          user: {
            id: "profile-1",
            email: "new@example.com"
          }
        },
        error: null
      }
    });
    createClientMock.mockResolvedValue(client);

    const { updateSettingsProfile } = await import("@/lib/settings/profile.service");
    const result = await updateSettingsProfile(
      createAppActor({
        userId: "profile-1",
        email: "old@example.com",
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
        birthDate: "",
        email: "new@example.com",
        currentPassword: "",
        nextPassword: "",
        profileDirty: false,
        emailDirty: true,
        passwordDirty: false,
        avatarDelete: false,
        avatarFile: null
      }
    );

    expect(result.hasEmailPendingConfirmation).toBe(false);
    expect(result.applied.email).toBe(true);
    expect(result.profile.email).toBe("new@example.com");
  });

  it("maps invalid and duplicate auth email errors to email field errors", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://app.example.com";
    const invalidClient = createSettingsClientMock({
      userId: "profile-1",
      email: "old@example.com",
      updateUserError: { message: "Invalid email address", code: "email_address_invalid" }
    }).client;
    createClientMock.mockResolvedValue(invalidClient);

    const { updateSettingsProfile } = await import("@/lib/settings/profile.service");
    const actor = createAppActor({
      userId: "profile-1",
      email: "old@example.com",
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
    });
    const input = {
      firstName: "Student",
      lastName: "One",
      phone: "+79990000001",
      birthDate: "",
      email: "bad-email",
      currentPassword: "",
      nextPassword: "",
      profileDirty: false,
      emailDirty: true,
      passwordDirty: false,
      avatarDelete: false,
      avatarFile: null
    };

    await expect(updateSettingsProfile(actor, input)).rejects.toMatchObject({
      status: 400,
      code: "SETTINGS_PROFILE_UPDATE_FAILED",
      details: {
        fieldErrors: {
          email: ["Введите корректный email."]
        }
      }
    });

    const duplicateClient = createSettingsClientMock({
      userId: "profile-1",
      email: "old@example.com",
      updateUserError: { message: "User already registered", code: "email_exists" }
    }).client;
    createClientMock.mockResolvedValue(duplicateClient);

    await expect(updateSettingsProfile(actor, { ...input, email: "taken@example.com" })).rejects.toMatchObject({
      status: 400,
      code: "SETTINGS_PROFILE_UPDATE_FAILED",
      details: {
        fieldErrors: {
          email: ["Пользователь с таким email уже существует."]
        }
      }
    });
  });

  it("maps Supabase email sending failures to a safe form error", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://app.example.com";
    const providerErrorMessage = "500: Error sending email change email";
    const spamRejectionMessage =
      "gomail: could not send email 1: 550 spam message rejected. Please visit https://help.mail.ru/notspam-support/id";
    const expectedFormError = "Не удалось отправить письмо подтверждения. Проверьте настройки email-провайдера Supabase.";
    const actor = createAppActor({
      userId: "profile-1",
      email: "old@example.com",
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
    });
    const input = {
      firstName: "Student",
      lastName: "One",
      phone: "+79990000001",
      birthDate: "",
      email: "new@example.com",
      currentPassword: "",
      nextPassword: "",
      profileDirty: false,
      emailDirty: true,
      passwordDirty: false,
      avatarDelete: false,
      avatarFile: null
    };

    const providerClient = createSettingsClientMock({
      userId: "profile-1",
      email: "old@example.com",
      updateUserError: { message: providerErrorMessage, code: "unexpected_failure", status: 500 }
    }).client;
    createClientMock.mockResolvedValue(providerClient);

    const { updateSettingsProfile } = await import("@/lib/settings/profile.service");
    await expect(updateSettingsProfile(actor, input)).rejects.toMatchObject({
      status: 400,
      code: "SETTINGS_PROFILE_UPDATE_FAILED",
      message: "Email update failed",
      details: {
        formErrors: [expectedFormError]
      }
    });

    const spamClient = createSettingsClientMock({
      userId: "profile-1",
      email: "old@example.com",
      updateUserError: { message: spamRejectionMessage, code: "unexpected_failure", status: 500 }
    }).client;
    createClientMock.mockResolvedValue(spamClient);

    await expect(updateSettingsProfile(actor, input)).rejects.toMatchObject({
      status: 400,
      code: "SETTINGS_PROFILE_UPDATE_FAILED",
      message: "Email update failed",
      details: {
        formErrors: [expectedFormError]
      }
    });
  });
});
