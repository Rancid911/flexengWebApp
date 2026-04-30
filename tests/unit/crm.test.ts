import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildCrmBoard, deleteCrmLead, getCrmUnreadNewRequestsCount, markCrmLeadViewed } from "@/lib/crm/queries";
import { CRM_STAGES } from "@/lib/crm/stages";
import { crmLeadStatusUpdateSchema, publicLeadCreateSchema } from "@/lib/crm/validation";

const createAdminClientMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock()
}));

describe("CRM helpers", () => {
  beforeEach(() => {
    createAdminClientMock.mockReset();
  });

  it("validates public lead payloads", () => {
    const parsed = publicLeadCreateSchema.safeParse({
      name: "Анна",
      phone: "+7 (999) 111 22 33",
      email: "anna@example.com",
      source: "website",
      form_type: "main_lead_form",
      page_url: "https://example.com/",
      metadata: { audience: "adult" }
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid lead emails", () => {
    const parsed = publicLeadCreateSchema.safeParse({
      name: "Анна",
      phone: "+7 (999) 111 22 33",
      email: "wrong",
      form_type: "main_lead_form"
    });

    expect(parsed.success).toBe(false);
  });

  it("allows only fixed CRM statuses", () => {
    expect(crmLeadStatusUpdateSchema.safeParse({ status: "thinking" }).success).toBe(true);
    expect(crmLeadStatusUpdateSchema.safeParse({ status: "unknown" }).success).toBe(false);
  });

  it("builds a board with all stages and places leads into matching columns", () => {
    const board = buildCrmBoard([
      {
        id: "lead-1",
        name: "Анна",
        phone: "+79991112233",
        email: "anna@example.com",
        source: "website",
        form_type: "main_lead_form",
        page_url: null,
        comment: null,
        status: "new_request",
        viewed_at: null,
        viewed_by: null,
        created_at: "2026-04-24T10:00:00.000Z",
        updated_at: "2026-04-24T10:00:00.000Z"
      }
    ]);

    expect(board.stages).toHaveLength(CRM_STAGES.length);
    expect(board.stages[0]).toMatchObject({ slug: "new_request", title: "Новый запрос" });
    expect(board.stages[0]?.leads).toHaveLength(1);
  });

  it("deletes CRM leads by id", async () => {
    const deleteEqMock = vi.fn().mockResolvedValue({ error: null });
    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "crm_leads") throw new Error(`Unexpected table: ${table}`);
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: "lead-1" }, error: null })
            }))
          })),
          delete: vi.fn(() => ({
            eq: deleteEqMock
          }))
        };
      })
    });

    await expect(deleteCrmLead("lead-1")).resolves.toBe(true);
    expect(deleteEqMock).toHaveBeenCalledWith("id", "lead-1");
  });

  it("counts unread leads only in the new request stage", async () => {
    const eqMock = vi.fn(() => ({ is: isMock }));
    const isMock = vi.fn().mockResolvedValue({ count: 3, error: null });
    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "crm_leads") throw new Error(`Unexpected table: ${table}`);
        return {
          select: vi.fn(() => ({
            eq: eqMock
          }))
        };
      })
    });

    await expect(getCrmUnreadNewRequestsCount()).resolves.toBe(3);
    expect(eqMock).toHaveBeenCalledWith("status", "new_request");
    expect(isMock).toHaveBeenCalledWith("viewed_at", null);
  });

  it("marks a lead viewed only when it was not viewed before", async () => {
    const updateEqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn(() => ({ eq: updateEqMock }));
    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "crm_leads") throw new Error(`Unexpected table: ${table}`);
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: { id: "lead-1", viewed_at: null }, error: null })
            }))
          })),
          update: updateMock
        };
      })
    });

    await expect(markCrmLeadViewed("lead-1", "admin-1")).resolves.toBe(true);
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ viewed_by: "admin-1" }));
    expect(updateEqMock).toHaveBeenCalledWith("id", "lead-1");
  });
});
