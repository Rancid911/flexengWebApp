import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAppActor } from "@/tests/unit/helpers/actors";

const { avatarGateway, createInfrastructureMock, identityGateway, repository } =
  vi.hoisted(() => {
    const repository = {
      loadProfileWithBirthDate: vi.fn(),
      loadProfileWithoutBirthDate: vi.fn(),
      loadStudentBirthDate: vi.fn(),
      updateProfileFields: vi.fn(),
      updateProfileBirthDate: vi.fn(),
      upsertStudentBirthDate: vi.fn(),
      clearStudentBirthDate: vi.fn(),
      updateProfileEmail: vi.fn(),
      updateProfileAvatarUrl: vi.fn()
    };
    const identityGateway = {
      getCurrentUser: vi.fn(),
      updateEmail: vi.fn()
    };
    const avatarGateway = {
      deleteAvatar: vi.fn(),
      uploadAvatar: vi.fn()
    };

    return {
      avatarGateway,
      createInfrastructureMock: vi.fn(async () => ({
        avatarGateway,
        identityGateway,
        repository
      })),
      identityGateway,
      repository
    };
  });

vi.mock("@/lib/settings/profile.infrastructure", () => ({
  createSettingsProfileInfrastructure: () => createInfrastructureMock()
}));

vi.mock("@/lib/server-origin", () => ({
  getRequestOrigin: () => Promise.resolve("https://app.example.com")
}));

import {
  loadSettingsProfile,
  updateSettingsProfile
} from "@/lib/settings/profile.service";
import type { SettingsProfileUpdateInput } from "@/lib/settings/profile.types";

function ok(data: unknown = null) {
  return { data, error: null };
}

function currentUser(
  email = "student@example.com",
  extra: Record<string, unknown> = {}
) {
  return ok({
    user: {
      id: "profile-1",
      email,
      ...extra
    }
  });
}

function profileRow(overrides: Record<string, unknown> = {}) {
  return {
    first_name: "Student",
    last_name: "One",
    phone: "+79990000001",
    avatar_url: null,
    role: "student",
    email: "student@example.com",
    birth_date: "2010-01-01",
    ...overrides
  };
}

function updateInput(
  overrides: Partial<SettingsProfileUpdateInput> = {}
): SettingsProfileUpdateInput {
  return {
    firstName: "Student",
    lastName: "One",
    phone: "+79990000001",
    birthDate: "2010-01-01",
    email: "student@example.com",
    currentPassword: "",
    nextPassword: "",
    profileDirty: false,
    emailDirty: false,
    passwordDirty: false,
    avatarDelete: false,
    avatarFile: null,
    ...overrides
  };
}

function studentActor() {
  return createAppActor({
    userId: "profile-1",
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
  });
}

