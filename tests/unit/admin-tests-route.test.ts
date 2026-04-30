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

function buildDetailRow() {
  return {
    id: "test-1",
    lesson_id: null,
    module_id: null,
    activity_type: "test",
    assessment_kind: "regular",
    title: "Grammar basics",
    description: "Simple quiz",
    cefr_level: "A1",
    drill_topic_key: "grammar-basics",
    drill_kind: "grammar",
    scoring_profile: null,
    lesson_reinforcement: false,
    sort_order: 0,
    passing_score: 70,
    time_limit_minutes: 15,
    is_published: false,
    created_at: "2026-04-19T00:00:00.000Z",
    updated_at: "2026-04-19T00:00:00.000Z",
    test_questions: [
      {
        id: "question-1",
        prompt: "Choose the correct answer",
        explanation: null,
        question_type: "single_choice",
        placement_band: null,
        sort_order: 0,
        test_question_options: [
          { id: "option-1", option_text: "A", is_correct: true, sort_order: 0 },
          { id: "option-2", option_text: "B", is_correct: false, sort_order: 1 },
          { id: "option-3", option_text: "C", is_correct: false, sort_order: 2 },
          { id: "option-4", option_text: "D", is_correct: false, sort_order: 3 }
        ]
      }
    ]
  };
}

function buildCreatePayload(overrides: Record<string, unknown> = {}) {
  return {
    activity_type: "trainer",
    assessment_kind: "regular",
    title: "Grammar trainer",
    description: null,
    lesson_id: null,
    module_id: "11111111-1111-4111-8111-111111111111",
    cefr_level: "A1",
    drill_topic_key: "grammar-trainer",
    drill_kind: "grammar",
    scoring_profile: null,
    lesson_reinforcement: false,
    passing_score: 70,
    time_limit_minutes: null,
    is_published: false,
    questions: [
      {
        prompt: "Choose the correct answer",
        explanation: null,
        question_type: "single_choice",
        placement_band: null,
        options: [
          { option_text: "A", is_correct: true },
          { option_text: "B", is_correct: false },
          { option_text: "C", is_correct: false },
          { option_text: "D", is_correct: false }
        ]
      }
    ],
    ...overrides
  };
}

