import { NextResponse } from "next/server";

import { AdminHttpError, toErrorResponse } from "@/lib/admin/http";
import { createClient } from "@/lib/supabase/server";
import type { BlogCategoryDto, BlogTagDto } from "@/lib/admin/types";
import type { BlogRow } from "@/lib/admin/blog";

export async function GET() {
  try {
    const supabase = await createClient();

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

    return NextResponse.json({
      categories: mappedCategories,
      tags: mappedTags,
      popular: (popular ?? []).map((row: BlogRow) => ({
        id: String(row.id ?? ""),
        slug: String(row.slug ?? ""),
        title: String(row.title ?? ""),
        views_count: Number(row.views_count ?? 0),
        published_at: row.published_at == null ? null : String(row.published_at)
      }))
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
