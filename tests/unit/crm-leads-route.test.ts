import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const createServerClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => createServerClientMock()
}));

describe("/api/leads", () => {
  beforeEach(() => {
    vi.resetModules();
    createServerClientMock.mockReset();
  });

  it("creates a lead in the first CRM stage and writes initial history", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: [{ id: "lead-1", status: "new_request" }],
      error: null
    });
    createServerClientMock.mockReturnValue({ rpc: rpcMock });

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
          page_url: "https://example.com/",
          metadata: {
            audience: "adult",
            consent_personal_data: true,
            consent_marketing: false
          }
        })
      })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: "lead-1", status: "new_request" });
    expect(rpcMock).toHaveBeenCalledWith("create_public_crm_lead", {
      p_name: "Анна",
      p_phone: "+7 (999) 111 22 33",
      p_email: "anna@example.com",
      p_form_type: "main_lead_form",
      p_comment: null,
      p_source: "website",
      p_page_url: "https://example.com/",
      p_metadata: {
        audience: "adult",
        consent_personal_data: true,
        consent_marketing: false
      }
    });
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
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("maps RPC failures to lead create failures", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "permission denied" }
    });
    createServerClientMock.mockReturnValue({ rpc: rpcMock });

    const { POST } = await import("@/app/api/leads/route");
    const response = await POST(
      new NextRequest("http://localhost/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Анна",
          phone: "+7 (999) 111 22 33",
          email: "anna@example.com",
          form_type: "main_lead_form"
        })
      })
    );

    expect(response.status).toBe(500);
    expect(rpcMock).toHaveBeenCalledTimes(1);
  });
});
