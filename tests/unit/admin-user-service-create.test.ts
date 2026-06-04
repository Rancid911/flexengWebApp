import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  assignPrimaryTeacher: vi.fn(),
  createAdminAuthUserClient: vi.fn(),
  createAuthUser: vi.fn(),
  deleteAuthUserByIdSafely: vi.fn(),
  hydrateCreatedAdminUser: vi.fn(),
  readCreatedProfileById: vi.fn(),
  resolveTeacherProfileIdForTeacher: vi.fn(),
  updateProvisionedProfile: vi.fn(),
  updateProvisionedStudentDetails: vi.fn(),
  upsertStudentBillingAccount: vi.fn()
}));
const createClientMock = vi.hoisted(() => vi.fn());
const writeAuditMock = vi.hoisted(() => vi.fn());
const invalidateFullAppActorCacheMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/admin/user.repository", () => repositoryMocks);
vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock
}));
vi.mock("@/lib/admin/audit", () => ({
  writeAudit: writeAuditMock
}));
vi.mock("@/lib/auth/request-context", () => ({
  invalidateFullAppActorCache: invalidateFullAppActorCacheMock
}));

const actor = { userId: "admin-1", role: "admin" as const };
const studentPayload = {
  role: "student" as const,
  first_name: "New",
  last_name: "Student",
  email: "student@example.com",
  password: "Password123!",
  phone: "+79990000000",
  birth_date: "2000-01-01",
  english_level: "A1",
  target_level: "B1",
  learning_goal: "Conversation",
  notes: null,
  assigned_teacher_id: null,
  billing_mode: null,
  lesson_price_amount: null
};
const studentDto = {
  id: "student-profile-1",
  role: "student" as const,
  first_name: "New",
  last_name: "Student",
  email: "student@example.com",
  phone: "+79990000000",
  student_id: "student-1",
  assigned_teacher_id: null,
  assigned_teacher_name: null,
  birth_date: "2000-01-01",
  english_level: "A1",
  target_level: "B1",
  learning_goal: "Conversation",
  notes: null,
  billing_mode: null,
  lesson_price_amount: null,
  billing_currency: null,
  billing_balance_label: null,
  billing_debt_label: null,
  billing_is_negative: false,
  created_at: "2026-06-04T00:00:00.000Z"
};

describe("createAdminUser provisioning", () => {
  beforeEach(() => {
    vi.resetModules();
    for (const mock of Object.values(repositoryMocks)) mock.mockReset();
    createClientMock.mockReset();
    writeAuditMock.mockReset();
    invalidateFullAppActorCacheMock.mockReset();

    createClientMock.mockResolvedValue({ kind: "table-client" });
    repositoryMocks.createAdminAuthUserClient.mockReturnValue({ kind: "auth-client" });
    repositoryMocks.createAuthUser.mockResolvedValue({
      data: { user: { id: "student-profile-1" } },
      error: null
    });
    repositoryMocks.updateProvisionedProfile.mockResolvedValue({ error: null });
    repositoryMocks.updateProvisionedStudentDetails.mockResolvedValue({
      data: { id: "student-1" },
      error: null
    });
    repositoryMocks.readCreatedProfileById.mockResolvedValue({
      data: { id: "student-profile-1", role: "student" },
      error: null
    });
    repositoryMocks.hydrateCreatedAdminUser.mockResolvedValue(studentDto);
    repositoryMocks.deleteAuthUserByIdSafely.mockResolvedValue(undefined);
  });

  it("updates the student identity created by the auth trigger", async () => {
    const { createAdminUser } = await import("@/lib/admin/user-service");

    await expect(createAdminUser(actor, studentPayload)).resolves.toEqual(studentDto);

    expect(repositoryMocks.createAuthUser).toHaveBeenCalledWith(
      { kind: "auth-client" },
      expect.objectContaining({ role: "student" })
    );
    expect(repositoryMocks.updateProvisionedProfile).toHaveBeenCalledTimes(1);
    expect(repositoryMocks.updateProvisionedStudentDetails).toHaveBeenCalledWith(
      { kind: "table-client" },
      expect.objectContaining({ profileId: "student-profile-1", englishLevel: "A1" })
    );
    expect(repositoryMocks.deleteAuthUserByIdSafely).not.toHaveBeenCalled();
  });

  it("deletes the auth user when post-provisioning student setup fails", async () => {
    repositoryMocks.updateProvisionedStudentDetails.mockResolvedValue({
      data: null,
      error: { message: "student update failed" }
    });
    const { createAdminUser } = await import("@/lib/admin/user-service");

    await expect(createAdminUser(actor, studentPayload)).rejects.toMatchObject({
      code: "USER_CREATE_FAILED"
    });

    expect(repositoryMocks.deleteAuthUserByIdSafely).toHaveBeenCalledWith(
      { kind: "auth-client" },
      "student-profile-1"
    );
    expect(writeAuditMock).not.toHaveBeenCalled();
  });

  it("returns a conflict when the auth email already exists", async () => {
    repositoryMocks.createAuthUser.mockResolvedValue({
      data: { user: null },
      error: { message: "A user with this email address has already been registered" }
    });
    const { createAdminUser } = await import("@/lib/admin/user-service");

    await expect(createAdminUser(actor, studentPayload)).rejects.toMatchObject({
      status: 409,
      code: "USER_EMAIL_EXISTS"
    });

    expect(repositoryMocks.updateProvisionedProfile).not.toHaveBeenCalled();
    expect(repositoryMocks.deleteAuthUserByIdSafely).not.toHaveBeenCalled();
  });
});
