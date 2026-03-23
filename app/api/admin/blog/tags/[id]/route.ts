import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import { writeAudit } from "@/lib/admin/audit";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { blogTagUpdateSchema } from "@/lib/admin/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export const PATCH = withAdminErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireAdminApi();
  const supabase = createAdminClient();
  const { id } = await params;
  const body = await request.json();
  const parsed = blogTagUpdateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid tag payload", parsed.error.flatten());

    const { data: before, error: beforeError } = await supabase.from("blog_tags").select("*").eq("id", id).maybeSingle();
    if (beforeError) throw new AdminHttpError(500, "BLOG_TAG_UPDATE_FAILED", "Failed to fetch tag", beforeError.message);
    if (!before) throw new AdminHttpError(404, "BLOG_TAG_NOT_FOUND", "Tag not found");

    const { data, error } = await supabase.from("blog_tags").update(parsed.data).eq("id", id).select("id, slug, name").single();
    if (error) throw new AdminHttpError(500, "BLOG_TAG_UPDATE_FAILED", "Failed to update tag", error.message);

    await writeAudit({
      actorUserId: actor.userId,
      entity: "blog_tags",
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

    const { data: before, error: beforeError } = await supabase.from("blog_tags").select("*").eq("id", id).maybeSingle();
    if (beforeError) throw new AdminHttpError(500, "BLOG_TAG_DELETE_FAILED", "Failed to fetch tag", beforeError.message);
    if (!before) throw new AdminHttpError(404, "BLOG_TAG_NOT_FOUND", "Tag not found");

    const { error } = await supabase.from("blog_tags").delete().eq("id", id);
    if (error) throw new AdminHttpError(500, "BLOG_TAG_DELETE_FAILED", "Failed to delete tag", error.message);

    await writeAudit({
      actorUserId: actor.userId,
      entity: "blog_tags",
      entityId: id,
      action: "delete",
      before
    });

  return NextResponse.json({ ok: true });
});
