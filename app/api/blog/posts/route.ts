import { NextRequest, NextResponse } from "next/server";

import { AdminHttpError, paginated, parsePagination, toErrorResponse } from "@/lib/admin/http";
import { loadCategoryMap, loadTagsByPostId, toBlogPostCardDto, type BlogRow } from "@/lib/admin/blog";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const { page, pageSize, q } = parsePagination(url);
    const category = (url.searchParams.get("category") ?? "").trim();
    const tag = (url.searchParams.get("tag") ?? "").trim();
    const sort = (url.searchParams.get("sort") ?? "new").trim();

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let categoryId: string | null = null;
    if (category) {
      const { data: categoryRow, error: categoryError } = await supabase
        .from("blog_categories")
        .select("id")
        .eq("slug", category)
        .maybeSingle();
      if (categoryError) throw new AdminHttpError(500, "BLOG_CATEGORY_FETCH_FAILED", "Failed to fetch category", categoryError.message);
      categoryId = categoryRow?.id ?? null;
      if (!categoryId) {
        return NextResponse.json(paginated([], 0, page, pageSize));
      }
    }

    let tagPostIds: string[] | null = null;
    if (tag) {
      const { data: tagRow, error: tagError } = await supabase.from("blog_tags").select("id").eq("slug", tag).maybeSingle();
      if (tagError) throw new AdminHttpError(500, "BLOG_TAG_FETCH_FAILED", "Failed to fetch tag", tagError.message);
      if (!tagRow?.id) return NextResponse.json(paginated([], 0, page, pageSize));

      const { data: tagRelations, error: tagRelationsError } = await supabase
        .from("blog_post_tags")
        .select("post_id")
        .eq("tag_id", tagRow.id);
      if (tagRelationsError) {
        throw new AdminHttpError(500, "BLOG_TAG_FETCH_FAILED", "Failed to fetch tagged posts", tagRelationsError.message);
      }

      tagPostIds = (tagRelations ?? []).map((row: BlogRow) => String(row.post_id ?? "")).filter(Boolean);
      if (tagPostIds.length === 0) return NextResponse.json(paginated([], 0, page, pageSize));
    }

    let query = supabase
      .from("blog_posts")
      .select(
        "id, slug, title, excerpt, cover_image_url, status, published_at, author_name, category_id, reading_time_min, views_count, created_at",
        { count: "exact" }
      )
      .eq("status", "published")
      .range(from, to);

    if (sort === "popular") {
      query = query.order("views_count", { ascending: false }).order("published_at", { ascending: false });
    } else {
      query = query.order("published_at", { ascending: false, nullsFirst: false });
    }

    if (q) query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,content.ilike.%${q}%`);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (tagPostIds) query = query.in("id", tagPostIds);

    const { data, error, count } = await query;
    if (error) throw new AdminHttpError(500, "BLOG_POSTS_FETCH_FAILED", "Failed to fetch blog posts", error.message);

    const rows = (data ?? []) as BlogRow[];
    const categoryIds = Array.from(new Set(rows.map((row) => (row.category_id == null ? "" : String(row.category_id))).filter(Boolean)));
    const postIds = rows.map((row) => String(row.id ?? "")).filter(Boolean);

    const [categoryMap, tagsByPostId] = await Promise.all([
      loadCategoryMap(supabase, categoryIds, "BLOG_POSTS_FETCH_FAILED"),
      loadTagsByPostId(supabase, postIds, "BLOG_POSTS_FETCH_FAILED")
    ]);

    return NextResponse.json(paginated(rows.map((row) => toBlogPostCardDto(row, categoryMap, tagsByPostId)), count ?? 0, page, pageSize));
  } catch (error) {
    return toErrorResponse(error);
  }
}
