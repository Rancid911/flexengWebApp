import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireAdminApiPermissionMock = vi.fn();
const listAdminBlogPostsMock = vi.fn();
const createAdminBlogPostMock = vi.fn();
const updateAdminBlogPostMock = vi.fn();
const deleteAdminBlogPostMock = vi.fn();
const listAdminBlogCategoriesMock = vi.fn();
const createAdminBlogCategoryMock = vi.fn();
const updateAdminBlogTagMock = vi.fn();
const deleteAdminBlogTagMock = vi.fn();

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

vi.mock("@/lib/admin/blog.service", () => ({
  listAdminBlogPosts: (...args: unknown[]) => listAdminBlogPostsMock(...args),
  createAdminBlogPost: (...args: unknown[]) => createAdminBlogPostMock(...args),
  updateAdminBlogPost: (...args: unknown[]) => updateAdminBlogPostMock(...args),
  deleteAdminBlogPost: (...args: unknown[]) => deleteAdminBlogPostMock(...args),
  listAdminBlogCategories: (...args: unknown[]) => listAdminBlogCategoriesMock(...args),
  createAdminBlogCategory: (...args: unknown[]) => createAdminBlogCategoryMock(...args),
  updateAdminBlogCategory: vi.fn(),
  deleteAdminBlogCategory: vi.fn(),
  listAdminBlogTags: vi.fn(),
  createAdminBlogTag: vi.fn(),
  updateAdminBlogTag: (...args: unknown[]) => updateAdminBlogTagMock(...args),
  deleteAdminBlogTag: (...args: unknown[]) => deleteAdminBlogTagMock(...args)
}));

describe("admin blog API routes", () => {
  beforeEach(() => {
    vi.resetModules();
    requireAdminApiPermissionMock.mockReset();
    listAdminBlogPostsMock.mockReset();
    createAdminBlogPostMock.mockReset();
    updateAdminBlogPostMock.mockReset();
    deleteAdminBlogPostMock.mockReset();
    listAdminBlogCategoriesMock.mockReset();
    createAdminBlogCategoryMock.mockReset();
    updateAdminBlogTagMock.mockReset();
    deleteAdminBlogTagMock.mockReset();
  });

  it("lists posts for staff actors with content management permission", async () => {
    requireAdminApiPermissionMock.mockResolvedValue({ userId: "manager-1", role: "manager" });
    listAdminBlogPostsMock.mockResolvedValue({ items: [], total: 0, page: 2, pageSize: 10 });

    const { GET } = await import("@/app/api/admin/blog/posts/route");
    const response = await GET(new NextRequest("http://localhost/api/admin/blog/posts?page=2&pageSize=10&q=grammar"));

    expect(response.status).toBe(200);
    expect(listAdminBlogPostsMock).toHaveBeenCalledWith({ page: 2, pageSize: 10, q: "grammar" });
  });

  it("passes the actor through when creating and updating blog content", async () => {
    const actor = { userId: "admin-1", role: "admin" };
    requireAdminApiPermissionMock.mockResolvedValue(actor);
    createAdminBlogCategoryMock.mockResolvedValue({ id: "category-1", slug: "grammar" });
    updateAdminBlogTagMock.mockResolvedValue({ id: "tag-1", slug: "a1-updated" });

    const { POST } = await import("@/app/api/admin/blog/categories/route");
    const createResponse = await POST(
      new NextRequest("http://localhost/api/admin/blog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Grammar", slug: "grammar" })
      })
    );

    const { PATCH } = await import("@/app/api/admin/blog/tags/[id]/route");
    const updateResponse = await PATCH(
      new NextRequest("http://localhost/api/admin/blog/tags/tag-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "A1 Updated" })
      }),
      { params: Promise.resolve({ id: "tag-1" }) }
    );

    expect(createResponse.status).toBe(201);
    expect(updateResponse.status).toBe(200);
    expect(createAdminBlogCategoryMock).toHaveBeenCalledWith(actor, { name: "Grammar", slug: "grammar", sort_order: 0, is_active: true });
    expect(updateAdminBlogTagMock).toHaveBeenCalledWith(actor, "tag-1", { name: "A1 Updated" });
  });

  it("passes the actor through when deleting blog content", async () => {
    const actor = { userId: "admin-1", role: "admin" };
    requireAdminApiPermissionMock.mockResolvedValue(actor);
    deleteAdminBlogPostMock.mockResolvedValue({ ok: true, id: "post-1" });

    const { DELETE } = await import("@/app/api/admin/blog/posts/[id]/route");
    const response = await DELETE(new NextRequest("http://localhost/api/admin/blog/posts/post-1", { method: "DELETE" }), {
      params: Promise.resolve({ id: "post-1" })
    });

    expect(response.status).toBe(200);
    expect(deleteAdminBlogPostMock).toHaveBeenCalledWith(actor, "post-1");
  });

  it("does not call services when a non-staff actor lacks content management permission", async () => {
    requireAdminApiPermissionMock.mockResolvedValue({ userId: "teacher-1", role: "teacher" });

    const { GET } = await import("@/app/api/admin/blog/categories/route");
    const response = await GET();

    expect(response.status).toBe(403);
    expect(listAdminBlogCategoriesMock).not.toHaveBeenCalled();
  });
});
