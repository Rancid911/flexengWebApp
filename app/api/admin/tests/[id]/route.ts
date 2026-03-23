import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/auth";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { toTestDto } from "@/lib/admin/tests";
import { adminTestUpdateSchema } from "@/lib/admin/validation";
import { writeAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";

export const PATCH = withAdminErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireAdminApi();
  const supabase = createAdminClient();
  const { id } = await params;

  const body = await request.json();
  const parsed = adminTestUpdateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid test payload", parsed.error.flatten());

  const { data: before, error: beforeError } = await supabase.from("tests").select("*").eq("id", id).single();
  if (beforeError) throw new AdminHttpError(404, "TEST_NOT_FOUND", "Test not found");

  const { data, error } = await supabase.from("tests").update(parsed.data).eq("id", id).select("*").single();
  if (error) throw new AdminHttpError(500, "TEST_UPDATE_FAILED", "Failed to update test", error.message);

  await writeAudit({
    actorUserId: actor.userId,
    entity: "tests",
    entityId: id,
    action: "update",
    before,
    after: data
  });

  return NextResponse.json(toTestDto(data as Record<string, unknown>));
});

export const DELETE = withAdminErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireAdminApi();
  const supabase = createAdminClient();
  const { id } = await params;

  const { data: before, error: beforeError } = await supabase.from("tests").select("*").eq("id", id).single();
  if (beforeError) throw new AdminHttpError(404, "TEST_NOT_FOUND", "Test not found");

  const { error } = await supabase.from("tests").delete().eq("id", id);
  if (error) throw new AdminHttpError(500, "TEST_DELETE_FAILED", "Failed to delete test", error.message);

  await writeAudit({
    actorUserId: actor.userId,
    entity: "tests",
    entityId: id,
    action: "delete",
    before
  });

  return NextResponse.json({ ok: true });
});
