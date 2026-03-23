import { AdminHttpError } from "@/lib/admin/http";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";

import type { BlogCategoryDto, BlogPostCardDto, BlogPostDetailDto, BlogTagDto } from "@/lib/admin/types";

export type BlogRow = Record<string, unknown>;
type BlogSupabaseClient = Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createAdminClient>;

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function toCategoryDto(row: BlogRow): BlogCategoryDto {
  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    name: String(row.name ?? ""),
    sort_order: Number(row.sort_order ?? 0),
    is_active: Boolean(row.is_active ?? true)
  };
}

function toTagDto(row: BlogRow): BlogTagDto {
  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    name: String(row.name ?? "")
  };
}

export function toBlogPostCardDto(
  row: BlogRow,
  categoryMap: Map<string, BlogCategoryDto>,
  tagsByPostId: Map<string, BlogTagDto[]>
): BlogPostCardDto {
  const postId = String(row.id ?? "");
  const categoryId = row.category_id == null ? null : String(row.category_id);

  return {
    id: postId,
    slug: String(row.slug ?? ""),
    title: String(row.title ?? ""),
    excerpt: row.excerpt == null ? null : String(row.excerpt),
    cover_image_url: row.cover_image_url == null ? null : String(row.cover_image_url),
    status: String(row.status ?? "draft") as "draft" | "published",
    author_name: row.author_name == null ? null : String(row.author_name),
    reading_time_min: row.reading_time_min == null ? null : Number(row.reading_time_min),
    views_count: Number(row.views_count ?? 0),
    published_at: row.published_at == null ? null : String(row.published_at),
    created_at: row.created_at == null ? null : String(row.created_at),
    category: categoryId ? categoryMap.get(categoryId) ?? null : null,
    tags: tagsByPostId.get(postId) ?? []
  };
}

export function toBlogPostDetailDto(
  row: BlogRow,
  categoryMap: Map<string, BlogCategoryDto>,
  tagsByPostId: Map<string, BlogTagDto[]>
): BlogPostDetailDto {
  const card = toBlogPostCardDto(row, categoryMap, tagsByPostId);
  return {
    ...card,
    content: String(row.content ?? ""),
    seo_title: row.seo_title == null ? null : String(row.seo_title),
    seo_description: row.seo_description == null ? null : String(row.seo_description),
    updated_at: row.updated_at == null ? null : String(row.updated_at)
  };
}

export async function loadCategoryMap(
  supabase: BlogSupabaseClient,
  categoryIds: string[],
  errorCode: string
): Promise<Map<string, BlogCategoryDto>> {
  if (categoryIds.length === 0) return new Map();

  const { data, error } = await supabase.from("blog_categories").select("id, slug, name, sort_order, is_active").in("id", categoryIds);
  if (error) throw new AdminHttpError(500, errorCode, "Failed to fetch blog categories", error.message);

  return new Map<string, BlogCategoryDto>((data ?? []).map((row: BlogRow) => [String(row.id), toCategoryDto(row)] as [string, BlogCategoryDto]));
}

export async function loadTagsByPostId(
  supabase: BlogSupabaseClient,
  postIds: string[],
  errorCode: string
): Promise<Map<string, BlogTagDto[]>> {
  if (postIds.length === 0) return new Map();

  const { data: relations, error: relationError } = await supabase
    .from("blog_post_tags")
    .select("post_id, tag_id")
    .in("post_id", postIds);

  if (relationError) throw new AdminHttpError(500, errorCode, "Failed to fetch blog tag relations", relationError.message);

  const tagIds = Array.from(new Set((relations ?? []).map((x: BlogRow) => String(x.tag_id ?? "")).filter(Boolean)));
  if (tagIds.length === 0) return new Map();

  const { data: tags, error: tagsError } = await supabase.from("blog_tags").select("id, slug, name").in("id", tagIds);
  if (tagsError) throw new AdminHttpError(500, errorCode, "Failed to fetch blog tags", tagsError.message);

  const tagMap = new Map<string, BlogTagDto>((tags ?? []).map((row: BlogRow) => [String(row.id), toTagDto(row)] as [string, BlogTagDto]));
  const tagsByPostId = new Map<string, BlogTagDto[]>();

  (relations ?? []).forEach((relation: BlogRow) => {
    const postId = String(relation.post_id ?? "");
    const tagId = String(relation.tag_id ?? "");
    const tag = tagMap.get(tagId);
    if (!postId || !tag) return;

    const list = tagsByPostId.get(postId) ?? [];
    list.push(tag);
    tagsByPostId.set(postId, list);
  });

  return tagsByPostId;
}

