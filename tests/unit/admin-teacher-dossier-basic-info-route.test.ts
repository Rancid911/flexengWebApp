import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireStaffAdminApiMock = vi.fn();
const writeAuditMock = vi.fn();
const invalidateFullAppActorCacheMock = vi.fn();
const createClientMock = vi.fn();
const createAdminUserRepositoryClientMock = vi.fn();
const updateAuthUserByIdMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  requireStaffAdminApi: () => requireStaffAdminApiMock()
}));

vi.mock("@/lib/admin/audit", () => ({
  writeAudit: (...args: unknown[]) => writeAuditMock(...args)
}));

vi.mock("@/lib/auth/request-context", () => ({
  invalidateFullAppActorCache: (...args: unknown[]) => invalidateFullAppActorCacheMock(...args)
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
}));

vi.mock("@/lib/admin/user.repository", () => ({
  createAdminUserRepositoryClient: () => createAdminUserRepositoryClientMock(),
  updateAuthUserById: (...args: unknown[]) => updateAuthUserByIdMock(...args)
}));

function createRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/admin/teachers/teacher-1/dossier/basic-info", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

const validPayload = {
  first_name: "Мария",
  last_name: "Петрова",
  patronymic: "Сергеевна",
  email: "new-teacher@example.com",
  phone: "+79990000000",
  internal_role: "senior_teacher",
  timezone: "Europe/London"
};

function createSupabaseMock(teacherData: Record<string, unknown> | null = {
  id: "teacher-1",
  profile_id: "profile-1",
  profiles: {
    id: "profile-1",
    first_name: "Old",
    last_name: "Teacher",
    display_name: "Old Teacher",
    email: "old-teacher@example.com",
    phone: "+79991112233"
  }
}) {
  const teacherMaybeSingleMock = vi.fn().mockResolvedValue({ data: teacherData, error: null });
  const profileUpdateEqMock = vi.fn().mockResolvedValue({ error: null });
  const profileUpdateMock = vi.fn(() => ({ eq: profileUpdateEqMock }));
  const dossierUpsertMock = vi.fn().mockResolvedValue({ error: null });

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === "teachers") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: teacherMaybeSingleMock
            }))
          }))
        };
      }
      if (table === "profiles") {
        return {
          update: profileUpdateMock
        };
      }
      if (table === "teacher_dossiers") {
        return {
          upsert: dossierUpsertMock
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    })
  };
  const adminSupabase = { kind: "admin-user-repository-client" };

  return {
    supabase,
    adminSupabase,
    teacherMaybeSingleMock,
    profileUpdateMock,
    profileUpdateEqMock,
    dossierUpsertMock,
    updateUserByIdMock: updateAuthUserByIdMock
  };
}

