import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import { writeAudit } from "@/lib/admin/audit";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { blogCategoryCreateSchema } from "@/lib/admin/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BlogCategoryDto } from "@/lib/admin/types";
import type { BlogRow } from "@/lib/admin/blog";

export const GET = withAdminErrorHandling(async () => {
  await requireAdminApi();
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("blog_categories").select("id, slug, name, sort_order, is_active").order("sort_order", { ascending: true });
  if (error) throw new AdminHttpError(500, "BLOG_CATEGORIES_FETCH_FAILED", "Failed to fetch categories", error.message);

  const items: BlogCategoryDto[] = (data ?? []).map((row: BlogRow) => ({
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    name: String(row.name ?? ""),
    sort_order: Number(row.sort_order ?? 0),
    is_active: Boolean(row.is_active ?? true)
  }));

  return NextResponse.json(items);
});

export const POST = withAdminErrorHandling(async (request: NextRequest) => {
  const actor = await requireAdminApi();
  const supabase = createAdminClient();
  const body = await request.json();
  const parsed = blogCategoryCreateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid category payload", parsed.error.flatten());

    const { data, error } = await supabase.from("blog_categories").insert(parsed.data).select("id, slug, name, sort_order, is_active").single();
    if (error) throw new AdminHttpError(500, "BLOG_CATEGORY_CREATE_FAILED", "Failed to create category", error.message);

    const dto: BlogCategoryDto = {
      id: String(data.id),
      slug: String(data.slug),
      name: String(data.name),
      sort_order: Number(data.sort_order ?? 0),
      is_active: Boolean(data.is_active ?? true)
    };

    await writeAudit({
      actorUserId: actor.userId,
      entity: "blog_categories",
      entityId: dto.id,
      action: "create",
      after: dto
    });

  return NextResponse.json(dto, { status: 201 });
});