export async function ensureTagIdsByNames(
  supabase: BlogSupabaseClient,
  tagNames: string[]
): Promise<string[]> {
  const normalized = Array.from(new Set(tagNames.map((name) => name.trim()).filter(Boolean)));
  if (normalized.length === 0) return [];

  const slugs = normalized.map((name) => slugify(name));
  const { data: existingTags, error: existingError } = await supabase.from("blog_tags").select("id, slug, name").in("slug", slugs);
  if (existingError) throw new AdminHttpError(500, "BLOG_TAGS_FETCH_FAILED", "Failed to fetch existing tags", existingError.message);

  const existingSlugSet = new Set((existingTags ?? []).map((row: BlogRow) => String(row.slug ?? "")));
  const toCreate = normalized
    .map((name) => ({ name, slug: slugify(name) }))
    .filter((tag) => tag.slug && !existingSlugSet.has(tag.slug));

  if (toCreate.length > 0) {
    const { error: insertError } = await supabase.from("blog_tags").insert(toCreate);
    if (insertError) throw new AdminHttpError(500, "BLOG_TAGS_CREATE_FAILED", "Failed to create tags", insertError.message);
  }

  const { data: allTags, error: allTagsError } = await supabase.from("blog_tags").select("id, slug").in("slug", slugs);
  if (allTagsError) throw new AdminHttpError(500, "BLOG_TAGS_FETCH_FAILED", "Failed to fetch tags", allTagsError.message);

  return (allTags ?? []).map((row: BlogRow) => String(row.id)).filter(Boolean);
}

export async function ensureCategoryIdByNameOrId(
  supabase: BlogSupabaseClient,
  params: { categoryId?: string | null; categoryName?: string | null }
): Promise<string | null> {
  const normalizedName = params.categoryName?.trim() ?? "";
  if (!normalizedName) return params.categoryId ?? null;

  const slug = slugify(normalizedName);

  if (slug) {
    const { data: bySlug, error: slugError } = await supabase
      .from("blog_categories")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (slugError) {
      throw new AdminHttpError(500, "BLOG_CATEGORY_FETCH_FAILED", "Failed to fetch blog category by slug", slugError.message);
    }
    if (bySlug?.id) return String(bySlug.id);
  }

  const { data: byName, error: nameError } = await supabase
    .from("blog_categories")
    .select("id")
    .ilike("name", normalizedName)
    .limit(1)
    .maybeSingle();
  if (nameError) {
    throw new AdminHttpError(500, "BLOG_CATEGORY_FETCH_FAILED", "Failed to fetch blog category by name", nameError.message);
  }
  if (byName?.id) return String(byName.id);

  const baseSlug = slug || "category";
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${attempt + 1}`;
    const nextSlug = `${baseSlug}${suffix}`;
    const { data: created, error: createError } = await supabase
      .from("blog_categories")
      .insert({
        slug: nextSlug,
        name: normalizedName,
        sort_order: 0,
        is_active: true
      })
      .select("id")
      .single();

    if (!createError) {
      return String(created.id);
    }

    if (createError.code !== "23505") {
      throw new AdminHttpError(500, "BLOG_CATEGORY_CREATE_FAILED", "Failed to create blog category", createError.message);
    }
  }

  throw new AdminHttpError(500, "BLOG_CATEGORY_CREATE_FAILED", "Failed to create unique blog category slug");
}