describe("PATCH /api/admin/teachers/[teacherId]/dossier/basic-info", () => {
  beforeEach(() => {
    vi.resetModules();
    requireStaffAdminApiMock.mockReset();
    writeAuditMock.mockReset();
    invalidateFullAppActorCacheMock.mockReset();
    createClientMock.mockReset();
    createAdminUserRepositoryClientMock.mockReset();
    updateAuthUserByIdMock.mockReset();
    updateAuthUserByIdMock.mockResolvedValue({ error: null });
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
  });

  it("rejects teacher actors before touching Supabase or audit", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "teacher-profile-1", role: "teacher" });

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/basic-info/route");
    const response = await PATCH(createRequest(validPayload), { params: Promise.resolve({ teacherId: "teacher-1" }) });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      code: "FORBIDDEN",
      message: "Permission denied"
    });
    expect(createAdminUserRepositoryClientMock).not.toHaveBeenCalled();
    expect(updateAuthUserByIdMock).not.toHaveBeenCalled();
    expect(createClientMock).not.toHaveBeenCalled();
    expect(writeAuditMock).not.toHaveBeenCalled();
    expect(invalidateFullAppActorCacheMock).not.toHaveBeenCalled();
  });

  it("updates profile, auth email and teacher dossier for staff users", async () => {
    const mocks = createSupabaseMock();
    createClientMock.mockResolvedValue(mocks.supabase);
    createAdminUserRepositoryClientMock.mockReturnValue(mocks.adminSupabase);

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/basic-info/route");
    const response = await PATCH(createRequest(validPayload), { params: Promise.resolve({ teacherId: "teacher-1" }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.profileUpdateMock).toHaveBeenCalledWith({
      first_name: "Мария",
      last_name: "Петрова",
      display_name: "Мария Петрова",
      email: "new-teacher@example.com",
      phone: "+79990000000"
    });
    expect(mocks.profileUpdateEqMock).toHaveBeenCalledWith("id", "profile-1");
    expect(createAdminUserRepositoryClientMock).toHaveBeenCalledTimes(1);
    expect(updateAuthUserByIdMock).toHaveBeenCalledWith(mocks.adminSupabase, "profile-1", { email: "new-teacher@example.com" });
    expect(mocks.dossierUpsertMock).toHaveBeenCalledWith(
      {
        teacher_id: "teacher-1",
        patronymic: "Сергеевна",
        internal_role: "senior_teacher",
        timezone: "Europe/London",
        updated_by_profile_id: "admin-1"
      },
      { onConflict: "teacher_id" }
    );
    expect(invalidateFullAppActorCacheMock).toHaveBeenCalledWith("profile-1");
    expect(writeAuditMock).toHaveBeenCalledWith(expect.objectContaining({ entity: "teacher_dossiers", entityId: "teacher-1", action: "update" }));
    expect(payload).toMatchObject({
      teacherId: "teacher-1",
      profileId: "profile-1",
      firstName: "Мария",
      lastName: "Петрова",
      internalRole: "senior_teacher",
      internalRoleLabel: "Senior Teacher",
      timezone: "Europe/London"
    });
  });

  it("does not create an admin client when the auth email is unchanged", async () => {
    const mocks = createSupabaseMock({
      id: "teacher-1",
      profile_id: "profile-1",
      profiles: {
        id: "profile-1",
        first_name: "Old",
        last_name: "Teacher",
        display_name: "Old Teacher",
        email: "new-teacher@example.com",
        phone: "+79991112233"
      }
    });
    createClientMock.mockResolvedValue(mocks.supabase);

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/basic-info/route");
    const response = await PATCH(createRequest(validPayload), { params: Promise.resolve({ teacherId: "teacher-1" }) });

    expect(response.status).toBe(200);
    expect(createAdminUserRepositoryClientMock).not.toHaveBeenCalled();
    expect(updateAuthUserByIdMock).not.toHaveBeenCalled();
    expect(mocks.profileUpdateMock).toHaveBeenCalled();
    expect(mocks.dossierUpsertMock).toHaveBeenCalled();
  });

  it("returns validation error for invalid role, timezone, email and phone", async () => {
    const mocks = createSupabaseMock();
    createClientMock.mockResolvedValue(mocks.supabase);

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/basic-info/route");
    const response = await PATCH(
      createRequest({
        ...validPayload,
        email: "bad-email",
        phone: "+123",
        internal_role: "owner",
        timezone: "America/New_York"
      }),
      { params: Promise.resolve({ teacherId: "teacher-1" }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe("VALIDATION_ERROR");
    expect(payload.details.fieldErrors).toMatchObject({
      email: expect.any(Array),
      phone: expect.any(Array),
      internal_role: expect.any(Array),
      timezone: expect.any(Array)
    });
    expect(mocks.supabase.from).not.toHaveBeenCalledWith("teachers");
  });

  it("returns 404 when teacher is missing", async () => {
    const mocks = createSupabaseMock(null);
    createClientMock.mockResolvedValue(mocks.supabase);

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/basic-info/route");
    const response = await PATCH(createRequest(validPayload), { params: Promise.resolve({ teacherId: "missing" }) });
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.code).toBe("TEACHER_NOT_FOUND");
  });

  it("delegates non-staff access to staff API guard", async () => {
    requireStaffAdminApiMock.mockRejectedValue(new Error("NEXT_REDIRECT:/"));
    const mocks = createSupabaseMock();
    createClientMock.mockResolvedValue(mocks.supabase);

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/basic-info/route");
    const response = await PATCH(createRequest(validPayload), { params: Promise.resolve({ teacherId: "teacher-1" }) });

    expect(response.status).toBe(500);
    expect(mocks.supabase.from).not.toHaveBeenCalled();
    expect(createAdminUserRepositoryClientMock).not.toHaveBeenCalled();
    expect(updateAuthUserByIdMock).not.toHaveBeenCalled();
  });
});