describe("settings profile service", () => {
  beforeEach(() => {
    createInfrastructureMock.mockClear();
    for (const method of Object.values(repository)) method.mockReset();
    for (const method of Object.values(identityGateway)) method.mockReset();
    for (const method of Object.values(avatarGateway)) method.mockReset();

    identityGateway.getCurrentUser.mockResolvedValue(currentUser());
    repository.loadProfileWithBirthDate.mockResolvedValue(ok(profileRow()));
    repository.loadStudentBirthDate.mockResolvedValue(ok(null));
    repository.updateProfileFields.mockResolvedValue(ok());
    repository.updateProfileBirthDate.mockResolvedValue(ok());
    repository.upsertStudentBirthDate.mockResolvedValue(ok());
    repository.clearStudentBirthDate.mockResolvedValue(ok());
    repository.updateProfileEmail.mockResolvedValue(ok());
    repository.updateProfileAvatarUrl.mockResolvedValue(ok());
    avatarGateway.deleteAvatar.mockResolvedValue(ok());
    avatarGateway.uploadAvatar.mockResolvedValue(ok());
  });

  it("validates the authenticated user against the actor", async () => {
    identityGateway.getCurrentUser.mockResolvedValueOnce(ok({ user: null }));
    await expect(loadSettingsProfile(studentActor())).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED"
    });

    identityGateway.getCurrentUser.mockResolvedValueOnce(
      ok({ user: { id: "other-profile", email: "student@example.com" } })
    );
    await expect(loadSettingsProfile(studentActor())).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN"
    });
  });

  it("loads the fallback profile shape and student birth date when needed", async () => {
    repository.loadProfileWithBirthDate.mockResolvedValue({
      data: null,
      error: { message: "column profiles.birth_date does not exist" }
    });
    repository.loadProfileWithoutBirthDate.mockResolvedValue(
      ok(profileRow({ birth_date: undefined }))
    );
    repository.loadStudentBirthDate.mockResolvedValue(
      ok({ birth_date: "2011-02-03" })
    );

    await expect(loadSettingsProfile(studentActor())).resolves.toMatchObject({
      userId: "profile-1",
      email: "student@example.com",
      pendingEmail: "",
      profile: {
        firstName: "Student",
        lastName: "One",
        email: "student@example.com"
      },
      resolvedBirthDate: "2011-02-03"
    });
    expect(repository.loadProfileWithoutBirthDate).toHaveBeenCalledWith("profile-1");
    expect(repository.loadStudentBirthDate).toHaveBeenCalledWith("profile-1");
  });

  it("synchronizes Auth email into the profile without surfacing the write error", async () => {
    identityGateway.getCurrentUser.mockResolvedValue(
      currentUser("auth@example.com")
    );
    repository.loadProfileWithBirthDate.mockResolvedValue(
      ok(profileRow({ email: "profile@example.com" }))
    );
    repository.updateProfileEmail.mockResolvedValue({
      data: null,
      error: { message: "write failed" }
    });

    await expect(loadSettingsProfile(studentActor())).resolves.toMatchObject({
      email: "auth@example.com",
      profile: { email: "auth@example.com" }
    });
    expect(repository.updateProfileEmail).toHaveBeenCalledWith(
      "profile-1",
      "auth@example.com"
    );
  });

  it("normalizes profile fields and uses the student birth-date fallback", async () => {
    repository.updateProfileBirthDate.mockResolvedValue({
      data: null,
      error: { message: "column profiles.birth_date does not exist" }
    });

    const result = await updateSettingsProfile(
      studentActor(),
      updateInput({
        firstName: "  Иван  ",
        lastName: "  Петров  ",
        phone: "+7 (999) 000-00-01",
        profileDirty: true
      })
    );

    expect(repository.updateProfileFields).toHaveBeenCalledWith("profile-1", {
      first_name: "Иван",
      last_name: "Петров",
      display_name: "Иван Петров",
      phone: "+79990000001"
    });
    expect(repository.upsertStudentBirthDate).toHaveBeenCalledWith(
      "profile-1",
      "2010-01-01"
    );
    expect(result.applied.profile).toBe(true);
  });

  it("does not write the student fallback for a teacher preview actor", async () => {
    repository.updateProfileBirthDate.mockResolvedValue({
      data: null,
      error: { message: "column profiles.birth_date does not exist" }
    });
    const actor = createAppActor({
      ...studentActor(),
      userId: "profile-1",
      role: "teacher",
      profileRole: "teacher",
      isStudent: false,
      isTeacher: true,
      studentId: "student-preview-1",
      teacherId: "teacher-1"
    });

    await updateSettingsProfile(
      actor,
      updateInput({ birthDate: "1980-01-01", profileDirty: true })
    );

    expect(repository.upsertStudentBirthDate).not.toHaveBeenCalled();
    expect(repository.clearStudentBirthDate).not.toHaveBeenCalled();
  });

  it("rejects an invalid phone before repository writes", async () => {
    await expect(
      updateSettingsProfile(
        studentActor(),
        updateInput({ phone: "123", profileDirty: true })
      )
    ).rejects.toMatchObject({ status: 400, code: "VALIDATION_ERROR" });

    expect(repository.updateProfileFields).not.toHaveBeenCalled();
  });

  it("uploads an avatar before persisting its media URL", async () => {
    const file = new Blob(["avatar"], { type: "image/png" });

    const result = await updateSettingsProfile(
      studentActor(),
      updateInput({ avatarFile: file })
    );

    expect(avatarGateway.uploadAvatar).toHaveBeenCalledWith("profile-1", file);
    expect(repository.updateProfileAvatarUrl).toHaveBeenCalledWith(
      "profile-1",
      expect.stringMatching(/^\/api\/media\/avatar\/profile-1\?v=\d+$/)
    );
    expect(result.applied.avatar).toBe(true);
    expect(result.avatarMessage).toBe("Аватар обновлён");
  });

  it("maps avatar upload failures without persisting a profile URL", async () => {
    avatarGateway.uploadAvatar.mockResolvedValue({
      data: null,
      error: { message: "upload failed" }
    });

    await expect(
      updateSettingsProfile(
        studentActor(),
        updateInput({ avatarFile: new Blob(["avatar"]) })
      )
    ).rejects.toMatchObject({
      status: 400,
      code: "SETTINGS_PROFILE_UPDATE_FAILED",
      message: "avatar:upload failed"
    });
    expect(repository.updateProfileAvatarUrl).not.toHaveBeenCalled();
  });

  it("ignores avatar Storage delete errors but reports profile URL errors", async () => {
    avatarGateway.deleteAvatar.mockResolvedValue({
      data: null,
      error: { message: "object missing" }
    });

    await expect(
      updateSettingsProfile(studentActor(), updateInput({ avatarDelete: true }))
    ).resolves.toMatchObject({
      applied: { avatar: true },
      avatarMessage: "Аватар удалён"
    });

    repository.updateProfileAvatarUrl.mockResolvedValueOnce({
      data: null,
      error: { message: "profile update failed" }
    });
    await expect(
      updateSettingsProfile(studentActor(), updateInput({ avatarDelete: true }))
    ).rejects.toMatchObject({
      status: 400,
      code: "SETTINGS_PROFILE_UPDATE_FAILED",
      message: "avatar:profile update failed"
    });
  });

  it("preserves pending and immediate Auth email semantics", async () => {
    identityGateway.updateEmail.mockResolvedValueOnce(
      ok({
        user: {
          id: "profile-1",
          email: "student@example.com",
          new_email: "new@example.com"
        }
      })
    );

    const pendingResult = await updateSettingsProfile(
      studentActor(),
      updateInput({ email: " New@Example.com ", emailDirty: true })
    );
    expect(identityGateway.updateEmail).toHaveBeenCalledWith(
      "new@example.com",
      "https://app.example.com/auth/confirm?next=/settings/profile"
    );
    expect(pendingResult).toMatchObject({
      applied: { email: false },
      hasEmailPendingConfirmation: true,
      profile: {
        email: "student@example.com",
        pendingEmail: "new@example.com"
      }
    });

    identityGateway.updateEmail.mockResolvedValueOnce(
      ok({ user: { id: "profile-1", email: "new@example.com" } })
    );
    identityGateway.getCurrentUser.mockResolvedValue(
      currentUser("new@example.com")
    );
    repository.loadProfileWithBirthDate.mockResolvedValue(
      ok(profileRow({ email: "new@example.com" }))
    );

    const immediateResult = await updateSettingsProfile(
      studentActor(),
      updateInput({ email: "new@example.com", emailDirty: true })
    );
    expect(immediateResult).toMatchObject({
      applied: { email: true },
      hasEmailPendingConfirmation: false,
      profile: { email: "new@example.com", pendingEmail: "" }
    });
  });

  it("keeps the existing Auth email error mapping", async () => {
    identityGateway.updateEmail.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "JWT expired", status: 401 }
    });
    await expect(
      updateSettingsProfile(
        studentActor(),
        updateInput({ email: "new@example.com", emailDirty: true })
      )
    ).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED"
    });

    identityGateway.updateEmail.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Invalid email address", code: "email_address_invalid" }
    });
    await expect(
      updateSettingsProfile(
        studentActor(),
        updateInput({ email: "bad-email", emailDirty: true })
      )
    ).rejects.toMatchObject({
      status: 400,
      code: "SETTINGS_PROFILE_UPDATE_FAILED",
      details: { fieldErrors: { email: ["Введите корректный email."] } }
    });

    identityGateway.updateEmail.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "User already registered", code: "email_exists" }
    });
    await expect(
      updateSettingsProfile(
        studentActor(),
        updateInput({ email: "taken@example.com", emailDirty: true })
      )
    ).rejects.toMatchObject({
      details: {
        fieldErrors: {
          email: ["Пользователь с таким email уже существует."]
        }
      }
    });

    identityGateway.updateEmail.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "500: Error sending email change email", status: 500 }
    });
    await expect(
      updateSettingsProfile(
        studentActor(),
        updateInput({ email: "new@example.com", emailDirty: true })
      )
    ).rejects.toMatchObject({
      details: {
        formErrors: [
          "Не удалось отправить письмо подтверждения. Проверьте настройки email-провайдера Supabase."
        ]
      }
    });
  });

  it("does not roll back earlier profile writes when a later email update fails", async () => {
    identityGateway.updateEmail.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid email address", code: "email_address_invalid" }
    });

    await expect(
      updateSettingsProfile(
        studentActor(),
        updateInput({
          firstName: "Updated",
          profileDirty: true,
          email: "bad-email",
          emailDirty: true
        })
      )
    ).rejects.toMatchObject({
      code: "SETTINGS_PROFILE_UPDATE_FAILED"
    });

    expect(repository.updateProfileFields).toHaveBeenCalled();
    expect(repository.updateProfileBirthDate).toHaveBeenCalled();
  });

  it("preserves update order and reloads through the same infrastructure", async () => {
    const order: string[] = [];
    repository.updateProfileFields.mockImplementation(async () => {
      order.push("profile-fields");
      return ok();
    });
    repository.updateProfileBirthDate.mockImplementation(async () => {
      order.push("profile-birth-date");
      return ok();
    });
    avatarGateway.uploadAvatar.mockImplementation(async () => {
      order.push("avatar-upload");
      return ok();
    });
    repository.updateProfileAvatarUrl.mockImplementation(async () => {
      order.push("avatar-url");
      return ok();
    });
    identityGateway.updateEmail.mockImplementation(async () => {
      order.push("email");
      return ok({ user: { id: "profile-1", email: "new@example.com" } });
    });
    repository.loadProfileWithBirthDate.mockImplementation(async () => {
      order.push("reload");
      return ok(profileRow({ email: "new@example.com" }));
    });
    identityGateway.getCurrentUser.mockResolvedValue(
      currentUser("new@example.com")
    );

    await updateSettingsProfile(
      studentActor(),
      updateInput({
        profileDirty: true,
        avatarFile: new Blob(["avatar"]),
        email: "new@example.com",
        emailDirty: true,
        passwordDirty: true,
        currentPassword: "old-password",
        nextPassword: "new-password"
      })
    );

    expect(order).toEqual([
      "profile-fields",
      "profile-birth-date",
      "avatar-upload",
      "avatar-url",
      "email",
      "reload"
    ]);
    expect(createInfrastructureMock).toHaveBeenCalledTimes(1);
  });
});
