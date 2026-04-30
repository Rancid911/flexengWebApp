import { cache } from "react";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { paginated, AdminHttpError } from "@/lib/admin/http";
import {
  loadCategoryMap,
  loadTagsByPostId,
  toBlogPostCardDto,
  toBlogPostDetailDto,
  type BlogRow
} from "@/lib/admin/blog";
import type { BlogCategoryDto, BlogPostCardDto, BlogPostDetailDto, BlogTagDto, PaginatedResponse } from "@/lib/admin/types";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/config";

type BlogPublicClient = ReturnType<typeof createBlogPublicClient>;

type PublishedBlogPostsParams = {
  page: number;
  pageSize: number;
  q?: string;
  category?: string;
  tag?: string;
  sort?: "new" | "popular";
};

function createBlogPublicClient() {
  return createSupabaseClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

async function resolveCategoryIdBySlug(supabase: BlogPublicClient, categorySlug: string) {
  if (!categorySlug) return null;

  const { data, error } = await supabase.from("blog_categories").select("id").eq("slug", categorySlug).maybeSingle();
  if (error) throw new AdminHttpError(500, "BLOG_CATEGORY_FETCH_FAILED", "Failed to fetch category", error.message);

  return data?.id ? String(data.id) : null;
}

async function resolveTaggedPostIdsBySlug(supabase: BlogPublicClient, tagSlug: string) {
  if (!tagSlug) return null;

  const { data: tagRow, error: tagError } = await supabase.from("blog_tags").select("id").eq("slug", tagSlug).maybeSingle();
  if (tagError) throw new AdminHttpError(500, "BLOG_TAG_FETCH_FAILED", "Failed to fetch tag", tagError.message);
  if (!tagRow?.id) return [];

  const { data: relations, error: relationError } = await supabase.from("blog_post_tags").select("post_id").eq("tag_id", tagRow.id);
  if (relationError) {
    throw new AdminHttpError(500, "BLOG_TAG_FETCH_FAILED", "Failed to fetch tagged posts", relationError.message);
  }

  return (relations ?? []).map((row: BlogRow) => String(row.post_id ?? "")).filter(Boolean);
}

export async function getPublishedBlogPosts({
  page,
  pageSize,
  q = "",
  category = "",
  tag = "",
  sort = "new"
}: PublishedBlogPostsParams): Promise<PaginatedResponse<BlogPostCardDto>> {
  const supabase = createBlogPublicClient();
  const [categoryId, taggedPostIds] = await Promise.all([
    resolveCategoryIdBySlug(supabase, category.trim()),
    resolveTaggedPostIdsBySlug(supabase, tag.trim())
  ]);

  if (category && !categoryId) {
    return paginated([], 0, page, pageSize);
  }

  if (Array.isArray(taggedPostIds) && taggedPostIds.length === 0) {
    return paginated([], 0, page, pageSize);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, cover_image_url, status, published_at, author_name, category_id, reading_time_min, views_count, created_at",
      { count: "exact" }
    )
    .eq("status", "published")
    .range(from, to);

  query =
    sort === "popular"
      ? query.order("views_count", { ascending: false }).order("published_at", { ascending: false })
      : query.order("published_at", { ascending: false, nullsFirst: false });

  if (q) query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,content.ilike.%${q}%`);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (taggedPostIds) query = query.in("id", taggedPostIds);

  const { data, error, count } = await query;
  if (error) throw new AdminHttpError(500, "BLOG_POSTS_FETCH_FAILED", "Failed to fetch blog posts", error.message);

  const rows = (data ?? []) as BlogRow[];
  const categoryIds = Array.from(new Set(rows.map((row) => (row.category_id == null ? "" : String(row.category_id))).filter(Boolean)));
  const postIds = rows.map((row) => String(row.id ?? "")).filter(Boolean);
  const [categoryMap, tagsByPostId] = await Promise.all([
    loadCategoryMap(supabase, categoryIds, "BLOG_POSTS_FETCH_FAILED"),
    loadTagsByPostId(supabase, postIds, "BLOG_POSTS_FETCH_FAILED")
  ]);

  return paginated(rows.map((row) => toBlogPostCardDto(row, categoryMap, tagsByPostId)), count ?? 0, page, pageSize);
}

export const getBlogMeta = cache(async function getBlogMeta() {
  const supabase = createBlogPublicClient();
  const [{ data: categories, error: categoriesError }, { data: tags, error: tagsError }, { data: popular, error: popularError }] = await Promise.all([
    supabase.from("blog_categories").select("id, slug, name, sort_order, is_active").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("blog_tags").select("id, slug, name").order("name", { ascending: true }).limit(40),
    supabase
      .from("blog_posts")
      .select("id, slug, title, views_count, published_at")
      .eq("status", "published")
      .order("views_count", { ascending: false })
      .limit(8)
  ]);

  if (categoriesError) throw new AdminHttpError(500, "BLOG_META_FETCH_FAILED", "Failed to fetch categories", categoriesError.message);
  if (tagsError) throw new AdminHttpError(500, "BLOG_META_FETCH_FAILED", "Failed to fetch tags", tagsError.message);
  if (popularError) throw new AdminHttpError(500, "BLOG_META_FETCH_FAILED", "Failed to fetch popular posts", popularError.message);

  const mappedCategories: BlogCategoryDto[] = (categories ?? []).map((row: BlogRow) => ({
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    name: String(row.name ?? ""),
    sort_order: Number(row.sort_order ?? 0),
    is_active: Boolean(row.is_active ?? true)
  }));

  const mappedTags: BlogTagDto[] = (tags ?? []).map((row: BlogRow) => ({
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    name: String(row.name ?? "")
  }));

  return {
    categories: mappedCategories,
    tags: mappedTags,
    popular: (popular ?? []).map((row: BlogRow) => ({
      id: String(row.id ?? ""),
      slug: String(row.slug ?? ""),
      title: String(row.title ?? ""),
      views_count: Number(row.views_count ?? 0),
      published_at: row.published_at == null ? null : String(row.published_at)
    }))
  };
});

export const getBlogPostBySlug = cache(async function getBlogPostBySlug(slug: string): Promise<BlogPostDetailDto | null> {
  const supabase = createBlogPublicClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, content, cover_image_url, status, published_at, author_name, category_id, reading_time_min, views_count, seo_title, seo_description, created_at, updated_at"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new AdminHttpError(500, "BLOG_POST_FETCH_FAILED", "Failed to fetch blog post", error.message);
  if (!data) return null;

  const row = data as BlogRow;
  const postId = String(row.id ?? "");
  const categoryId = row.category_id == null ? "" : String(row.category_id);
  const [categoryMap, tagsByPostId] = await Promise.all([
    loadCategoryMap(supabase, categoryId ? [categoryId] : [], "BLOG_POST_FETCH_FAILED"),
    loadTagsByPostId(supabase, postId ? [postId] : [], "BLOG_POST_FETCH_FAILED")
  ]);

  return toBlogPostDetailDto(row, categoryMap, tagsByPostId);
});
