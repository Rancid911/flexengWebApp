import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import { writeAudit } from "@/lib/admin/audit";
import { ensureCategoryIdByNameOrId, ensureTagIdsByNames, loadCategoryMap, loadTagsByPostId, toBlogPostDetailDto, type BlogRow } from "@/lib/admin/blog";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { blogPostUpdateSchema } from "@/lib/admin/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export const PATCH = withAdminErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireAdminApi();
  const supabase = createAdminClient();
  const { id } = await params;

    const body = await request.json();
    const parsed = blogPostUpdateSchema.safeParse(body);
    if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid blog post payload", parsed.error.flatten());

    const { data: before, error: beforeError } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
    if (beforeError) throw new AdminHttpError(500, "BLOG_POST_UPDATE_FAILED", "Failed to fetch blog post", beforeError.message);
    if (!before) throw new AdminHttpError(404, "BLOG_POST_NOT_FOUND", "Blog post not found");

    const payload = parsed.data;
    const patch: Record<string, unknown> = {};
    if (payload.slug !== undefined) patch.slug = payload.slug;
    if (payload.title !== undefined) patch.title = payload.title;
    if (payload.excerpt !== undefined) patch.excerpt = payload.excerpt ?? null;
    if (payload.content !== undefined) patch.content = payload.content;
    if (payload.cover_image_url !== undefined) patch.cover_image_url = payload.cover_image_url ?? null;
    if (payload.status !== undefined) patch.status = payload.status;
    if (payload.author_name !== undefined) patch.author_name = payload.author_name ?? null;
    if (payload.category_id !== undefined || payload.category_name !== undefined) {
      patch.category_id = await ensureCategoryIdByNameOrId(supabase, {
        categoryId: payload.category_id,
        categoryName: payload.category_name
      });
    }
    if (payload.reading_time_min !== undefined) patch.reading_time_min = payload.reading_time_min ?? null;
    if (payload.views_count !== undefined) patch.views_count = payload.views_count;
    if (payload.seo_title !== undefined) patch.seo_title = payload.seo_title ?? null;
    if (payload.seo_description !== undefined) patch.seo_description = payload.seo_description ?? null;
    if (payload.published_at !== undefined) patch.published_at = payload.published_at ?? null;
    if (payload.status === "published" && payload.published_at === undefined) patch.published_at = new Date().toISOString();

    if (Object.keys(patch).length > 0) {
      const { error: updateError } = await supabase.from("blog_posts").update(patch).eq("id", id);
      if (updateError) throw new AdminHttpError(500, "BLOG_POST_UPDATE_FAILED", "Failed to update blog post", updateError.message);
    }

    if (payload.tag_names !== undefined) {
      const { error: clearTagsError } = await supabase.from("blog_post_tags").delete().eq("post_id", id);
      if (clearTagsError) throw new AdminHttpError(500, "BLOG_POST_UPDATE_FAILED", "Failed to clear blog tags", clearTagsError.message);

      const tagIds = await ensureTagIdsByNames(supabase, payload.tag_names);
      if (tagIds.length > 0) {
        const { error: relationError } = await supabase.from("blog_post_tags").insert(tagIds.map((tagId) => ({ post_id: id, tag_id: tagId })));
        if (relationError) throw new AdminHttpError(500, "BLOG_POST_UPDATE_FAILED", "Failed to update blog tags", relationError.message);
      }
    }

    const { data: after, error: afterError } = await supabase.from("blog_posts").select("*").eq("id", id).single();
    if (afterError) throw new AdminHttpError(500, "BLOG_POST_UPDATE_FAILED", "Failed to fetch updated blog post", afterError.message);

    const categoryId = (after as BlogRow).category_id == null ? "" : String((after as BlogRow).category_id);
    const [categoryMap, tagsByPostId] = await Promise.all([
      loadCategoryMap(supabase, categoryId ? [categoryId] : [], "BLOG_POST_UPDATE_FAILED"),
      loadTagsByPostId(supabase, [id], "BLOG_POST_UPDATE_FAILED")
    ]);

    const dto = toBlogPostDetailDto(after as BlogRow, categoryMap, tagsByPostId);

    await writeAudit({
      actorUserId: actor.userId,
      entity: "blog_posts",
      entityId: id,
      action: "update",
      before,
      after: dto
    });

  return NextResponse.json(dto);
});

export const DELETE = withAdminErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireAdminApi();
  const supabase = createAdminClient();
  const { id } = await params;

    const { data: before, error: beforeError } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
    if (beforeError) throw new AdminHttpError(500, "BLOG_POST_DELETE_FAILED", "Failed to fetch blog post", beforeError.message);
    if (!before) throw new AdminHttpError(404, "BLOG_POST_NOT_FOUND", "Blog post not found");

    const { error: deleteError } = await supabase.from("blog_posts").delete().eq("id", id);
    if (deleteError) throw new AdminHttpError(500, "BLOG_POST_DELETE_FAILED", "Failed to delete blog post", deleteError.message);

    await writeAudit({
      actorUserId: actor.userId,
      entity: "blog_posts",
      entityId: id,
      action: "delete",
      before
    });

  return NextResponse.json({ ok: true });
});
