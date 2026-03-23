import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import { writeAudit } from "@/lib/admin/audit";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { blogCategoryUpdateSchema } from "@/lib/admin/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export const PATCH = withAdminErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireAdminApi();
  const supabase = createAdminClient();
  const { id } = await params;
  const body = await request.json();
  const parsed = blogCategoryUpdateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid category payload", parsed.error.flatten());

    const { data: before, error: beforeError } = await supabase.from("blog_categories").select("*").eq("id", id).maybeSingle();
    if (beforeError) throw new AdminHttpError(500, "BLOG_CATEGORY_UPDATE_FAILED", "Failed to fetch category", beforeError.message);
    if (!before) throw new AdminHttpError(404, "BLOG_CATEGORY_NOT_FOUND", "Category not found");

    const { data, error } = await supabase.from("blog_categories").update(parsed.data).eq("id", id).select("id, slug, name, sort_order, is_active").single();
    if (error) throw new AdminHttpError(500, "BLOG_CATEGORY_UPDATE_FAILED", "Failed to update category", error.message);

    await writeAudit({
      actorUserId: actor.userId,
      entity: "blog_categories",
      entityId: id,
      action: "update",
      before,
      after: data
    });

  return NextResponse.json(data);
});

export const DELETE = withAdminErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireAdminApi();
  const supabase = createAdminClient();
  const { id } = await params;

    const { data: before, error: beforeError } = await supabase.from("blog_categories").select("*").eq("id", id).maybeSingle();
    if (beforeError) throw new AdminHttpError(500, "BLOG_CATEGORY_DELETE_FAILED", "Failed to fetch category", beforeError.message);
    if (!before) throw new AdminHttpError(404, "BLOG_CATEGORY_NOT_FOUND", "Category not found");

    const { error } = await supabase.from("blog_categories").delete().eq("id", id);
    if (error) throw new AdminHttpError(500, "BLOG_CATEGORY_DELETE_FAILED", "Failed to delete category", error.message);

    await writeAudit({
      actorUserId: actor.userId,
      entity: "blog_categories",
      entityId: id,
      action: "delete",
      before
    });

  return NextResponse.json({ ok: true });
});
