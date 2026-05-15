import { NextResponse } from "next/server";

import { getAppActor } from "@/lib/auth/request-context";
import { canReadProfileAvatar, loadAvatarMediaFile } from "@/lib/media/service";
import { requirePermission } from "@/lib/permissions";
import { HttpError, withApiErrorHandling } from "@/lib/server/http";

function mediaResponse(file: Awaited<ReturnType<typeof loadAvatarMediaFile>>) {
  if (!file) {
    throw new HttpError(404, "MEDIA_NOT_FOUND", "Media file not found");
  }

  return new NextResponse(file.blob, {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=300, stale-while-revalidate=86400",
      ETag: `"${file.etag}"`
    }
  });
}

export const GET = withApiErrorHandling(async (_request: Request, { params }: { params: Promise<{ userId: string }> }) => {
  const actor = await getAppActor();
  if (!actor) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
  }

  const { userId } = await params;
  if (actor.userId === userId) {
    requirePermission(actor, "settings.profile.read", { ownerUserId: userId });
  }
  if (!canReadProfileAvatar(actor, userId)) {
    throw new HttpError(403, "FORBIDDEN", "Permission denied");
  }

  return mediaResponse(await loadAvatarMediaFile(userId));
});
