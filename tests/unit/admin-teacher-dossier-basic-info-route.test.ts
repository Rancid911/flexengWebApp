import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireStaffAdminApiMock = vi.fn();
const writeAuditMock = vi.fn();
const invalidateFullAppActorCacheMock = vi.fn();
const createAdminClientMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  requireStaffAdminApi: () => requireStaffAdminApiMock()
}));

vi.mock("@/lib/admin/audit", () => ({
  writeAudit: (...args: unknown[]) => writeAuditMock(...args)
}));

vi.mock("@/lib/auth/request-context", () => ({
  invalidateFullAppActorCache: (...args: unknown[]) => invalidateFullAppActorCacheMock(...args)
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock()
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
  const updateUserByIdMock = vi.fn().mockResolvedValue({ error: null });

  const supabase = {
    auth: {
      admin: {
        updateUserById: updateUserByIdMock
      }
    },
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

  return {
    supabase,
    teacherMaybeSingleMock,
    profileUpdateMock,
    profileUpdateEqMock,
    dossierUpsertMock,
    updateUserByIdMock
  };
}

describe("PATCH /api/admin/teachers/[teacherId]/dossier/basic-info", () => {
  beforeEach(() => {
    vi.resetModules();
    requireStaffAdminApiMock.mockReset();
    writeAuditMock.mockReset();
    invalidateFullAppActorCacheMock.mockReset();
    createAdminClientMock.mockReset();
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
  });

  it("updates profile, auth email and teacher dossier for staff users", async () => {
    const mocks = createSupabaseMock();
    createAdminClientMock.mockReturnValue(mocks.supabase);

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
    expect(mocks.updateUserByIdMock).toHaveBeenCalledWith("profile-1", { email: "new-teacher@example.com" });
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

  it("returns validation error for invalid role, timezone, email and phone", async () => {
    const mocks = createSupabaseMock();
    createAdminClientMock.mockReturnValue(mocks.supabase);

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
    createAdminClientMock.mockReturnValue(mocks.supabase);

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/basic-info/route");
    const response = await PATCH(createRequest(validPayload), { params: Promise.resolve({ teacherId: "missing" }) });
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.code).toBe("TEACHER_NOT_FOUND");
  });

  it("delegates non-staff access to staff API guard", async () => {
    requireStaffAdminApiMock.mockRejectedValue(new Error("NEXT_REDIRECT:/"));
    const mocks = createSupabaseMock();
    createAdminClientMock.mockReturnValue(mocks.supabase);

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/basic-info/route");
    const response = await PATCH(createRequest(validPayload), { params: Promise.resolve({ teacherId: "teacher-1" }) });

    expect(response.status).toBe(500);
    expect(mocks.supabase.from).not.toHaveBeenCalled();
  });
});
