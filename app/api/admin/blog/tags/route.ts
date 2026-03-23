import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import { writeAudit } from "@/lib/admin/audit";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { blogTagCreateSchema } from "@/lib/admin/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BlogTagDto } from "@/lib/admin/types";
import type { BlogRow } from "@/lib/admin/blog";

export const GET = withAdminErrorHandling(async () => {
  await requireAdminApi();
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("blog_tags").select("id, slug, name").order("name", { ascending: true });
  if (error) throw new AdminHttpError(500, "BLOG_TAGS_FETCH_FAILED", "Failed to fetch tags", error.message);

  const items: BlogTagDto[] = (data ?? []).map((row: BlogRow) => ({
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    name: String(row.name ?? "")
  }));
  return NextResponse.json(items);
});

export const POST = withAdminErrorHandling(async (request: NextRequest) => {
  const actor = await requireAdminApi();
  const supabase = createAdminClient();
  const body = await request.json();
  const parsed = blogTagCreateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid tag payload", parsed.error.flatten());

    const { data, error } = await supabase.from("blog_tags").insert(parsed.data).select("id, slug, name").single();
    if (error) throw new AdminHttpError(500, "BLOG_TAG_CREATE_FAILED", "Failed to create tag", error.message);

    const dto: BlogTagDto = {
      id: String(data.id),
      slug: String(data.slug),
      name: String(data.name)
    };

    await writeAudit({
      actorUserId: actor.userId,
      entity: "blog_tags",
      entityId: dto.id,
      action: "create",
      after: dto
    });

  return NextResponse.json(dto, { status: 201 });
});
