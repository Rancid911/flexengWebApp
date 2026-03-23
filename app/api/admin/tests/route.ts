import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import { parsePagination, paginated, AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { toTestDto } from "@/lib/admin/tests";
import { adminTestCreateSchema } from "@/lib/admin/validation";
import { writeAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";

export const GET = withAdminErrorHandling(async (request: NextRequest) => {
  await requireAdminApi();
  const supabase = createAdminClient();
  const { page, pageSize, q } = parsePagination(new URL(request.url));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("tests").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data, error, count } = await query;
  if (error) throw new AdminHttpError(500, "TESTS_FETCH_FAILED", "Failed to fetch tests", error.message);

  return NextResponse.json(paginated((data ?? []).map((x) => toTestDto(x as Record<string, unknown>)), count ?? 0, page, pageSize));
});

export const POST = withAdminErrorHandling(async (request: NextRequest) => {
  const actor = await requireAdminApi();
  const supabase = createAdminClient();
  const body = await request.json();
  const parsed = adminTestCreateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid test payload", parsed.error.flatten());

  const { data, error } = await supabase.from("tests").insert(parsed.data).select("*").single();
  if (error) throw new AdminHttpError(500, "TEST_CREATE_FAILED", "Failed to create test", error.message);

  await writeAudit({
    actorUserId: actor.userId,
    entity: "tests",
    entityId: String(data.id),
    action: "create",
    after: data
  });

  return NextResponse.json(toTestDto(data as Record<string, unknown>), { status: 201 });
});
