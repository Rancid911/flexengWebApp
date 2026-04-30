import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { AdminHttpError } from "@/lib/admin/http";

const requireStaffAdminApiMock = vi.fn();
const loadCrmLeadDetailMock = vi.fn();
const markCrmLeadViewedMock = vi.fn();
const getCrmUnreadNewRequestsCountMock = vi.fn();
const updateCrmLeadStatusMock = vi.fn();
const createCrmLeadCommentMock = vi.fn();
const deleteCrmLeadMock = vi.fn();
const loadCrmSettingsMock = vi.fn();
const updateCrmSettingsMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  requireStaffAdminApi: () => requireStaffAdminApiMock()
}));

vi.mock("@/lib/crm/queries", () => ({
  loadCrmLeadDetail: (...args: unknown[]) => loadCrmLeadDetailMock(...args),
  markCrmLeadViewed: (...args: unknown[]) => markCrmLeadViewedMock(...args),
  getCrmUnreadNewRequestsCount: (...args: unknown[]) => getCrmUnreadNewRequestsCountMock(...args),
  updateCrmLeadStatus: (...args: unknown[]) => updateCrmLeadStatusMock(...args),
  createCrmLeadComment: (...args: unknown[]) => createCrmLeadCommentMock(...args),
  deleteCrmLead: (...args: unknown[]) => deleteCrmLeadMock(...args),
  loadCrmSettings: (...args: unknown[]) => loadCrmSettingsMock(...args),
  updateCrmSettings: (...args: unknown[]) => updateCrmSettingsMock(...args)
}));

