import { NextRequest, NextResponse } from "next/server";

import { getScheduleFilterCatalog } from "@/lib/schedule/queries";
import { requireScheduleApi } from "@/lib/schedule/server";
import { withScheduleErrorHandling } from "@/lib/schedule/http";
import type { ScheduleFilterCatalogEntity } from "@/lib/schedule/types";

function parseEntity(value: string | null): ScheduleFilterCatalogEntity {
  if (value === "students" || value === "teachers") {
    return value;
  }

  return "all";
}

export const GET = withScheduleErrorHandling(async (request: NextRequest) => {
  const actor = await requireScheduleApi();
  const searchParams = request.nextUrl.searchParams;
  const entity = parseEntity(searchParams.get("entity"));
  const search = searchParams.get("q");
  const limitRaw = Number(searchParams.get("limit") ?? "");
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : undefined;
  const catalog = await getScheduleFilterCatalog(actor, { entity, search, limit });
  return NextResponse.json(catalog);
});
