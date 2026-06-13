import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, createRepositoryMock, writeAuditMock, repository } = vi.hoisted(() => {
  const repository = {
    listPosts: vi.fn(),
    loadPostById: vi.fn(),
    loadPostByIdRequired: vi.fn(),
    createPost: vi.fn(),
    updatePost: vi.fn(),
    deletePost: vi.fn(),
    listCategories: vi.fn(),
    loadCategoriesByIds: vi.fn(),
    loadCategoryById: vi.fn(),
    loadCategoryBySlug: vi.fn(),
    loadCategoryByName: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    listTags: vi.fn(),
    loadTagsByIds: vi.fn(),
    loadTagsBySlugs: vi.fn(),
    loadTagById: vi.fn(),
    createTags: vi.fn(),
    createTag: vi.fn(),
    updateTag: vi.fn(),
    deleteTag: vi.fn(),
    loadPostTagRelations: vi.fn(),
    createPostTagRelations: vi.fn(),
    deletePostTagRelations: vi.fn()
  };

  return {
    createClientMock: vi.fn(),
    createRepositoryMock: vi.fn((client: unknown) => {
      void client;
      return repository;
    }),
    writeAuditMock: vi.fn(),
    repository
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
}));

vi.mock("@/lib/admin/blog.repository", () => ({
  createAdminBlogRepository: (client: unknown) => createRepositoryMock(client)
}));

vi.mock("@/lib/admin/audit", () => ({
  writeAudit: (entry: unknown) => writeAuditMock(entry)
}));

function resetRepositoryMocks() {
  repository.listPosts.mockReset();
  repository.loadPostById.mockReset();
  repository.loadPostByIdRequired.mockReset();
  repository.createPost.mockReset();
  repository.updatePost.mockReset();
  repository.deletePost.mockReset();
  repository.listCategories.mockReset();
  repository.loadCategoriesByIds.mockReset();
  repository.loadCategoryById.mockReset();
  repository.loadCategoryBySlug.mockReset();
  repository.loadCategoryByName.mockReset();
  repository.createCategory.mockReset();
  repository.updateCategory.mockReset();
  repository.deleteCategory.mockReset();
  repository.listTags.mockReset();
  repository.loadTagsByIds.mockReset();
  repository.loadTagsBySlugs.mockReset();
  repository.loadTagById.mockReset();
  repository.createTags.mockReset();
  repository.createTag.mockReset();
  repository.updateTag.mockReset();
  repository.deleteTag.mockReset();
  repository.loadPostTagRelations.mockReset();
  repository.createPostTagRelations.mockReset();
  repository.deletePostTagRelations.mockReset();
}

function makePostRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    slug: "grammar-basics",
    title: "Grammar Basics",
    excerpt: "Short intro",
    content: "Full content",
    cover_image_url: null,
    status: "draft",
    published_at: null,
    author_name: "Admin",
    category_id: "category-1",
    reading_time_min: 5,
    views_count: 0,
    seo_title: null,
    seo_description: null,
    created_at: "2026-05-08T07:00:00.000Z",
    updated_at: "2026-05-08T07:00:00.000Z",
    ...overrides
  };
}

describe("admin blog service", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    createRepositoryMock.mockClear();
    writeAuditMock.mockReset();
    resetRepositoryMocks();
  });

  it("lists blog posts through an injected user-scoped repository client", async () => {
    const userClient = { from: vi.fn() };
    createClientMock.mockResolvedValue(userClient);
    repository.listPosts.mockResolvedValue({ data: [makePostRow()], error: null, count: 1 });
    repository.loadCategoriesByIds.mockResolvedValue({
      data: [{ id: "category-1", slug: "grammar", name: "Grammar", sort_order: 0, is_active: true }],
      error: null
    });
    repository.loadPostTagRelations.mockResolvedValue({ data: [], error: null });

    const { listAdminBlogPosts } = await import("@/lib/admin/blog.service");
    const result = await listAdminBlogPosts({ page: 1, pageSize: 20, q: "grammar" });

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createRepositoryMock).toHaveBeenCalledWith(userClient);
    expect(repository.listPosts).toHaveBeenCalledWith({ from: 0, to: 19, q: "grammar" });
    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({ id: "post-1", title: "Grammar Basics" });
  });

  it("creates blog posts through the user-scoped repository and keeps audit writes", async () => {
    const userClient = { from: vi.fn() };
    createClientMock.mockResolvedValue(userClient);
    repository.createPost.mockResolvedValue({ data: makePostRow({ category_id: null }), error: null });
    repository.loadPostTagRelations.mockResolvedValue({ data: [], error: null });

    const { createAdminBlogPost } = await import("@/lib/admin/blog.service");
    const result = await createAdminBlogPost(
      { userId: "admin-1", role: "admin" },
      {
        slug: "grammar-basics",
        title: "Grammar Basics",
        excerpt: "Short intro",
        content: "Full content",
        status: "draft",
        views_count: 0,
        tag_names: []
      }
    );

    expect(createRepositoryMock).toHaveBeenCalledWith(userClient);
    expect(repository.createPost).toHaveBeenCalledWith(expect.objectContaining({ slug: "grammar-basics", status: "draft" }));
    expect(writeAuditMock).toHaveBeenCalledWith(expect.objectContaining({ action: "create", entity: "blog_posts" }));
    expect(result.id).toBe("post-1");
  });
});
