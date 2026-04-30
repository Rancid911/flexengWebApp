import { writeAudit } from "@/lib/admin/audit";
import {
  type BlogRow,
  slugify,
  toBlogPostDetailDto,
  toCategoryDto,
  toTagDto
} from "@/lib/admin/blog";
import { createAdminBlogRepository } from "@/lib/admin/blog.repository";
import { AdminHttpError, paginated } from "@/lib/admin/http";
import type { AdminActor, BlogCategoryDto, BlogPostDetailDto, BlogTagDto, PaginatedResponse } from "@/lib/admin/types";
import type {
  blogCategoryCreateSchema,
  blogCategoryUpdateSchema,
  blogPostCreateSchema,
  blogPostUpdateSchema,
  blogTagCreateSchema,
  blogTagUpdateSchema
} from "@/lib/admin/validation";
import type { z } from "zod";

type BlogPostCreatePayload = z.infer<typeof blogPostCreateSchema>;
type BlogPostUpdatePayload = z.infer<typeof blogPostUpdateSchema>;
type BlogCategoryCreatePayload = z.infer<typeof blogCategoryCreateSchema>;
type BlogCategoryUpdatePayload = z.infer<typeof blogCategoryUpdateSchema>;
type BlogTagCreatePayload = z.infer<typeof blogTagCreateSchema>;
type BlogTagUpdatePayload = z.infer<typeof blogTagUpdateSchema>;

type AdminBlogRepository = ReturnType<typeof createAdminBlogRepository>;

type PaginationInput = {
  page: number;
  pageSize: number;
  q?: string | null;
};

function asBlogRows(value: unknown): BlogRow[] {
  return Array.isArray(value) ? (value as BlogRow[]) : [];
}

function asBlogRow(value: unknown): BlogRow {
  return (value ?? {}) as BlogRow;
}

async function loadCategoryMap(repository: AdminBlogRepository, categoryIds: string[], errorCode: string): Promise<Map<string, BlogCategoryDto>> {
  if (categoryIds.length === 0) return new Map();

  const { data, error } = await repository.loadCategoriesByIds(categoryIds);
  if (error) throw new AdminHttpError(500, errorCode, "Failed to fetch blog categories", error.message);

  return new Map<string, BlogCategoryDto>(asBlogRows(data).map((row) => [String(row.id), toCategoryDto(row)] as [string, BlogCategoryDto]));
}

async function loadTagsByPostId(repository: AdminBlogRepository, postIds: string[], errorCode: string): Promise<Map<string, BlogTagDto[]>> {
  if (postIds.length === 0) return new Map();

  const { data: relations, error: relationError } = await repository.loadPostTagRelations(postIds);
  if (relationError) throw new AdminHttpError(500, errorCode, "Failed to fetch blog tag relations", relationError.message);

  const tagIds = Array.from(new Set(asBlogRows(relations).map((row) => String(row.tag_id ?? "")).filter(Boolean)));
  if (tagIds.length === 0) return new Map();

  const { data: tags, error: tagsError } = await repository.loadTagsByIds(tagIds);
  if (tagsError) throw new AdminHttpError(500, errorCode, "Failed to fetch blog tags", tagsError.message);

  const tagMap = new Map<string, BlogTagDto>(asBlogRows(tags).map((row) => [String(row.id), toTagDto(row)] as [string, BlogTagDto]));
  const tagsByPostId = new Map<string, BlogTagDto[]>();

  for (const relation of asBlogRows(relations)) {
    const postId = String(relation.post_id ?? "");
    const tagId = String(relation.tag_id ?? "");
    const tag = tagMap.get(tagId);
    if (!postId || !tag) continue;

    const list = tagsByPostId.get(postId) ?? [];
    list.push(tag);
    tagsByPostId.set(postId, list);
  }

  return tagsByPostId;
}

