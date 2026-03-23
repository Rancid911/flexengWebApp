import { NextRequest, NextResponse } from "next/server";

import { AdminHttpError, toErrorResponse } from "@/lib/admin/http";
import { loadCategoryMap, loadTagsByPostId, toBlogPostDetailDto, type BlogRow } from "@/lib/admin/blog";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const supabase = await createClient();
    const { slug } = await params;

    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        "id, slug, title, excerpt, content, cover_image_url, status, published_at, author_name, category_id, reading_time_min, views_count, seo_title, seo_description, created_at, updated_at"
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) throw new AdminHttpError(500, "BLOG_POST_FETCH_FAILED", "Failed to fetch blog post", error.message);
    if (!data) return NextResponse.json({ code: "NOT_FOUND", message: "Blog post not found" }, { status: 404 });

    const postId = String((data as BlogRow).id ?? "");
    const categoryId = (data as BlogRow).category_id == null ? "" : String((data as BlogRow).category_id);

    const [categoryMap, tagsByPostId] = await Promise.all([
      loadCategoryMap(supabase, categoryId ? [categoryId] : [], "BLOG_POST_FETCH_FAILED"),
      loadTagsByPostId(supabase, postId ? [postId] : [], "BLOG_POST_FETCH_FAILED")
    ]);

    return NextResponse.json(toBlogPostDetailDto(data as BlogRow, categoryMap, tagsByPostId));
  } catch (error) {
    return toErrorResponse(error);
  }
}
