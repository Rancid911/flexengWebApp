import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireStaffAdminApiMock = vi.fn();
const createAdminClientMock = vi.fn();
const writeAuditMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  requireStaffAdminApi: () => requireStaffAdminApiMock()
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock()
}));

vi.mock("@/lib/admin/audit", () => ({
  writeAudit: (...args: unknown[]) => writeAuditMock(...args)
}));

const validPayload = {
  english_proficiency: "C1",
  specializations: ["business_english", "it_english"],
  teaching_experience_years: 7,
  education_level: "higher_linguistic",
  certificates: ["ielts"],
  target_audiences: ["adults", "it_specialists"],
  certificate_other: null,
  teacher_bio: "Опытный преподаватель."
};

function createRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/admin/teachers/teacher-1/dossier/professional-info", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function createSupabaseMock(
  teacherData: Record<string, unknown> | null = { id: "teacher-1" },
  options: { dossierError?: { message: string }; upsertError?: { message: string } } = {}
) {
  const teacherMaybeSingleMock = vi.fn().mockResolvedValue({ data: teacherData, error: null });
  const dossierMaybeSingleMock = vi.fn().mockResolvedValue({
    data: {
      teacher_id: "teacher-1",
      english_proficiency: "B2",
      specializations: [],
      teaching_experience_years: null,
      education_level: null,
      certificates: ["none"],
      target_audiences: [],
      certificate_other: null,
      teacher_bio: null
    },
    error: options.dossierError ?? null
  });
  const dossierUpsertMock = vi.fn().mockResolvedValue({ error: options.upsertError ?? null });
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
      if (table === "teacher_dossiers") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: dossierMaybeSingleMock
            }))
          })),
          upsert: dossierUpsertMock
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    })
  };

  return { supabase, teacherMaybeSingleMock, dossierMaybeSingleMock, dossierUpsertMock };
}

describe("PATCH /api/admin/teachers/[teacherId]/dossier/professional-info", () => {
  beforeEach(() => {
    vi.resetModules();
    requireStaffAdminApiMock.mockReset();
    createAdminClientMock.mockReset();
    writeAuditMock.mockReset();
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
  });

  it("upserts professional info for valid staff payload and returns DTO", async () => {
    const mocks = createSupabaseMock();
    createAdminClientMock.mockReturnValue(mocks.supabase);

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/professional-info/route");
    const response = await PATCH(createRequest(validPayload), { params: Promise.resolve({ teacherId: "teacher-1" }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.supabase.from).toHaveBeenCalledWith("teachers");
    expect(mocks.supabase.from).toHaveBeenCalledWith("teacher_dossiers");
    expect(mocks.dossierUpsertMock).toHaveBeenCalledWith(
      {
        teacher_id: "teacher-1",
        english_proficiency: "C1",
        specializations: ["business_english", "it_english"],
        teaching_experience_years: 7,
        education_level: "higher_linguistic",
        certificates: ["ielts"],
        target_audiences: ["adults", "it_specialists"],
        certificate_other: null,
        teacher_bio: "Опытный преподаватель.",
        updated_by_profile_id: "admin-1"
      },
      { onConflict: "teacher_id" }
    );
    expect(payload).toMatchObject({
      teacherId: "teacher-1",
      englishProficiency: "C1",
      specializations: ["business_english", "it_english"],
      teachingExperienceYears: 7,
      educationLevel: "higher_linguistic",
      certificates: ["ielts"],
      targetAudiences: ["adults", "it_specialists"],
      certificateOther: "",
      teacherBio: "Опытный преподаватель."
    });
    expect(writeAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin-1",
        entity: "teacher_dossiers",
        entityId: "teacher-1",
        action: "update",
        after: payload
      })
    );
  });

  it("returns validation error for invalid professional values", async () => {
    const mocks = createSupabaseMock();
    createAdminClientMock.mockReturnValue(mocks.supabase);

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/professional-info/route");
    const response = await PATCH(
      createRequest({
        ...validPayload,
        english_proficiency: "A1",
        specializations: ["unknown"],
        teaching_experience_years: 99,
        education_level: "phd",
        certificates: ["none", "ielts"],
        target_audiences: ["unknown_audience"]
      }),
      { params: Promise.resolve({ teacherId: "teacher-1" }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe("VALIDATION_ERROR");
    expect(payload.details.fieldErrors).toMatchObject({
      english_proficiency: expect.any(Array),
      specializations: expect.any(Array),
      teaching_experience_years: expect.any(Array),
      education_level: expect.any(Array),
      target_audiences: expect.any(Array)
    });
    expect(mocks.supabase.from).not.toHaveBeenCalledWith("teachers");
  });

  it("rejects removed standalone audience level values", async () => {
    const mocks = createSupabaseMock();
    createAdminClientMock.mockReturnValue(mocks.supabase);

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/professional-info/route");
    const response = await PATCH(
      createRequest({
        ...validPayload,
        target_audiences: ["a1", "c1_plus"]
      }),
      { params: Promise.resolve({ teacherId: "teacher-1" }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe("VALIDATION_ERROR");
    expect(payload.details.fieldErrors).toMatchObject({
      target_audiences: expect.any(Array)
    });
    expect(mocks.supabase.from).not.toHaveBeenCalledWith("teachers");
  });

  it("returns validation error when none certificate is combined with other certificates", async () => {
    const mocks = createSupabaseMock();
    createAdminClientMock.mockReturnValue(mocks.supabase);

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/professional-info/route");
    const response = await PATCH(
      createRequest({
        ...validPayload,
        certificates: ["none", "ielts"]
      }),
      { params: Promise.resolve({ teacherId: "teacher-1" }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe("VALIDATION_ERROR");
    expect(payload.details.fieldErrors).toMatchObject({
      certificates: expect.any(Array)
    });
    expect(mocks.supabase.from).not.toHaveBeenCalledWith("teachers");
  });

  it("returns 404 when teacher is missing", async () => {
    const mocks = createSupabaseMock(null);
    createAdminClientMock.mockReturnValue(mocks.supabase);

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/professional-info/route");
    const response = await PATCH(createRequest(validPayload), { params: Promise.resolve({ teacherId: "missing" }) });
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.code).toBe("TEACHER_NOT_FOUND");
  });

  it("returns update failed when dossier upsert fails", async () => {
    const mocks = createSupabaseMock({ id: "teacher-1" }, { upsertError: { message: "upsert failed" } });
    createAdminClientMock.mockReturnValue(mocks.supabase);

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/professional-info/route");
    const response = await PATCH(createRequest(validPayload), { params: Promise.resolve({ teacherId: "teacher-1" }) });
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.code).toBe("TEACHER_DOSSIER_UPDATE_FAILED");
    expect(writeAuditMock).not.toHaveBeenCalled();
  });

  it("delegates non-staff access to staff API guard", async () => {
    requireStaffAdminApiMock.mockRejectedValue(new Error("NEXT_REDIRECT:/"));
    const mocks = createSupabaseMock();
    createAdminClientMock.mockReturnValue(mocks.supabase);

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/professional-info/route");
    const response = await PATCH(createRequest(validPayload), { params: Promise.resolve({ teacherId: "teacher-1" }) });

    expect(response.status).toBe(500);
    expect(mocks.supabase.from).not.toHaveBeenCalled();
  });
});
