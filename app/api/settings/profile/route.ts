import { NextRequest, NextResponse } from "next/server";

import { getAppActor } from "@/lib/auth/request-context";
import { requirePermission } from "@/lib/permissions";
import { HttpError, validationError, withApiErrorHandling } from "@/lib/server/http";
import { loadSettingsProfile, updateSettingsProfile } from "@/lib/settings/profile.service";
import type { SettingsProfileUpdateInput } from "@/lib/settings/profile.types";

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true";
}

function parseString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseUpdateInput(formData: FormData): SettingsProfileUpdateInput {
  const avatarValue = formData.get("avatarFile");
  if (avatarValue !== null && !(avatarValue instanceof Blob)) {
    throw validationError("Invalid settings profile payload");
  }

  return {
    firstName: parseString(formData, "firstName"),
    lastName: parseString(formData, "lastName"),
    phone: parseString(formData, "phone"),
    birthDate: parseString(formData, "birthDate"),
    email: parseString(formData, "email"),
    currentPassword: parseString(formData, "currentPassword"),
    nextPassword: parseString(formData, "nextPassword"),
    profileDirty: parseBoolean(formData.get("profileDirty")),
    emailDirty: parseBoolean(formData.get("emailDirty")),
    passwordDirty: parseBoolean(formData.get("passwordDirty")),
    avatarDelete: parseBoolean(formData.get("avatarDelete")),
    avatarFile: avatarValue instanceof Blob && avatarValue.size > 0 ? avatarValue : null
  };
}

async function readSettingsProfileFormData(request: NextRequest) {
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

export const GET = withApiErrorHandling(async () => {
  const actor = await getAppActor();
  if (!actor) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
  }
  requirePermission(actor, "profile.view", { ownerUserId: actor.userId });

  const profile = await loadSettingsProfile(actor);
  return NextResponse.json(profile);
});

export const PATCH = withApiErrorHandling(async (request: NextRequest) => {
  const actor = await getAppActor();
  if (!actor) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
  }
  requirePermission(actor, "profile.update", { ownerUserId: actor.userId });

  const formData = await readSettingsProfileFormData(request);
  const result = await updateSettingsProfile(actor, parseUpdateInput(formData));
  return NextResponse.json(result);
});