async function ensureTagIdsByNames(repository: AdminBlogRepository, tagNames: string[]): Promise<string[]> {
  const normalized = Array.from(new Set(tagNames.map((name) => name.trim()).filter(Boolean)));
  if (normalized.length === 0) return [];

  const slugs = normalized.map((name) => slugify(name));
  const { data: existingTags, error: existingError } = await repository.loadTagsBySlugs(slugs);
  if (existingError) throw new AdminHttpError(500, "BLOG_TAGS_FETCH_FAILED", "Failed to fetch existing tags", existingError.message);

  const existingSlugSet = new Set(asBlogRows(existingTags).map((row) => String(row.slug ?? "")));
  const toCreate = normalized
    .map((name) => ({ name, slug: slugify(name) }))
    .filter((tag) => tag.slug && !existingSlugSet.has(tag.slug));

  if (toCreate.length > 0) {
    const { error: insertError } = await repository.createTags(toCreate);
    if (insertError) throw new AdminHttpError(500, "BLOG_TAGS_CREATE_FAILED", "Failed to create tags", insertError.message);
  }

  const { data: allTags, error: allTagsError } = await repository.loadTagsBySlugs(slugs, "id, slug");
  if (allTagsError) throw new AdminHttpError(500, "BLOG_TAGS_FETCH_FAILED", "Failed to fetch tags", allTagsError.message);

  return asBlogRows(allTags).map((row) => String(row.id)).filter(Boolean);
}

