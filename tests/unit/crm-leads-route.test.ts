import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const createAdminClientMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClientMock()
}));

describe("/api/leads", () => {
  beforeEach(() => {
    vi.resetModules();
    createAdminClientMock.mockReset();
  });

  it("creates a lead in the first CRM stage and writes initial history", async () => {
    const leadInsertMock = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: { id: "lead-1" }, error: null })
      }))
    }));
    const historyInsertMock = vi.fn().mockResolvedValue({ error: null });

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "crm_leads") return { insert: leadInsertMock };
        if (table === "crm_lead_status_history") return { insert: historyInsertMock };
        throw new Error(`Unexpected table: ${table}`);
      })
    });

    const { POST } = await import("@/app/api/leads/route");
    const response = await POST(
      new NextRequest("http://localhost/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Анна",
          phone: "+7 (999) 111 22 33",
          email: "anna@example.com",
          source: "website",
          form_type: "main_lead_form",
          page_url: "https://example.com/"
        })
      })
    );

    expect(response.status).toBe(201);
    expect(leadInsertMock).toHaveBeenCalledWith(expect.objectContaining({ status: "new_request" }));
    expect(historyInsertMock).toHaveBeenCalledWith(expect.objectContaining({ lead_id: "lead-1", from_status: null, to_status: "new_request" }));
  });

  it("rejects invalid payloads", async () => {
    const { POST } = await import("@/app/api/leads/route");
    const response = await POST(
      new NextRequest("http://localhost/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "", phone: "", email: "bad", form_type: "" })
      })
    );

    expect(response.status).toBe(400);
  });
});
