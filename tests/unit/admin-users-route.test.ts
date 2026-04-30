import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireStaffAdminApiMock = vi.fn();
const writeAuditMock = vi.fn();
const invalidateFullAppActorCacheMock = vi.fn();
const createAdminClientMock = vi.fn();
const hydrateUsersWithStudentDetailsMock = vi.fn();
const toUserDtoMock = vi.fn();

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

vi.mock("@/lib/admin/users", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin/users")>("@/lib/admin/users");
  return {
    ...actual,
    hydrateUsersWithStudentDetails: (...args: unknown[]) => hydrateUsersWithStudentDetailsMock(...args),
    toUserDto: (...args: unknown[]) => toUserDtoMock(...args)
  };
});

describe("/api/admin/users POST", () => {
  beforeEach(() => {
    vi.resetModules();
    requireStaffAdminApiMock.mockReset();
    writeAuditMock.mockReset();
    invalidateFullAppActorCacheMock.mockReset();
    createAdminClientMock.mockReset();
    hydrateUsersWithStudentDetailsMock.mockReset();
    toUserDtoMock.mockReset();
  });

  it("creates a teacher record so the new teacher appears in teacher options", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });

    const profileSelectSingleMock = vi.fn().mockResolvedValue({
      data: {
        id: "teacher-profile-1",
        role: "teacher",
        first_name: "New",
        last_name: "Teacher",
        email: "teacher@example.com",
        phone: "+79990000000",
        created_at: "2026-04-11T10:00:00.000Z"
      },
      error: null
    });

    const teachersUpsertMock = vi.fn().mockResolvedValue({ error: null });
    const profilesUpsertMock = vi.fn().mockResolvedValue({ error: null });

    const supabase = {
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: "teacher-profile-1" } },
            error: null
          }),
          deleteUser: vi.fn(),
          updateUserById: vi.fn()
        }
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            upsert: profilesUpsertMock,
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: profileSelectSingleMock
              }))
            }))
          };
        }

        if (table === "teachers") {
          return {
            upsert: teachersUpsertMock
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      })
    };

    createAdminClientMock.mockReturnValue(supabase);
    hydrateUsersWithStudentDetailsMock.mockResolvedValue([
      {
        id: "teacher-profile-1",
        role: "teacher",
        first_name: "New",
        last_name: "Teacher",
        email: "teacher@example.com",
        phone: "+79990000000",
        created_at: "2026-04-11T10:00:00.000Z"
      }
    ]);
    toUserDtoMock.mockReturnValue({
      id: "teacher-profile-1",
      role: "teacher",
      first_name: "New",
      last_name: "Teacher",
      email: "teacher@example.com",
      phone: "+79990000000",
      student_id: null,
      assigned_teacher_id: null,
      assigned_teacher_name: null,
      birth_date: null,
      english_level: null,
      target_level: null,
      learning_goal: null,
      notes: null,
      billing_mode: null,
      lesson_price_amount: null,
      billing_currency: null,
      billing_balance_label: null,
      billing_debt_label: null,
      billing_is_negative: false,
      created_at: "2026-04-11T10:00:00.000Z"
    });

    const { POST } = await import("@/app/api/admin/users/route");
    const response = await POST(
      new NextRequest("http://localhost/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          role: "teacher",
          first_name: "New",
          last_name: "Teacher",
          email: "teacher@example.com",
          password: "Password123!",
          phone: "+79990000000",
          birth_date: null,
          english_level: null,
          target_level: null,
          learning_goal: null,
          notes: null,
          assigned_teacher_id: null,
          billing_mode: null,
          lesson_price_amount: null
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })
    );

    expect(response.status).toBe(201);
    expect(teachersUpsertMock).toHaveBeenCalledWith({ profile_id: "teacher-profile-1" }, { onConflict: "profile_id" });
    expect(invalidateFullAppActorCacheMock).toHaveBeenCalledWith("teacher-profile-1");
  });
});

describe("assignPrimaryTeacherToStudent", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("updates students.primary_teacher_id directly", async () => {
    const studentsUpdateEqMock = vi.fn().mockResolvedValue({ error: null });
    const studentsUpdateMock = vi.fn(() => ({
      eq: studentsUpdateEqMock
    }));

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "students") {
          return {
            update: studentsUpdateMock
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      })
    };

    const { assignPrimaryTeacherToStudent } = await import("@/lib/admin/users");
    await assignPrimaryTeacherToStudent(supabase as never, "student-1", "teacher-1");

    expect(studentsUpdateMock).toHaveBeenCalledWith({ primary_teacher_id: "teacher-1" });
    expect(studentsUpdateEqMock).toHaveBeenCalledWith("id", "student-1");
  });
});
