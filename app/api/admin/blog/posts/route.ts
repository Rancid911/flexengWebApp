import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import { writeAudit } from "@/lib/admin/audit";
import { ensureCategoryIdByNameOrId, ensureTagIdsByNames, loadCategoryMap, loadTagsByPostId, toBlogPostDetailDto, type BlogRow } from "@/lib/admin/blog";
import { AdminHttpError, paginated, parsePagination, withAdminErrorHandling } from "@/lib/admin/http";
import { blogPostCreateSchema } from "@/lib/admin/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export const GET = withAdminErrorHandling(async (request: NextRequest) => {
  await requireAdminApi();
  const supabase = createAdminClient();
  const url = new URL(request.url);
  const { page, pageSize, q } = parsePagination(url);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

    let query = supabase
      .from("blog_posts")
      .select(
        "id, slug, title, excerpt, content, cover_image_url, status, published_at, author_name, category_id, reading_time_min, views_count, seo_title, seo_description, created_at, updated_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (q) query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,slug.ilike.%${q}%`);

    const { data, error, count } = await query;
    if (error) throw new AdminHttpError(500, "BLOG_POSTS_FETCH_FAILED", "Failed to fetch blog posts", error.message);

    const rows = (data ?? []) as BlogRow[];
    const categoryIds = Array.from(new Set(rows.map((row) => (row.category_id == null ? "" : String(row.category_id))).filter(Boolean)));
    const postIds = rows.map((row) => String(row.id ?? "")).filter(Boolean);

    const [categoryMap, tagsByPostId] = await Promise.all([
      loadCategoryMap(supabase, categoryIds, "BLOG_POSTS_FETCH_FAILED"),
      loadTagsByPostId(supabase, postIds, "BLOG_POSTS_FETCH_FAILED")
    ]);

  return NextResponse.json(paginated(rows.map((row) => toBlogPostDetailDto(row, categoryMap, tagsByPostId)), count ?? 0, page, pageSize));
});

export const POST = withAdminErrorHandling(async (request: NextRequest) => {
  const actor = await requireAdminApi();
  const supabase = createAdminClient();
  const body = await request.json();
  const parsed = blogPostCreateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid blog post payload", parsed.error.flatten());

    const payload = parsed.data;
    const publishedAt = payload.status === "published" ? payload.published_at ?? new Date().toISOString() : null;
    const categoryId = await ensureCategoryIdByNameOrId(supabase, {
      categoryId: payload.category_id,
      categoryName: payload.category_name
    });

    const { data: inserted, error: insertError } = await supabase
      .from("blog_posts")
      .insert({
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
      })
      .select("*")
      .single();
    if (insertError) throw new AdminHttpError(500, "BLOG_POST_CREATE_FAILED", "Failed to create blog post", insertError.message);

    const postId = String((inserted as BlogRow).id ?? "");
    const tagIds = await ensureTagIdsByNames(supabase, payload.tag_names ?? []);
    if (tagIds.length > 0) {
      const { error: relationError } = await supabase
        .from("blog_post_tags")
        .insert(tagIds.map((tagId) => ({ post_id: postId, tag_id: tagId })));
      if (relationError) throw new AdminHttpError(500, "BLOG_POST_CREATE_FAILED", "Failed to assign blog tags", relationError.message);
    }

    const createdCategoryId = (inserted as BlogRow).category_id == null ? "" : String((inserted as BlogRow).category_id);
    const [categoryMap, tagsByPostId] = await Promise.all([
      loadCategoryMap(supabase, createdCategoryId ? [createdCategoryId] : [], "BLOG_POST_CREATE_FAILED"),
      loadTagsByPostId(supabase, postId ? [postId] : [], "BLOG_POST_CREATE_FAILED")
    ]);

    const dto = toBlogPostDetailDto(inserted as BlogRow, categoryMap, tagsByPostId);

    await writeAudit({
      actorUserId: actor.userId,
      entity: "blog_posts",
      entityId: postId,
      action: "create",
      after: dto
    });

  return NextResponse.json(dto, { status: 201 });
});
