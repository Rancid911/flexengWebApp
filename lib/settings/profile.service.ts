import type { AppActor } from "@/lib/auth/request-context";
import { profileCacheKey, readDashboardCache } from "@/lib/dashboard-cache";
import { buildAvatarMediaUrl, toAvatarMediaUrl } from "@/lib/media/urls";
import { getRequestOrigin } from "@/lib/server-origin";
import { HttpError } from "@/lib/server/http";
import { runAuthRequestWithLockRetry } from "@/lib/supabase/auth-request";
import { createClient } from "@/lib/supabase/server";
import type { SettingsProfileDto, SettingsProfileUpdateInput, SettingsProfileUpdateResult } from "@/lib/settings/profile.types";
import { toRuPhoneStorage } from "@/lib/phone";

type ProfileRow = {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string | null;
  email?: string | null;
  birth_date?: string | null;
};

function normalizeEmailValue(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function getPendingEmailFromAuthUser(user: unknown): string {
  if (!user || typeof user !== "object") return "";
  const maybePending = (user as { new_email?: unknown }).new_email;
  return normalizeEmailValue(maybePending);
}

function toSettingsEmailUpdateError(error: { message?: string; code?: string; status?: number } | null | undefined) {
  const message = String(error?.message ?? "");
  const normalized = message.toLowerCase();
  const code = String(error?.code ?? "").toLowerCase();
  const status = Number(error?.status ?? 0);

  if (status === 401 || normalized.includes("jwt") || normalized.includes("session") || normalized.includes("unauthorized")) {
    return new HttpError(401, "UNAUTHORIZED", "Сессия устарела. Войдите заново и повторите попытку.");
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

  if (normalized.includes("invalid email") || normalized.includes("email address is invalid") || code.includes("email_address_invalid")) {
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
      formErrors: ["Не удалось отправить письмо подтверждения. Проверьте настройки email-провайдера Supabase."]
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

async function getCurrentAuthContext(actor: AppActor) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await runAuthRequestWithLockRetry(() => supabase.auth.getUser());
  if (authError) throw authError;
  if (!authData.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
  }
  if (!actor.userId || authData.user.id !== actor.userId) {
    throw new HttpError(403, "FORBIDDEN", "Permission denied");
  }

  return {
    supabase,
    user: authData.user,
    userId: authData.user.id,
    email: normalizeEmailValue(authData.user.email ?? ""),
    pendingEmail: getPendingEmailFromAuthUser(authData.user)
  };
}

async function loadProfileRow(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  let profile: ProfileRow | null = null;

  const profileWithBirth = await supabase
    .from("profiles")
    .select("first_name, last_name, phone, avatar_url, role, email, birth_date")
    .eq("id", userId)
    .maybeSingle();

  if (!profileWithBirth.error) {
    profile = profileWithBirth.data;
  } else if (isMissingBirthDateColumn(profileWithBirth.error)) {
    const profileFallback = await supabase
      .from("profiles")
      .select("first_name, last_name, phone, avatar_url, role, email")
      .eq("id", userId)
      .maybeSingle();
    if (profileFallback.error) throw profileFallback.error;
    profile = profileFallback.data;
  } else {
    throw profileWithBirth.error;
  }

  return profile;
}

async function resolveBirthDate(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, profile: ProfileRow | null) {
  let resolvedBirthDate = profile?.birth_date ?? "";
  if (resolvedBirthDate) return resolvedBirthDate;

  const { data: studentProfile, error: studentError } = await supabase
    .from("students")
    .select("birth_date")
    .eq("profile_id", userId)
    .maybeSingle();
  if (studentError) throw studentError;
  resolvedBirthDate = studentProfile?.birth_date ?? "";
  return resolvedBirthDate;
}

function toProfileDto(params: {
  userId: string;
  email: string;
  pendingEmail: string;
  cachedAvatarUrl: string | null;
  profile: ProfileRow | null;
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

export async function loadSettingsProfile(actor: AppActor): Promise<SettingsProfileDto> {
  const { supabase, userId, email, pendingEmail } = await getCurrentAuthContext(actor);
  const cachedProfile = readDashboardCache<{ displayName: string; email: string; avatarUrl: string | null }>(profileCacheKey(userId));
  const profile = await loadProfileRow(supabase, userId);
  const resolvedBirthDate = await resolveBirthDate(supabase, userId, profile);

  const profileEmailValue = normalizeEmailValue(profile?.email ?? "");
  if (email && profileEmailValue !== email) {
    await supabase.from("profiles").update({ email }).eq("id", userId);
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

async function updateProfileFields(
  supabase: Awaited<ReturnType<typeof createClient>>,
  actor: AppActor,
  userId: string,
  input: SettingsProfileUpdateInput
) {
  const normalizedPhone = input.phone.trim() === "" ? "" : toRuPhoneStorage(input.phone);
  if (normalizedPhone === null) {
    throw new HttpError(400, "VALIDATION_ERROR", "phone must match +7XXXXXXXXXX");
  }
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  const profilePayload = {
    first_name: firstName,
    last_name: lastName,
    display_name: [firstName, lastName].filter(Boolean).join(" "),
    phone: normalizedPhone
  };

  const { error: profileUpdateError } = await supabase.from("profiles").update(profilePayload).eq("id", userId);
  if (profileUpdateError) throw profileUpdateError;

  const { error: profileBirthDateError } = await supabase.from("profiles").update({ birth_date: input.birthDate || null }).eq("id", userId);
  if (profileBirthDateError && !isMissingBirthDateColumn(profileBirthDateError)) {
    throw profileBirthDateError;
  }
  if (profileBirthDateError && isMissingBirthDateColumn(profileBirthDateError)) {
    if (!canWriteStudentBirthDateFallback(actor)) {
      return;
    }

    if (input.birthDate) {
      const { error: studentUpsertError } = await supabase
        .from("students")
        .upsert({ profile_id: userId, birth_date: input.birthDate }, { onConflict: "profile_id" });
      if (studentUpsertError) throw studentUpsertError;
    } else {
      const { error: studentClearError } = await supabase.from("students").update({ birth_date: null }).eq("profile_id", userId);
      if (studentClearError) throw studentClearError;
    }
  }
}

async function updateAvatar(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  input: Pick<SettingsProfileUpdateInput, "avatarDelete" | "avatarFile">
) {
  const path = `${userId}/avatar`;

  if (input.avatarDelete) {
    await supabase.storage.from("avatars").remove([path]);
    const { error: avatarDeleteError } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
    if (avatarDeleteError) throw new HttpError(400, "SETTINGS_PROFILE_UPDATE_FAILED", `avatar:${avatarDeleteError.message}`);
    return { avatarUrl: null, message: "Аватар удалён" };
  }

  if (input.avatarFile) {
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, input.avatarFile, {
      upsert: true,
      contentType: "image/png",
      cacheControl: "3600"
    });
    if (uploadError) throw new HttpError(400, "SETTINGS_PROFILE_UPDATE_FAILED", `avatar:${uploadError.message}`);

    const updatedAvatarUrl = buildAvatarMediaUrl(userId, Date.now());
    const { error: profileAvatarUpdateError } = await supabase.from("profiles").update({ avatar_url: updatedAvatarUrl }).eq("id", userId);
    if (profileAvatarUpdateError) throw new HttpError(400, "SETTINGS_PROFILE_UPDATE_FAILED", `avatar:${profileAvatarUpdateError.message}`);
    return { avatarUrl: updatedAvatarUrl, message: "Аватар обновлён" };
  }

  return null;
}

export async function updateSettingsProfile(actor: AppActor, input: SettingsProfileUpdateInput): Promise<SettingsProfileUpdateResult> {
  const { supabase, userId, email: currentEmail } = await getCurrentAuthContext(actor);
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
    await updateProfileFields(supabase, actor, userId, input);
    applied.profile = true;
  }

  if (input.avatarDelete || input.avatarFile) {
    const avatarResult = await updateAvatar(supabase, userId, input);
    avatarMessage = avatarResult?.message ?? "";
    applied.avatar = Boolean(avatarResult);
  }

  if (input.emailDirty) {
    const requestedEmail = normalizeEmailValue(input.email);
    const origin = await getRequestOrigin();
    const emailRedirectTo = `${origin}/auth/confirm?next=/settings/profile`;
    const { data, error: authUpdateError } = await runAuthRequestWithLockRetry(() =>
      supabase.auth.updateUser({ email: requestedEmail }, { emailRedirectTo })
    );
    if (authUpdateError) throw toSettingsEmailUpdateError(authUpdateError);
    const authEmail = normalizeEmailValue(data.user?.email ?? currentEmail);
    const pendingEmailFromResponse = getPendingEmailFromAuthUser(data.user);
    pendingEmail = pendingEmailFromResponse || (authEmail !== requestedEmail ? requestedEmail : "");

    if (pendingEmail) {
      hasEmailPendingConfirmation = true;
    } else {
      applied.email = true;
    }
  }

  const profile = await loadSettingsProfile(actor);
  if (pendingEmail) {
    profile.pendingEmail = pendingEmail;
    hasEmailPendingConfirmation = true;
    applied.email = false;
  }

  return {
    profile,
    applied,
    avatarMessage,
    hasAppliedChanges: applied.profile || applied.avatar || applied.email || applied.password,
    hasEmailPendingConfirmation
  };
}
