import { NextRequest, NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/auth";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { loadCrmSettings, updateCrmSettings } from "@/lib/crm/queries";
import { CRM_ASSETS_BUCKET, extractStoragePathFromPublicUrl, isInternalCrmBackgroundMediaUrl } from "@/lib/media/urls";

function normalizeBackgroundImageUrl(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 2000) return undefined;
  if (isInternalCrmBackgroundMediaUrl(trimmed)) return trimmed;
  if (extractStoragePathFromPublicUrl(trimmed, CRM_ASSETS_BUCKET)) return trimmed;

  return undefined;
}

export const GET = withAdminErrorHandling(async () => {
  await requireAdminApiPermission("crm.leads.view");
  try {
    return NextResponse.json(await loadCrmSettings());
  } catch (error) {
    throw new AdminHttpError(500, "CRM_SETTINGS_FETCH_FAILED", "Failed to fetch CRM settings", error instanceof Error ? error.message : error);
  }
});

export const PATCH = withAdminErrorHandling(async (request: NextRequest) => {
  const actor = await requireAdminApiPermission("crm.leads.manage");
  const body = (await request.json().catch(() => null)) as { background_image_url?: unknown } | null;
  const backgroundImageUrl = normalizeBackgroundImageUrl(body?.background_image_url);

  if (backgroundImageUrl === undefined) {
    throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid CRM settings payload");
  }

  try {
    return NextResponse.json(await updateCrmSettings(actor, { background_image_url: backgroundImageUrl }));
  } catch (error) {
    throw new AdminHttpError(500, "CRM_SETTINGS_SAVE_FAILED", "Failed to save CRM settings", error instanceof Error ? error.message : error);
  }
});
