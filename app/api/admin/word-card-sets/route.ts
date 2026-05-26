import { NextRequest, NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/auth";
import { AdminHttpError, parsePagination, withAdminErrorHandling } from "@/lib/admin/http";
import { createAdminWordCardSet, listAdminWordCardSets } from "@/lib/admin/word-card-sets.service";
import { adminWordCardSetCreateSchema } from "@/lib/admin/validation";

export const GET = withAdminErrorHandling(async (request: NextRequest) => {
  await requireAdminApiPermission("word_cards.manage");
  const result = await listAdminWordCardSets(parsePagination(new URL(request.url)));
  return NextResponse.json(result);
});

export const POST = withAdminErrorHandling(async (request: NextRequest) => {
  const actor = await requireAdminApiPermission("word_cards.manage");
  const body = await request.json();
  const parsed = adminWordCardSetCreateSchema.safeParse(body);
  if (!parsed.success) throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid word card set payload", parsed.error.flatten());

  const result = await createAdminWordCardSet(actor, parsed.data);
  return NextResponse.json(result, { status: 201 });
});