describe("/api/admin/tests", () => {
  beforeEach(() => {
    vi.resetModules();
    requireStaffAdminApiMock.mockReset();
    createAdminClientMock.mockReset();
    writeAuditMock.mockReset();
  });

  it("returns a field validation error when a trainer is missing module_id", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
    createAdminClientMock.mockReturnValue({});

    const { POST } = await import("@/app/api/admin/tests/route");
    const response = await POST(
      new NextRequest("http://localhost/api/admin/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildCreatePayload({ module_id: null }))
      })
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.details.fieldErrors.module_id).toContain("module_id is required for trainer");
  });

  it("returns a field validation error when a final test is missing module_id", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
    createAdminClientMock.mockReturnValue({});

    const { POST } = await import("@/app/api/admin/tests/route");
    const response = await POST(
      new NextRequest("http://localhost/api/admin/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildCreatePayload({ activity_type: "test", assessment_kind: "regular", module_id: null }))
      })
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.details.fieldErrors.module_id).toContain("module_id is required for regular test");
  });

  it("assigns a new trainer to the end of the list when sort_order is omitted", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });

    const insertedTestRow = { ...buildDetailRow(), id: "test-created", activity_type: "trainer", module_id: "11111111-1111-4111-8111-111111111111", sort_order: 6 };
    const testsInsertMock = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: insertedTestRow, error: null })
      }))
    }));
    const testsFromMock = {
      select: vi.fn((columns: string) => {
        if (columns === "sort_order") {
          return {
            order: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({ data: [{ sort_order: 5 }], error: null })
            }))
          };
        }
        return {
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: insertedTestRow, error: null })
          }))
        };
      }),
      insert: testsInsertMock,
      delete: vi.fn(() => ({
        eq: vi.fn()
      }))
    };
    const questionInsertMock = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: { id: "question-created" }, error: null })
      }))
    }));
    const optionInsertMock = vi.fn().mockResolvedValue({ error: null });

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "tests") return testsFromMock;
        if (table === "test_questions") return { insert: questionInsertMock };
        if (table === "test_question_options") return { insert: optionInsertMock };
        throw new Error(`Unexpected table: ${table}`);
      })
    });

    const { POST } = await import("@/app/api/admin/tests/route");
    const response = await POST(
      new NextRequest("http://localhost/api/admin/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildCreatePayload())
      })
    );

    expect(response.status).toBe(201);
    expect(testsInsertMock).toHaveBeenCalledWith(expect.objectContaining({ sort_order: 6 }));
  });

  it("allows placement tests without module_id when placement fields are valid", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });

    const insertedTestRow = { ...buildDetailRow(), id: "placement-created", activity_type: "test", assessment_kind: "placement", module_id: null, scoring_profile: { kind: "placement_v1" }, sort_order: 3 };
    const testsInsertMock = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: insertedTestRow, error: null })
      }))
    }));
    const testsFromMock = {
      select: vi.fn((columns: string) => {
        if (columns === "sort_order") {
          return {
            order: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({ data: [{ sort_order: 2 }], error: null })
            }))
          };
        }
        return {
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: insertedTestRow, error: null })
          }))
        };
      }),
      insert: testsInsertMock,
      delete: vi.fn(() => ({
        eq: vi.fn()
      }))
    };
    const questionInsertMock = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: { id: "question-created" }, error: null })
      }))
    }));
    const optionInsertMock = vi.fn().mockResolvedValue({ error: null });

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "tests") return testsFromMock;
        if (table === "test_questions") return { insert: questionInsertMock };
        if (table === "test_question_options") return { insert: optionInsertMock };
        throw new Error(`Unexpected table: ${table}`);
      })
    });

    const { POST } = await import("@/app/api/admin/tests/route");
    const response = await POST(
      new NextRequest("http://localhost/api/admin/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildCreatePayload({
            activity_type: "test",
            assessment_kind: "placement",
            module_id: null,
            scoring_profile: { kind: "placement_v1" },
            questions: [
              {
                prompt: "Choose the correct answer",
                explanation: null,
                question_type: "single_choice",
                placement_band: "beginner",
                options: [
                  { option_text: "A", is_correct: true },
                  { option_text: "B", is_correct: false },
                  { option_text: "C", is_correct: false },
                  { option_text: "D", is_correct: false }
                ]
              }
            ]
          })
        )
      })
    );

    expect(response.status).toBe(201);
    expect(testsInsertMock).toHaveBeenCalledWith(expect.objectContaining({ assessment_kind: "placement", module_id: null }));
  });
});

