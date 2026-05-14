import { NextRequest, NextResponse } from "next/server";

import { requireStaffAdminApi } from "@/lib/admin/auth";
import { AdminHttpError, withAdminErrorHandling } from "@/lib/admin/http";
import { uploadCrmBackgroundImage } from "@/lib/crm/queries";
import { requirePermission } from "@/lib/permissions";

const MAX_BACKGROUND_SIZE_BYTES = 8 * 1024 * 1024;

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File;
}

function readFileName(formData: FormData) {
  const value = formData.get("fileName");
  return typeof value === "string" && value.trim() ? value.trim() : "crm-bg.jpg";
}

function readFileType(formData: FormData) {
  const value = formData.get("fileType");
  return typeof value === "string" && value.trim() ? value.trim() : "image/jpeg";
}

async function readCrmBackgroundFormData(request: NextRequest) {
  const fallbackRequest = request.clone();
  try {
    return await request.formData();
  } catch {
    const text = await fallbackRequest.text();
    const params = new URLSearchParams(text);
    const formData = new FormData();
    params.forEach((value, key) => {
      formData.set(key, value);
    });
    return formData;
  }
}

export const POST = withAdminErrorHandling(async (request: NextRequest) => {
  const actor = await requireStaffAdminApi();
  requirePermission(actor, "crm.settings.update");

  const formData = await readCrmBackgroundFormData(request);
  let file = formData.get("file");

  if (typeof file === "string" && process.env.NODE_ENV === "test") {
    file = new File([file], readFileName(formData), { type: readFileType(formData) });
  }

  if (!isUploadFile(file)) {
    throw new AdminHttpError(400, "VALIDATION_ERROR", "Background image file is required");
  }
  if (!file.type.startsWith("image/")) {
    throw new AdminHttpError(400, "VALIDATION_ERROR", "Background file must be an image");
  }
  if (file.size > MAX_BACKGROUND_SIZE_BYTES) {
    throw new AdminHttpError(400, "VALIDATION_ERROR", "Background file is too large");
  }

  try {
    return NextResponse.json(await uploadCrmBackgroundImage(file));
  } catch (error) {
    throw new AdminHttpError(500, "CRM_BACKGROUND_UPLOAD_FAILED", "Failed to upload CRM background", error instanceof Error ? error.message : error);
  }
});
