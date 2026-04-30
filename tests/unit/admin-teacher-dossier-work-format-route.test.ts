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
  available_weekdays: ["monday", "wednesday"],
  time_slots: "10:00-14:00, 18:00-21:00",
  max_lessons_per_day: 5,
  max_lessons_per_week: 25,
  lesson_types: ["individual", "group"],
  lesson_durations: ["60", "90"]
};

function createRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/admin/teachers/teacher-1/dossier/work-format", {
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
      available_weekdays: [],
      time_slots: null,
      max_lessons_per_day: null,
      max_lessons_per_week: null,
      lesson_types: [],
      lesson_durations: []
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

describe("PATCH /api/admin/teachers/[teacherId]/dossier/work-format", () => {
  beforeEach(() => {
    vi.resetModules();
    requireStaffAdminApiMock.mockReset();
    createAdminClientMock.mockReset();
    writeAuditMock.mockReset();
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
  });

  it("upserts work format for valid staff payload and returns DTO", async () => {
    const mocks = createSupabaseMock();
    createAdminClientMock.mockReturnValue(mocks.supabase);

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/work-format/route");
    const response = await PATCH(createRequest(validPayload), { params: Promise.resolve({ teacherId: "teacher-1" }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.supabase.from).toHaveBeenCalledWith("teachers");
    expect(mocks.supabase.from).toHaveBeenCalledWith("teacher_dossiers");
    expect(mocks.dossierUpsertMock).toHaveBeenCalledWith(
      {
        teacher_id: "teacher-1",
        available_weekdays: ["monday", "wednesday"],
        time_slots: "10:00-14:00, 18:00-21:00",
        max_lessons_per_day: 5,
        max_lessons_per_week: 25,
        lesson_types: ["individual", "group"],
        lesson_durations: ["60", "90"],
        updated_by_profile_id: "admin-1"
      },
      { onConflict: "teacher_id" }
    );
    expect(payload).toMatchObject({
      teacherId: "teacher-1",
      availableWeekdays: ["monday", "wednesday"],
      timeSlots: "10:00-14:00, 18:00-21:00",
      maxLessonsPerDay: 5,
      maxLessonsPerWeek: 25,
      lessonTypes: ["individual", "group"],
      lessonDurations: ["60", "90"]
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

  it("returns validation error for invalid work format values", async () => {
    const mocks = createSupabaseMock();
    createAdminClientMock.mockReturnValue(mocks.supabase);

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/work-format/route");
    const response = await PATCH(
      createRequest({
        ...validPayload,
        available_weekdays: ["unknown_day"],
        max_lessons_per_day: 21,
        max_lessons_per_week: 81,
        lesson_types: ["pair"],
        lesson_durations: ["45"]
      }),
      { params: Promise.resolve({ teacherId: "teacher-1" }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe("VALIDATION_ERROR");
    expect(payload.details.fieldErrors).toMatchObject({
      available_weekdays: expect.any(Array),
      max_lessons_per_day: expect.any(Array),
      max_lessons_per_week: expect.any(Array),
      lesson_types: expect.any(Array),
      lesson_durations: expect.any(Array)
    });
    expect(mocks.supabase.from).not.toHaveBeenCalledWith("teachers");
  });

  it("returns 404 when teacher is missing", async () => {
    const mocks = createSupabaseMock(null);
    createAdminClientMock.mockReturnValue(mocks.supabase);

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/work-format/route");
    const response = await PATCH(createRequest(validPayload), { params: Promise.resolve({ teacherId: "missing" }) });
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.code).toBe("TEACHER_NOT_FOUND");
  });

  it("returns update failed when dossier upsert fails", async () => {
    const mocks = createSupabaseMock({ id: "teacher-1" }, { upsertError: { message: "upsert failed" } });
    createAdminClientMock.mockReturnValue(mocks.supabase);

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/work-format/route");
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

    const { PATCH } = await import("@/app/api/admin/teachers/[teacherId]/dossier/work-format/route");
    const response = await PATCH(createRequest(validPayload), { params: Promise.resolve({ teacherId: "teacher-1" }) });

    expect(response.status).toBe(500);
    expect(mocks.supabase.from).not.toHaveBeenCalled();
  });
});