async function ensureCategoryIdByNameOrId(
  repository: AdminBlogRepository,
  params: { categoryId?: string | null; categoryName?: string | null }
): Promise<string | null> {
  const normalizedName = params.categoryName?.trim() ?? "";
  if (!normalizedName) return params.categoryId ?? null;

  const slug = slugify(normalizedName);

  if (slug) {
    const { data: bySlug, error: slugError } = await repository.loadCategoryBySlug(slug);
    if (slugError) throw new AdminHttpError(500, "BLOG_CATEGORY_FETCH_FAILED", "Failed to fetch blog category by slug", slugError.message);
    if (bySlug?.id) return String(bySlug.id);
  }

  const { data: byName, error: nameError } = await repository.loadCategoryByName(normalizedName);
  if (nameError) throw new AdminHttpError(500, "BLOG_CATEGORY_FETCH_FAILED", "Failed to fetch blog category by name", nameError.message);
  if (byName?.id) return String(byName.id);

  const baseSlug = slug || "category";
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${attempt + 1}`;
    const nextSlug = `${baseSlug}${suffix}`;
    const { data: created, error: createError } = await repository.createCategory(
      { slug: nextSlug, name: normalizedName, sort_order: 0, is_active: true },
      "id"
    );

    if (!createError) return String(asBlogRow(created).id);
    if (createError.code !== "23505") {
      throw new AdminHttpError(500, "BLOG_CATEGORY_CREATE_FAILED", "Failed to create blog category", createError.message);
    }
  }

  throw new AdminHttpError(500, "BLOG_CATEGORY_CREATE_FAILED", "Failed to create unique blog category slug");
}

async function hydratePostDto(repository: AdminBlogRepository, row: BlogRow, postId: string, errorCode: string): Promise<BlogPostDetailDto> {
  const categoryId = row.category_id == null ? "" : String(row.category_id);
  const [categoryMap, tagsByPostId] = await Promise.all([
    loadCategoryMap(repository, categoryId ? [categoryId] : [], errorCode),
    loadTagsByPostId(repository, postId ? [postId] : [], errorCode)
  ]);

  return toBlogPostDetailDto(row, categoryMap, tagsByPostId);
}

export async function listAdminBlogPosts(params: PaginationInput): Promise<PaginatedResponse<BlogPostDetailDto>> {
  const repository = createAdminBlogRepository();
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;
  const { data, error, count } = await repository.listPosts({ from, to, q: params.q });
  if (error) throw new AdminHttpError(500, "BLOG_POSTS_FETCH_FAILED", "Failed to fetch blog posts", error.message);

  const rows = asBlogRows(data);
  const categoryIds = Array.from(new Set(rows.map((row) => (row.category_id == null ? "" : String(row.category_id))).filter(Boolean)));
  const postIds = rows.map((row) => String(row.id ?? "")).filter(Boolean);
  const [categoryMap, tagsByPostId] = await Promise.all([
    loadCategoryMap(repository, categoryIds, "BLOG_POSTS_FETCH_FAILED"),
    loadTagsByPostId(repository, postIds, "BLOG_POSTS_FETCH_FAILED")
  ]);

  return paginated(rows.map((row) => toBlogPostDetailDto(row, categoryMap, tagsByPostId)), count ?? 0, params.page, params.pageSize);
}

export async function createAdminBlogPost(actor: AdminActor, payload: BlogPostCreatePayload): Promise<BlogPostDetailDto> {
  const repository = createAdminBlogRepository();
  const publishedAt = payload.status === "published" ? payload.published_at ?? new Date().toISOString() : null;
  const categoryId = await ensureCategoryIdByNameOrId(repository, { categoryId: payload.category_id, categoryName: payload.category_name });

  const { data: inserted, error: insertError } = await repository.createPost({
    slug: payload.slug,
    title: payload.title,
    excerpt: payload.excerpt ?? null,
    content: payload.content,
    cover_image_url: payload.cover_image_url ?? null,
    status: payload.status,
    published_at: publishedAt,
    author_name: payload.author_name ?? null,
    category_id: categoryId,
    reading_time_min: payload.reading_time_min ?? null,
    views_count: payload.views_count ?? 0,
    seo_title: payload.seo_title ?? null,
    seo_description: payload.seo_description ?? null
  });
  if (insertError) throw new AdminHttpError(500, "BLOG_POST_CREATE_FAILED", "Failed to create blog post", insertError.message);

  const insertedRow = asBlogRow(inserted);
  const postId = String(insertedRow.id ?? "");
  const tagIds = await ensureTagIdsByNames(repository, payload.tag_names ?? []);
  if (tagIds.length > 0) {
    const { error: relationError } = await repository.createPostTagRelations(tagIds.map((tagId) => ({ post_id: postId, tag_id: tagId })));
    if (relationError) throw new AdminHttpError(500, "BLOG_POST_CREATE_FAILED", "Failed to assign blog tags", relationError.message);
  }

  const dto = await hydratePostDto(repository, insertedRow, postId, "BLOG_POST_CREATE_FAILED");
  await writeAudit({ actorUserId: actor.userId, entity: "blog_posts", entityId: postId, action: "create", after: dto });
  return dto;
}

export async function updateAdminBlogPost(actor: AdminActor, id: string, payload: BlogPostUpdatePayload): Promise<BlogPostDetailDto> {
  const repository = createAdminBlogRepository();
  const { data: before, error: beforeError } = await repository.loadPostById(id);
  if (beforeError) throw new AdminHttpError(500, "BLOG_POST_UPDATE_FAILED", "Failed to fetch blog post", beforeError.message);
  if (!before) throw new AdminHttpError(404, "BLOG_POST_NOT_FOUND", "Blog post not found");

  const patch: Record<string, unknown> = {};
  if (payload.slug !== undefined) patch.slug = payload.slug;
  if (payload.title !== undefined) patch.title = payload.title;
  if (payload.excerpt !== undefined) patch.excerpt = payload.excerpt ?? null;
  if (payload.content !== undefined) patch.content = payload.content;
  if (payload.cover_image_url !== undefined) patch.cover_image_url = payload.cover_image_url ?? null;
  if (payload.status !== undefined) patch.status = payload.status;
  if (payload.author_name !== undefined) patch.author_name = payload.author_name ?? null;
  if (payload.category_id !== undefined || payload.category_name !== undefined) {
    patch.category_id = await ensureCategoryIdByNameOrId(repository, { categoryId: payload.category_id, categoryName: payload.category_name });
  }
  if (payload.reading_time_min !== undefined) patch.reading_time_min = payload.reading_time_min ?? null;
  if (payload.views_count !== undefined) patch.views_count = payload.views_count;
  if (payload.seo_title !== undefined) patch.seo_title = payload.seo_title ?? null;
  if (payload.seo_description !== undefined) patch.seo_description = payload.seo_description ?? null;
  if (payload.published_at !== undefined) patch.published_at = payload.published_at ?? null;
  if (payload.status === "published" && payload.published_at === undefined) patch.published_at = new Date().toISOString();

  if (Object.keys(patch).length > 0) {
    const { error: updateError } = await repository.updatePost(id, patch);
    if (updateError) throw new AdminHttpError(500, "BLOG_POST_UPDATE_FAILED", "Failed to update blog post", updateError.message);
  }

  if (payload.tag_names !== undefined) {
    const { error: clearTagsError } = await repository.deletePostTagRelations(id);
    if (clearTagsError) throw new AdminHttpError(500, "BLOG_POST_UPDATE_FAILED", "Failed to clear blog tags", clearTagsError.message);

    const tagIds = await ensureTagIdsByNames(repository, payload.tag_names);
    if (tagIds.length > 0) {
      const { error: relationError } = await repository.createPostTagRelations(tagIds.map((tagId) => ({ post_id: id, tag_id: tagId })));
      if (relationError) throw new AdminHttpError(500, "BLOG_POST_UPDATE_FAILED", "Failed to update blog tags", relationError.message);
    }
  }

  const { data: after, error: afterError } = await repository.loadPostByIdRequired(id);
  if (afterError) throw new AdminHttpError(500, "BLOG_POST_UPDATE_FAILED", "Failed to fetch updated blog post", afterError.message);

  const dto = await hydratePostDto(repository, asBlogRow(after), id, "BLOG_POST_UPDATE_FAILED");
  await writeAudit({ actorUserId: actor.userId, entity: "blog_posts", entityId: id, action: "update", before, after: dto });
  return dto;
}

export async function deleteAdminBlogPost(actor: AdminActor, id: string): Promise<{ ok: true }> {
  const repository = createAdminBlogRepository();
  const { data: before, error: beforeError } = await repository.loadPostById(id);
  if (beforeError) throw new AdminHttpError(500, "BLOG_POST_DELETE_FAILED", "Failed to fetch blog post", beforeError.message);
  if (!before) throw new AdminHttpError(404, "BLOG_POST_NOT_FOUND", "Blog post not found");

  const { error: deleteError } = await repository.deletePost(id);
  if (deleteError) throw new AdminHttpError(500, "BLOG_POST_DELETE_FAILED", "Failed to delete blog post", deleteError.message);

  await writeAudit({ actorUserId: actor.userId, entity: "blog_posts", entityId: id, action: "delete", before });
  return { ok: true };
}

export async function listAdminBlogCategories(): Promise<BlogCategoryDto[]> {
  const repository = createAdminBlogRepository();
  const { data, error } = await repository.listCategories();
  if (error) throw new AdminHttpError(500, "BLOG_CATEGORIES_FETCH_FAILED", "Failed to fetch categories", error.message);
  return asBlogRows(data).map((row) => toCategoryDto(row));
}

export async function createAdminBlogCategory(actor: AdminActor, payload: BlogCategoryCreatePayload): Promise<BlogCategoryDto> {
  const repository = createAdminBlogRepository();
  const { data, error } = await repository.createCategory(payload);
  if (error) throw new AdminHttpError(500, "BLOG_CATEGORY_CREATE_FAILED", "Failed to create category", error.message);

  const dto = toCategoryDto(asBlogRow(data));
  await writeAudit({ actorUserId: actor.userId, entity: "blog_categories", entityId: dto.id, action: "create", after: dto });
  return dto;
}

export async function updateAdminBlogCategory(actor: AdminActor, id: string, payload: BlogCategoryUpdatePayload) {
  const repository = createAdminBlogRepository();
  const { data: before, error: beforeError } = await repository.loadCategoryById(id);
  if (beforeError) throw new AdminHttpError(500, "BLOG_CATEGORY_UPDATE_FAILED", "Failed to fetch category", beforeError.message);
  if (!before) throw new AdminHttpError(404, "BLOG_CATEGORY_NOT_FOUND", "Category not found");

  const { data, error } = await repository.updateCategory(id, payload);
  if (error) throw new AdminHttpError(500, "BLOG_CATEGORY_UPDATE_FAILED", "Failed to update category", error.message);

  await writeAudit({ actorUserId: actor.userId, entity: "blog_categories", entityId: id, action: "update", before, after: data });
  return data;
}

export async function deleteAdminBlogCategory(actor: AdminActor, id: string): Promise<{ ok: true }> {
  const repository = createAdminBlogRepository();
  const { data: before, error: beforeError } = await repository.loadCategoryById(id);
  if (beforeError) throw new AdminHttpError(500, "BLOG_CATEGORY_DELETE_FAILED", "Failed to fetch category", beforeError.message);
  if (!before) throw new AdminHttpError(404, "BLOG_CATEGORY_NOT_FOUND", "Category not found");

  const { error } = await repository.deleteCategory(id);
  if (error) throw new AdminHttpError(500, "BLOG_CATEGORY_DELETE_FAILED", "Failed to delete category", error.message);

  await writeAudit({ actorUserId: actor.userId, entity: "blog_categories", entityId: id, action: "delete", before });
  return { ok: true };
}

export async function listAdminBlogTags(): Promise<BlogTagDto[]> {
  const repository = createAdminBlogRepository();
  const { data, error } = await repository.listTags();
  if (error) throw new AdminHttpError(500, "BLOG_TAGS_FETCH_FAILED", "Failed to fetch tags", error.message);
  return asBlogRows(data).map((row) => toTagDto(row));
}

export async function createAdminBlogTag(actor: AdminActor, payload: BlogTagCreatePayload): Promise<BlogTagDto> {
  const repository = createAdminBlogRepository();
  const { data, error } = await repository.createTag(payload);
  if (error) throw new AdminHttpError(500, "BLOG_TAG_CREATE_FAILED", "Failed to create tag", error.message);

  const dto = toTagDto(asBlogRow(data));
  await writeAudit({ actorUserId: actor.userId, entity: "blog_tags", entityId: dto.id, action: "create", after: dto });
  return dto;
}

export async function updateAdminBlogTag(actor: AdminActor, id: string, payload: BlogTagUpdatePayload) {
  const repository = createAdminBlogRepository();
  const { data: before, error: beforeError } = await repository.loadTagById(id);
  if (beforeError) throw new AdminHttpError(500, "BLOG_TAG_UPDATE_FAILED", "Failed to fetch tag", beforeError.message);
  if (!before) throw new AdminHttpError(404, "BLOG_TAG_NOT_FOUND", "Tag not found");

  const { data, error } = await repository.updateTag(id, payload);
  if (error) throw new AdminHttpError(500, "BLOG_TAG_UPDATE_FAILED", "Failed to update tag", error.message);

  await writeAudit({ actorUserId: actor.userId, entity: "blog_tags", entityId: id, action: "update", before, after: data });
  return data;
}

export async function deleteAdminBlogTag(actor: AdminActor, id: string): Promise<{ ok: true }> {
  const repository = createAdminBlogRepository();
  const { data: before, error: beforeError } = await repository.loadTagById(id);
  if (beforeError) throw new AdminHttpError(500, "BLOG_TAG_DELETE_FAILED", "Failed to fetch tag", beforeError.message);
  if (!before) throw new AdminHttpError(404, "BLOG_TAG_NOT_FOUND", "Tag not found");

  const { error } = await repository.deleteTag(id);
  if (error) throw new AdminHttpError(500, "BLOG_TAG_DELETE_FAILED", "Failed to delete tag", error.message);

  await writeAudit({ actorUserId: actor.userId, entity: "blog_tags", entityId: id, action: "delete", before });
  return { ok: true };
}
