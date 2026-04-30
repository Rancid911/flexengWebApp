import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const requireStaffAdminApiMock = vi.fn();
const createAdminClientMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  requireStaffAdminApi: () => requireStaffAdminApiMock()
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock()
}));

describe("/api/admin/course-modules/options", () => {
  beforeEach(() => {
    vi.resetModules();
    requireStaffAdminApiMock.mockReset();
    createAdminClientMock.mockReset();
  });

  it("returns readable module options sorted by course and module title", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "course_modules") throw new Error(`Unexpected table: ${table}`);
        return {
          select: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "module-2",
                  title: "Travel",
                  is_published: false,
                  courses: { title: "A2 Vocabulary" }
                },
                {
                  id: "module-1",
                  title: "Present Simple",
                  is_published: true,
                  courses: [{ title: "A1 Grammar" }]
                }
              ],
              error: null
            })
          }))
        };
      })
    });

    const { GET } = await import("@/app/api/admin/course-modules/options/route");
    const response = await GET();

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual([
      {
        id: "module-1",
        label: "A1 Grammar · Present Simple",
        courseTitle: "A1 Grammar",
        moduleTitle: "Present Simple",
        isPublished: true
      },
      {
        id: "module-2",
        label: "A2 Vocabulary · Travel",
        courseTitle: "A2 Vocabulary",
        moduleTitle: "Travel",
        isPublished: false
      }
    ]);
  });
});

describe("/api/admin/courses/options", () => {
  beforeEach(() => {
    vi.resetModules();
    requireStaffAdminApiMock.mockReset();
    createAdminClientMock.mockReset();
  });

  it("returns readable course options sorted by title", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "courses") throw new Error(`Unexpected table: ${table}`);
        return {
          select: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: [
                { id: "course-2", title: "Vocabulary", is_published: false },
                { id: "course-1", title: "Grammar", is_published: true }
              ],
              error: null
            })
          }))
        };
      })
    });

    const { GET } = await import("@/app/api/admin/courses/options/route");
    const response = await GET();

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual([
      { id: "course-1", label: "Grammar", title: "Grammar", isPublished: true },
      { id: "course-2", label: "Vocabulary", title: "Vocabulary", isPublished: false }
    ]);
  });
});

describe("/api/admin/course-modules", () => {
  beforeEach(() => {
    vi.resetModules();
    requireStaffAdminApiMock.mockReset();
    createAdminClientMock.mockReset();
  });

  it("creates a module at the end of the selected course", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });

    const moduleInsertMock = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "module-3",
            title: "Past Simple",
            is_published: true
          },
          error: null
        })
      }))
    }));

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "courses") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "11111111-1111-4111-8111-111111111111", title: "Grammar" },
                  error: null
                })
              }))
            }))
          };
        }
        if (table === "course_modules") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue({ data: [{ sort_order: 4 }], error: null })
                }))
              }))
            })),
            insert: moduleInsertMock
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      })
    });

    const { POST } = await import("@/app/api/admin/course-modules/route");
    const response = await POST(
      new NextRequest("http://localhost/api/admin/course-modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: "11111111-1111-4111-8111-111111111111",
          title: "Past Simple",
          description: "Practice",
          is_published: true
        })
      })
    );

    expect(response.status).toBe(201);
    expect(moduleInsertMock).toHaveBeenCalledWith({
      course_id: "11111111-1111-4111-8111-111111111111",
      title: "Past Simple",
      description: "Practice",
      sort_order: 5,
      is_published: true
    });
    expect(await response.json()).toEqual({
      id: "module-3",
      label: "Grammar · Past Simple",
      courseTitle: "Grammar",
      moduleTitle: "Past Simple",
      isPublished: true
    });
  });

  it("returns validation errors for missing course or title", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
    createAdminClientMock.mockReturnValue({});

    const { POST } = await import("@/app/api/admin/course-modules/route");
    const response = await POST(
      new NextRequest("http://localhost/api/admin/course-modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: "", title: "" })
      })
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.details.fieldErrors.course_id).toBeDefined();
    expect(payload.details.fieldErrors.title).toBeDefined();
  });
});
