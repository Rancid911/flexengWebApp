import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { requirePermission } from "@/lib/permissions";
import { loadCrmBackgroundMediaFile } from "@/lib/media/service";
import { HttpError, withApiErrorHandling } from "@/lib/server/http";

function mediaResponse(file: Awaited<ReturnType<typeof loadCrmBackgroundMediaFile>>) {
  if (!file) {
    throw new HttpError(404, "MEDIA_NOT_FOUND", "Media file not found");
  }

  return new NextResponse(file.blob, {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=300, stale-while-revalidate=3600",
      ETag: `"${file.etag}"`
    }
  });
}

export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const actor = await requireStaffAdminApi();
    requirePermission(actor, "crm.leads.view");

  const path = request.nextUrl.searchParams.get("p");
  return mediaResponse(await loadCrmBackgroundMediaFile(path));
});