describe("CRM protected API routes", () => {
  beforeEach(() => {
    vi.resetModules();
    requireStaffAdminApiMock.mockReset();
    loadCrmLeadDetailMock.mockReset();
    markCrmLeadViewedMock.mockReset();
    getCrmUnreadNewRequestsCountMock.mockReset();
    updateCrmLeadStatusMock.mockReset();
    createCrmLeadCommentMock.mockReset();
    deleteCrmLeadMock.mockReset();
    loadCrmSettingsMock.mockReset();
    updateCrmSettingsMock.mockReset();
  });

  it("returns unread CRM summary for staff users", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
    getCrmUnreadNewRequestsCountMock.mockResolvedValue(7);

    const { GET } = await import("@/app/api/crm/unread-summary/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ unreadCount: 7 });
  });

  it("returns CRM settings for staff users", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
    loadCrmSettingsMock.mockResolvedValue({ background_image_url: null, updated_at: null });

    const { GET } = await import("@/app/api/crm/settings/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ background_image_url: null, updated_at: null });
  });

  it("updates CRM background setting", async () => {
    const actor = { userId: "manager-1", role: "manager" };
    requireStaffAdminApiMock.mockResolvedValue(actor);
    updateCrmSettingsMock.mockResolvedValue({
      background_image_url: "https://example.com/crm-bg.jpg",
      updated_at: "2026-04-24T12:00:00.000Z"
    });

    const { PATCH } = await import("@/app/api/crm/settings/route");
    const response = await PATCH(
      new NextRequest("http://localhost/api/crm/settings", {
        method: "PATCH",
        body: JSON.stringify({ background_image_url: "https://example.com/crm-bg.jpg" })
      })
    );

    expect(response.status).toBe(200);
    expect(updateCrmSettingsMock).toHaveBeenCalledWith(actor, { background_image_url: "https://example.com/crm-bg.jpg" });
  });

  it("clears CRM background setting", async () => {
    const actor = { userId: "admin-1", role: "admin" };
    requireStaffAdminApiMock.mockResolvedValue(actor);
    updateCrmSettingsMock.mockResolvedValue({ background_image_url: null, updated_at: "2026-04-24T12:00:00.000Z" });

    const { PATCH } = await import("@/app/api/crm/settings/route");
    const response = await PATCH(
      new NextRequest("http://localhost/api/crm/settings", {
        method: "PATCH",
        body: JSON.stringify({ background_image_url: null })
      })
    );

    expect(response.status).toBe(200);
    expect(updateCrmSettingsMock).toHaveBeenCalledWith(actor, { background_image_url: null });
  });

  it("rejects invalid CRM background settings payload", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });

    const { PATCH } = await import("@/app/api/crm/settings/route");
    const response = await PATCH(
      new NextRequest("http://localhost/api/crm/settings", {
        method: "PATCH",
        body: JSON.stringify({ background_image_url: "javascript:alert(1)" })
      })
    );

    expect(response.status).toBe(400);
    expect(updateCrmSettingsMock).not.toHaveBeenCalled();
  });

  it("marks an unread lead as viewed when details are opened", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "manager-1", role: "manager" });
    loadCrmLeadDetailMock
      .mockResolvedValueOnce({ id: "lead-1", viewed_at: null })
      .mockResolvedValueOnce({ id: "lead-1", viewed_at: "2026-04-24T10:00:00.000Z" });
    markCrmLeadViewedMock.mockResolvedValue(true);

    const { GET } = await import("@/app/api/crm/leads/[id]/route");
    const response = await GET(new NextRequest("http://localhost/api/crm/leads/lead-1"), {
      params: Promise.resolve({ id: "lead-1" })
    });

    expect(response.status).toBe(200);
    expect(markCrmLeadViewedMock).toHaveBeenCalledWith("lead-1", "manager-1");
    expect(loadCrmLeadDetailMock).toHaveBeenCalledTimes(2);
  });

  it("does not overwrite viewed fields when an already viewed lead is opened", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
    loadCrmLeadDetailMock.mockResolvedValue({ id: "lead-1", viewed_at: "2026-04-24T10:00:00.000Z" });

    const { GET } = await import("@/app/api/crm/leads/[id]/route");
    const response = await GET(new NextRequest("http://localhost/api/crm/leads/lead-1"), {
      params: Promise.resolve({ id: "lead-1" })
    });

    expect(response.status).toBe(200);
    expect(markCrmLeadViewedMock).not.toHaveBeenCalled();
  });

  it("updates lead status as the authenticated staff actor", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
    updateCrmLeadStatusMock.mockResolvedValue({ id: "lead-1", status: "thinking" });

    const { PATCH } = await import("@/app/api/crm/leads/[id]/status/route");
    const response = await PATCH(
      new NextRequest("http://localhost/api/crm/leads/lead-1/status", {
        method: "PATCH",
        body: JSON.stringify({ status: "thinking" })
      }),
      { params: Promise.resolve({ id: "lead-1" }) }
    );

    expect(response.status).toBe(200);
    expect(updateCrmLeadStatusMock).toHaveBeenCalledWith({ leadId: "lead-1", status: "thinking", actorUserId: "admin-1" });
  });

  it("rejects protected CRM routes for non-staff users", async () => {
    requireStaffAdminApiMock.mockRejectedValue(new AdminHttpError(403, "FORBIDDEN", "Admin access required"));

    const { PATCH } = await import("@/app/api/crm/leads/[id]/status/route");
    const response = await PATCH(
      new NextRequest("http://localhost/api/crm/leads/lead-1/status", {
        method: "PATCH",
        body: JSON.stringify({ status: "thinking" })
      }),
      { params: Promise.resolve({ id: "lead-1" }) }
    );

    expect(response.status).toBe(403);
    expect(updateCrmLeadStatusMock).not.toHaveBeenCalled();
  });

  it("adds manager comments to lead details", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "manager-1", role: "manager" });
    createCrmLeadCommentMock.mockResolvedValue({ id: "lead-1", comments: [{ id: "comment-1", body: "Позвонить завтра" }] });

    const { POST } = await import("@/app/api/crm/leads/[id]/comments/route");
    const response = await POST(
      new NextRequest("http://localhost/api/crm/leads/lead-1/comments", {
        method: "POST",
        body: JSON.stringify({ body: "Позвонить завтра" })
      }),
      { params: Promise.resolve({ id: "lead-1" }) }
    );

    expect(response.status).toBe(201);
    expect(createCrmLeadCommentMock).toHaveBeenCalledWith({ leadId: "lead-1", body: "Позвонить завтра", actorUserId: "manager-1" });
  });

  it("deletes a lead for staff users", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "manager-1", role: "manager" });
    deleteCrmLeadMock.mockResolvedValue(true);

    const { DELETE } = await import("@/app/api/crm/leads/[id]/route");
    const response = await DELETE(new NextRequest("http://localhost/api/crm/leads/lead-1", { method: "DELETE" }), {
      params: Promise.resolve({ id: "lead-1" })
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, id: "lead-1" });
    expect(deleteCrmLeadMock).toHaveBeenCalledWith("lead-1");
  });

  it("returns 404 when deleting an unknown lead", async () => {
    requireStaffAdminApiMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
    deleteCrmLeadMock.mockResolvedValue(false);

    const { DELETE } = await import("@/app/api/crm/leads/[id]/route");
    const response = await DELETE(new NextRequest("http://localhost/api/crm/leads/missing", { method: "DELETE" }), {
      params: Promise.resolve({ id: "missing" })
    });

    expect(response.status).toBe(404);
  });
});
