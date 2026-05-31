import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { adminWordCardSetCreateSchema } from "@/lib/admin/validation";

const requireAdminApiPermissionMock = vi.fn();
const listAdminWordCardSetsMock = vi.fn();
const getAdminWordCardSetMock = vi.fn();
const createAdminWordCardSetMock = vi.fn();
const updateAdminWordCardSetMock = vi.fn();
const deleteAdminWordCardSetMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  requireAdminApiPermission: async (...args: unknown[]) => {
    const actor = await requireAdminApiPermissionMock(...args);
    const permission = args[0];
    if (actor?.role === "teacher" || (actor?.role === "manager" && (permission === "users.manage" || permission === "roles.view"))) {
      throw { status: 403, code: "FORBIDDEN", message: "Permission denied" };
    }
    return actor;
  }
}));

vi.mock("@/lib/admin/word-card-sets.service", () => ({
  listAdminWordCardSets: (...args: unknown[]) => listAdminWordCardSetsMock(...args),
  getAdminWordCardSet: (...args: unknown[]) => getAdminWordCardSetMock(...args),
  createAdminWordCardSet: (...args: unknown[]) => createAdminWordCardSetMock(...args),
  updateAdminWordCardSet: (...args: unknown[]) => updateAdminWordCardSetMock(...args),
  deleteAdminWordCardSet: (...args: unknown[]) => deleteAdminWordCardSetMock(...args)
}));

const cards = Array.from({ length: 5 }, (_, index) => ({
  term: `word ${index + 1}`,
  translation: `слово ${index + 1}`,
  example_sentence: `Example sentence ${index + 1}.`,
  example_translation: `Пример ${index + 1}.`,
  sort_order: index
}));

describe("admin word card set validation", () => {
  it("requires CEFR for card sets", () => {
    const parsed = adminWordCardSetCreateSchema.safeParse({
      title: "Cafe words",
      topic_slug: "food",
      topic_title: "Еда",
      is_published: false,
      cards
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.cefr_level).toBeTruthy();
    }
  });

  it("rejects unsupported CEFR values", () => {
    const parsed = adminWordCardSetCreateSchema.safeParse({
      title: "Cafe words",
      topic_slug: "food",
      topic_title: "Еда",
      cefr_level: "C2",
      is_published: false,
      cards
    });

    expect(parsed.success).toBe(false);
  });

  it("requires at least five cards before publishing", () => {
    const parsed = adminWordCardSetCreateSchema.safeParse({
      title: "Cafe words",
      topic_slug: "food",
      topic_title: "Еда",
      cefr_level: "A1",
      is_published: true,
      cards: cards.slice(0, 4)
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.cards).toContain("published word card set requires at least 5 cards");
    }
  });
});

describe("admin word card set API routes", () => {
  beforeEach(() => {
    vi.resetModules();
    requireAdminApiPermissionMock.mockReset();
    listAdminWordCardSetsMock.mockReset();
    getAdminWordCardSetMock.mockReset();
    createAdminWordCardSetMock.mockReset();
    updateAdminWordCardSetMock.mockReset();
    deleteAdminWordCardSetMock.mockReset();
  });

  it("lists word card sets for staff actors with card-set management permission", async () => {
    requireAdminApiPermissionMock.mockResolvedValue({ userId: "manager-1", role: "manager" });
    listAdminWordCardSetsMock.mockResolvedValue({ items: [], total: 0, page: 2, pageSize: 10 });

    const { GET } = await import("@/app/api/admin/word-card-sets/route");
    const response = await GET(new NextRequest("http://localhost/api/admin/word-card-sets?page=2&pageSize=10&q=food"));

    expect(response.status).toBe(200);
    expect(listAdminWordCardSetsMock).toHaveBeenCalledWith({ page: 2, pageSize: 10, q: "food" });
  });

  it("loads word card set details only after permission check", async () => {
    requireAdminApiPermissionMock.mockResolvedValue({ userId: "admin-1", role: "admin" });
    getAdminWordCardSetMock.mockResolvedValue({ id: "set-1", title: "Cafe words", cards: [] });

    const { GET } = await import("@/app/api/admin/word-card-sets/[id]/route");
    const response = await GET(new NextRequest("http://localhost/api/admin/word-card-sets/set-1"), {
      params: Promise.resolve({ id: "set-1" })
    });

    expect(response.status).toBe(200);
    expect(getAdminWordCardSetMock).toHaveBeenCalledWith("set-1");
  });

  it("passes the actor through when creating, updating and deleting card sets", async () => {
    const actor = { userId: "admin-1", role: "admin" };
    const createPayload = {
      title: "Cafe words",
      description: null,
      topic_slug: "food",
      topic_title: "Еда",
      cefr_level: "A1",
      is_published: false,
      cards
    };
    requireAdminApiPermissionMock.mockResolvedValue(actor);
    createAdminWordCardSetMock.mockResolvedValue({ id: "set-1", title: "Cafe words" });
    updateAdminWordCardSetMock.mockResolvedValue({ id: "set-1", title: "Cafe words updated" });
    deleteAdminWordCardSetMock.mockResolvedValue({ ok: true });

    const { POST } = await import("@/app/api/admin/word-card-sets/route");
    const createResponse = await POST(
      new NextRequest("http://localhost/api/admin/word-card-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload)
      })
    );

    const { PATCH, DELETE } = await import("@/app/api/admin/word-card-sets/[id]/route");
    const updateResponse = await PATCH(
      new NextRequest("http://localhost/api/admin/word-card-sets/set-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Cafe words updated" })
      }),
      { params: Promise.resolve({ id: "set-1" }) }
    );
    const deleteResponse = await DELETE(new NextRequest("http://localhost/api/admin/word-card-sets/set-1", { method: "DELETE" }), {
      params: Promise.resolve({ id: "set-1" })
    });

    expect(createResponse.status).toBe(201);
    expect(updateResponse.status).toBe(200);
    expect(deleteResponse.status).toBe(200);
    expect(createAdminWordCardSetMock).toHaveBeenCalledWith(actor, createPayload);
    expect(updateAdminWordCardSetMock).toHaveBeenCalledWith(actor, "set-1", { title: "Cafe words updated", is_published: false });
    expect(deleteAdminWordCardSetMock).toHaveBeenCalledWith(actor, "set-1");
  });

  it("does not call services when a non-staff actor lacks card-set management permission", async () => {
    requireAdminApiPermissionMock.mockResolvedValue({ userId: "teacher-1", role: "teacher" });

    const { GET } = await import("@/app/api/admin/word-card-sets/route");
    const response = await GET(new NextRequest("http://localhost/api/admin/word-card-sets"));

    expect(response.status).toBe(403);
    expect(listAdminWordCardSetsMock).not.toHaveBeenCalled();
  });
});