describe("/api/admin/tests/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    requireStaffAdminApiMock.mockReset();
    createAdminClientMock.mockReset();
    writeAuditMock.mockReset();
  });

  it("returns full test detail with nested questions and attempts flag", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });

    const detailRow = buildDetailRow();
    const testsSingleMock = vi.fn().mockResolvedValue({ data: detailRow, error: null });
    const attemptsEqMock = vi.fn().mockResolvedValue({ count: 2, error: null });
    const attemptsSelectMock = vi.fn(() => ({ eq: attemptsEqMock }));

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "tests") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: testsSingleMock
              }))
            }))
          };
        }
        if (table === "student_test_attempts") {
          return {
            select: attemptsSelectMock
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      })
    });

    const { GET } = await import("@/app/api/admin/tests/[id]/route");
    const response = await GET(new NextRequest("http://localhost/api/admin/tests/test-1"), {
      params: Promise.resolve({ id: "test-1" })
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.has_attempts).toBe(true);
    expect(payload.questions).toHaveLength(1);
    expect(payload.questions[0]?.options).toHaveLength(4);
  });

  it("blocks question deletion for a test that already has attempts", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });

    const detailRow = buildDetailRow();
    const testsSingleMock = vi.fn().mockResolvedValue({ data: detailRow, error: null });
    const attemptsEqMock = vi.fn().mockResolvedValue({ count: 1, error: null });
    const attemptsSelectMock = vi.fn(() => ({ eq: attemptsEqMock }));

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "tests") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: testsSingleMock
              }))
            }))
          };
        }
        if (table === "student_test_attempts") {
          return {
            select: attemptsSelectMock
          };
        }
        if (table === "test_question_options" || table === "test_questions") {
          return {
            delete: vi.fn(() => ({
              in: vi.fn()
            })),
            update: vi.fn(() => ({
              eq: vi.fn()
            })),
            insert: vi.fn()
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      })
    });

    const { PATCH } = await import("@/app/api/admin/tests/[id]/route");
    const response = await PATCH(
      new NextRequest("http://localhost/api/admin/tests/test-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          questions: []
        })
      }),
      {
        params: Promise.resolve({ id: "test-1" })
      }
    );

    expect(response.status).toBe(409);
    const payload = await response.json();
    expect(payload.message).toContain("Нельзя удалять");
  });

  it("updates time limit on existing test", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });

    const beforeRow = buildDetailRow();
    const afterRow = { ...buildDetailRow(), time_limit_minutes: 25 };
    const testsSingleMock = vi.fn().mockResolvedValueOnce({ data: beforeRow, error: null }).mockResolvedValueOnce({ data: afterRow, error: null });
    const testsUpdateEqMock = vi.fn().mockResolvedValue({ error: null });
    const testsUpdateMock = vi.fn(() => ({ eq: testsUpdateEqMock }));
    const attemptsEqMock = vi.fn().mockResolvedValue({ count: 0, error: null });
    const attemptsSelectMock = vi.fn(() => ({ eq: attemptsEqMock }));

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "tests") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: testsSingleMock
              }))
            })),
            update: testsUpdateMock
          };
        }
        if (table === "student_test_attempts") {
          return {
            select: attemptsSelectMock
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      })
    });

    const { PATCH } = await import("@/app/api/admin/tests/[id]/route");
    const response = await PATCH(
      new NextRequest("http://localhost/api/admin/tests/test-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          time_limit_minutes: 25
        })
      }),
      {
        params: Promise.resolve({ id: "test-1" })
      }
    );

    expect(response.status).toBe(200);
    expect(testsUpdateMock).toHaveBeenCalledWith(expect.objectContaining({ time_limit_minutes: 25 }));
    const payload = await response.json();
    expect(payload.time_limit_minutes).toBe(25);
  });

  it("clears time limit on existing test", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });

    const beforeRow = buildDetailRow();
    const afterRow = { ...buildDetailRow(), time_limit_minutes: null };
    const testsSingleMock = vi.fn().mockResolvedValueOnce({ data: beforeRow, error: null }).mockResolvedValueOnce({ data: afterRow, error: null });
    const testsUpdateMock = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
    const attemptsSelectMock = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ count: 0, error: null }) }));

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "tests") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: testsSingleMock
              }))
            })),
            update: testsUpdateMock
          };
        }
        if (table === "student_test_attempts") {
          return {
            select: attemptsSelectMock
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      })
    });

    const { PATCH } = await import("@/app/api/admin/tests/[id]/route");
    const response = await PATCH(
      new NextRequest("http://localhost/api/admin/tests/test-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          time_limit_minutes: null
        })
      }),
      {
        params: Promise.resolve({ id: "test-1" })
      }
    );

    expect(response.status).toBe(200);
    expect(testsUpdateMock).toHaveBeenCalledWith(expect.objectContaining({ time_limit_minutes: null }));
    const payload = await response.json();
    expect(payload.time_limit_minutes).toBeNull();
  });
});
