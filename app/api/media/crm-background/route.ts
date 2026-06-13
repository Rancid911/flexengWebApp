import { NextRequest, NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/auth";
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
  await requireAdminApiPermission("crm.leads.view");

  const path = request.nextUrl.searchParams.get("p");
  return mediaResponse(await loadCrmBackgroundMediaFile(path));
});
