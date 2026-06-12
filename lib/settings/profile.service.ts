import type { AppActor } from "@/lib/auth/request-context";
import { profileCacheKey, readDashboardCache } from "@/lib/dashboard-cache";
import { buildAvatarMediaUrl, toAvatarMediaUrl } from "@/lib/media/urls";
import { toRuPhoneStorage } from "@/lib/phone";
import { getRequestOrigin } from "@/lib/server-origin";
import { HttpError } from "@/lib/server/http";
import {
  createSettingsProfileInfrastructure,
  type SettingsProfileInfrastructure
} from "@/lib/settings/profile.infrastructure";
import type { SettingsProfileRow } from "@/lib/settings/profile.repository";
import type {
  SettingsProfileDto,
  SettingsProfileUpdateInput,
  SettingsProfileUpdateResult
} from "@/lib/settings/profile.types";

function normalizeEmailValue(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function getPendingEmailFromAuthUser(user: unknown): string {
  if (!user || typeof user !== "object") return "";
  const maybePending = (user as { new_email?: unknown }).new_email;
  return normalizeEmailValue(maybePending);
}

function toSettingsEmailUpdateError(
  error: { message?: string; code?: string; status?: number } | null | undefined
) {
  const message = String(error?.message ?? "");
  const normalized = message.toLowerCase();
  const code = String(error?.code ?? "").toLowerCase();
  const status = Number(error?.status ?? 0);

  if (
    status === 401 ||
    normalized.includes("jwt") ||
    normalized.includes("session") ||
    normalized.includes("unauthorized")
  ) {
    return new HttpError(
      401,
      "UNAUTHORIZED",
      "Сессия устарела. Войдите заново и повторите попытку."
    );
  }

  if (
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("email_exists") ||
    code.includes("email_exists") ||
    normalized.includes("already exists")
  ) {
    return new HttpError(400, "SETTINGS_PROFILE_UPDATE_FAILED", "Email update failed", {
      fieldErrors: {
        email: ["Пользователь с таким email уже существует."]
      }
    });
  }

  if (
    normalized.includes("invalid email") ||
    normalized.includes("email address is invalid") ||
    code.includes("email_address_invalid")
  ) {
    return new HttpError(400, "SETTINGS_PROFILE_UPDATE_FAILED", "Email update failed", {
      fieldErrors: {
        email: ["Введите корректный email."]
      }
    });
  }

  if (
    normalized.includes("error sending email") ||
    normalized.includes("gomail") ||
    normalized.includes("550") ||
    normalized.includes("spam message rejected") ||
    normalized.includes("email address not authorized") ||
    normalized.includes("smtp") ||
    normalized.includes("provider") ||
    normalized.includes("email provider") ||
    normalized.includes("send email") ||
    normalized.includes("email not sent")
  ) {
    return new HttpError(400, "SETTINGS_PROFILE_UPDATE_FAILED", "Email update failed", {
      formErrors: [
        "Не удалось отправить письмо подтверждения. Проверьте настройки email-провайдера Supabase."
      ]
    });
  }

  return new HttpError(400, "SETTINGS_PROFILE_UPDATE_FAILED", "Email update failed", {
    formErrors: ["Не удалось обновить email."]
  });
}

function isMissingBirthDateColumn(error: { message?: string } | null | undefined) {
  return String(error?.message ?? "").includes("birth_date");
}

function canWriteStudentBirthDateFallback(actor: AppActor) {
  return actor.isStudent && Boolean(actor.studentId) && !actor.isTeacher;
}

async function getCurrentAuthContext(
  actor: AppActor,
  infrastructure: SettingsProfileInfrastructure
) {
  const { data: authData, error: authError } =
    await infrastructure.identityGateway.getCurrentUser();
  if (authError) throw authError;
  if (!authData.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
  }
  if (!actor.userId || authData.user.id !== actor.userId) {
    throw new HttpError(403, "FORBIDDEN", "Permission denied");
  }

  return {
    userId: authData.user.id,
    email: normalizeEmailValue(authData.user.email ?? ""),
    pendingEmail: getPendingEmailFromAuthUser(authData.user)
  };
}

async function loadProfileRow(infrastructure: SettingsProfileInfrastructure, userId: string) {
  const profileWithBirth = await infrastructure.repository.loadProfileWithBirthDate(userId);

  if (!profileWithBirth.error) {
    return (profileWithBirth.data ?? null) as SettingsProfileRow | null;
  }

  if (!isMissingBirthDateColumn(profileWithBirth.error)) {
    throw profileWithBirth.error;
  }

  const profileFallback =
    await infrastructure.repository.loadProfileWithoutBirthDate(userId);
  if (profileFallback.error) throw profileFallback.error;
  return (profileFallback.data ?? null) as SettingsProfileRow | null;
}

async function resolveBirthDate(
  infrastructure: SettingsProfileInfrastructure,
  userId: string,
  profile: SettingsProfileRow | null
) {
  const profileBirthDate = profile?.birth_date ?? "";
  if (profileBirthDate) return profileBirthDate;

  const { data: studentProfile, error: studentError } =
    await infrastructure.repository.loadStudentBirthDate(userId);
  if (studentError) throw studentError;
  return studentProfile?.birth_date ?? "";
}

function toProfileDto(params: {
  userId: string;
  email: string;
  pendingEmail: string;
  cachedAvatarUrl: string | null;
  profile: SettingsProfileRow | null;
  resolvedBirthDate: string;
}): SettingsProfileDto {
  return {
    userId: params.userId,
    email: params.email,
    pendingEmail: params.pendingEmail,
    cachedAvatarUrl: toAvatarMediaUrl(params.userId, params.cachedAvatarUrl),
    profile: {
      firstName: params.profile?.first_name ?? "",
      lastName: params.profile?.last_name ?? "",
      phone: params.profile?.phone ?? "",
      avatarUrl: toAvatarMediaUrl(params.userId, params.profile?.avatar_url ?? null),
      role: params.profile?.role ?? null,
      email: normalizeEmailValue(params.profile?.email ?? "")
    },
    resolvedBirthDate: params.resolvedBirthDate
  };
}

async function loadSettingsProfileWithInfrastructure(
  actor: AppActor,
  infrastructure: SettingsProfileInfrastructure
): Promise<SettingsProfileDto> {
  const { userId, email, pendingEmail } = await getCurrentAuthContext(
    actor,
    infrastructure
  );
  const cachedProfile = readDashboardCache<{
    displayName: string;
    email: string;
    avatarUrl: string | null;
  }>(profileCacheKey(userId));
  const profile = await loadProfileRow(infrastructure, userId);
  const resolvedBirthDate = await resolveBirthDate(infrastructure, userId, profile);

  const profileEmailValue = normalizeEmailValue(profile?.email ?? "");
  if (email && profileEmailValue !== email) {
    await infrastructure.repository.updateProfileEmail(userId, email);
    if (profile) profile.email = email;
  }

  return toProfileDto({
    userId,
    email,
    pendingEmail,
    cachedAvatarUrl: cachedProfile?.avatarUrl ?? null,
    profile,
    resolvedBirthDate
  });
}

export async function loadSettingsProfile(actor: AppActor): Promise<SettingsProfileDto> {
  const infrastructure = await createSettingsProfileInfrastructure();
  return loadSettingsProfileWithInfrastructure(actor, infrastructure);
}

async function updateProfileFields(
  infrastructure: SettingsProfileInfrastructure,
  actor: AppActor,
  userId: string,
  input: SettingsProfileUpdateInput
) {
  const normalizedPhone =
    input.phone.trim() === "" ? "" : toRuPhoneStorage(input.phone);
  if (normalizedPhone === null) {
    throw new HttpError(400, "VALIDATION_ERROR", "phone must match +7XXXXXXXXXX");
  }
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  const profileUpdate = await infrastructure.repository.updateProfileFields(userId, {
    first_name: firstName,
    last_name: lastName,
    display_name: [firstName, lastName].filter(Boolean).join(" "),
    phone: normalizedPhone
  });
  if (profileUpdate.error) throw profileUpdate.error;

  const profileBirthDateUpdate =
    await infrastructure.repository.updateProfileBirthDate(
      userId,
      input.birthDate || null
    );
  if (
    profileBirthDateUpdate.error &&
    !isMissingBirthDateColumn(profileBirthDateUpdate.error)
  ) {
    throw profileBirthDateUpdate.error;
  }
  if (
    profileBirthDateUpdate.error &&
    isMissingBirthDateColumn(profileBirthDateUpdate.error)
  ) {
    if (!canWriteStudentBirthDateFallback(actor)) {
      return;
    }

    if (input.birthDate) {
      const studentUpsert = await infrastructure.repository.upsertStudentBirthDate(
        userId,
        input.birthDate
      );
      if (studentUpsert.error) throw studentUpsert.error;
    } else {
      const studentClear =
        await infrastructure.repository.clearStudentBirthDate(userId);
      if (studentClear.error) throw studentClear.error;
    }
  }
}

async function updateAvatar(
  infrastructure: SettingsProfileInfrastructure,
  userId: string,
  input: Pick<SettingsProfileUpdateInput, "avatarDelete" | "avatarFile">
) {
  if (input.avatarDelete) {
    await infrastructure.avatarGateway.deleteAvatar(userId);
    const avatarDelete =
      await infrastructure.repository.updateProfileAvatarUrl(userId, null);
    if (avatarDelete.error) {
      throw new HttpError(
        400,
        "SETTINGS_PROFILE_UPDATE_FAILED",
        `avatar:${avatarDelete.error.message}`
      );
    }
    return { avatarUrl: null, message: "Аватар удалён" };
  }

  if (input.avatarFile) {
    const upload = await infrastructure.avatarGateway.uploadAvatar(
      userId,
      input.avatarFile
    );
    if (upload.error) {
      throw new HttpError(
        400,
        "SETTINGS_PROFILE_UPDATE_FAILED",
        `avatar:${upload.error.message}`
      );
    }

    const updatedAvatarUrl = buildAvatarMediaUrl(userId, Date.now());
    const profileAvatarUpdate =
      await infrastructure.repository.updateProfileAvatarUrl(
        userId,
        updatedAvatarUrl
      );
    if (profileAvatarUpdate.error) {
      throw new HttpError(
        400,
        "SETTINGS_PROFILE_UPDATE_FAILED",
        `avatar:${profileAvatarUpdate.error.message}`
      );
    }
    return { avatarUrl: updatedAvatarUrl, message: "Аватар обновлён" };
  }

  return null;
}

export async function updateSettingsProfile(
  actor: AppActor,
  input: SettingsProfileUpdateInput
): Promise<SettingsProfileUpdateResult> {
  const infrastructure = await createSettingsProfileInfrastructure();
  const { userId, email: currentEmail } = await getCurrentAuthContext(
    actor,
    infrastructure
  );
  const applied = {
    profile: false,
    avatar: false,
    email: false,
    password: false
  };
  let avatarMessage = "";
  let hasEmailPendingConfirmation = false;
  let pendingEmail = "";

  if (input.profileDirty) {
    await updateProfileFields(infrastructure, actor, userId, input);
    applied.profile = true;
  }

  if (input.avatarDelete || input.avatarFile) {
    const avatarResult = await updateAvatar(infrastructure, userId, input);
    avatarMessage = avatarResult?.message ?? "";
    applied.avatar = Boolean(avatarResult);
  }

  if (input.emailDirty) {
    const requestedEmail = normalizeEmailValue(input.email);
    const origin = await getRequestOrigin();
    const emailRedirectTo = `${origin}/auth/confirm?next=/settings/profile`;
    const { data, error: authUpdateError } =
      await infrastructure.identityGateway.updateEmail(
        requestedEmail,
        emailRedirectTo
      );
    if (authUpdateError) throw toSettingsEmailUpdateError(authUpdateError);
    const authEmail = normalizeEmailValue(data.user?.email ?? currentEmail);
    const pendingEmailFromResponse = getPendingEmailFromAuthUser(data.user);
    pendingEmail =
      pendingEmailFromResponse || (authEmail !== requestedEmail ? requestedEmail : "");

    if (pendingEmail) {
      hasEmailPendingConfirmation = true;
    } else {
      applied.email = true;
    }
  }

  const profile = await loadSettingsProfileWithInfrastructure(actor, infrastructure);
  if (pendingEmail) {
    profile.pendingEmail = pendingEmail;
    hasEmailPendingConfirmation = true;
    applied.email = false;
  }

  return {
    profile,
    applied,
    avatarMessage,
    hasAppliedChanges:
      applied.profile || applied.avatar || applied.email || applied.password,
    hasEmailPendingConfirmation
  };
}
