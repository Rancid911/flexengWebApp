import { describe, expect, it, vi } from "vitest";

import {
  BLOG_CATEGORY_SELECT,
  BLOG_POST_SELECT,
  BLOG_TAG_SELECT,
  createAdminBlogRepository,
  type AdminBlogRepositoryClient
} from "@/lib/admin/blog.repository";

type SelectCall = [fields: string];

function createBlogRepositoryMock() {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    insert: vi.fn(() => query),
    maybeSingle: vi.fn(async () => ({ data: null, error: null })),
    single: vi.fn(async () => ({ data: null, error: null }))
  };
  const client = {
    from: vi.fn(() => query)
  } as unknown as AdminBlogRepositoryClient;

  return { client, query, repository: createAdminBlogRepository(client) };
}

describe("admin blog repository selects", () => {
  it("uses explicit select constants required by blog DTOs", () => {
    expect(BLOG_POST_SELECT).toContain("id");
    expect(BLOG_POST_SELECT).toContain("content");
    expect(BLOG_POST_SELECT).toContain("category_id");
    expect(BLOG_POST_SELECT).toContain("seo_description");
    expect(BLOG_POST_SELECT).toContain("updated_at");
    expect(BLOG_POST_SELECT).not.toContain("*");

    expect(BLOG_CATEGORY_SELECT).toBe("id, slug, name, sort_order, is_active");
    expect(BLOG_CATEGORY_SELECT).not.toContain("*");
    expect(BLOG_TAG_SELECT).toBe("id, slug, name");
    expect(BLOG_TAG_SELECT).not.toContain("*");
  });

  it("loads blog posts with the explicit post field list by default", () => {
    const { client, query, repository } = createBlogRepositoryMock();

    repository.loadPostById("post-1");
    repository.loadPostByIdRequired("post-2");

    expect(client.from).toHaveBeenNthCalledWith(1, "blog_posts");
    expect(client.from).toHaveBeenNthCalledWith(2, "blog_posts");
    expect(query.select).toHaveBeenNthCalledWith(1, BLOG_POST_SELECT);
    expect(query.select).toHaveBeenNthCalledWith(2, BLOG_POST_SELECT);
    const selectCalls = query.select.mock.calls as unknown as SelectCall[];
    expect(selectCalls[0]?.[0]).not.toContain("*");
    expect(selectCalls[1]?.[0]).not.toContain("*");
  });

  it("creates blog posts with the explicit post field list", () => {
    const { client, query, repository } = createBlogRepositoryMock();
    const payload = { slug: "grammar", title: "Grammar", content: "Body" };

    repository.createPost(payload);

    expect(client.from).toHaveBeenCalledWith("blog_posts");
    expect(query.insert).toHaveBeenCalledWith(payload);
    expect(query.select).toHaveBeenCalledWith(BLOG_POST_SELECT);
    const selectCalls = query.select.mock.calls as unknown as SelectCall[];
    expect(selectCalls[0]?.[0]).not.toContain("*");
    expect(query.single).toHaveBeenCalledTimes(1);
  });

  it("loads blog categories and tags with explicit field lists by default", () => {
    const { client, query, repository } = createBlogRepositoryMock();

    repository.loadCategoryById("category-1");
    repository.loadTagById("tag-1");

    expect(client.from).toHaveBeenNthCalledWith(1, "blog_categories");
    expect(client.from).toHaveBeenNthCalledWith(2, "blog_tags");
    expect(query.select).toHaveBeenNthCalledWith(1, BLOG_CATEGORY_SELECT);
    expect(query.select).toHaveBeenNthCalledWith(2, BLOG_TAG_SELECT);
    const selectCalls = query.select.mock.calls as unknown as SelectCall[];
    expect(selectCalls[0]?.[0]).not.toContain("*");
    expect(selectCalls[1]?.[0]).not.toContain("*");
  });
});
