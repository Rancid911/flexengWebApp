"use client";

import { normalizeEmailValue, type FieldErrorKey, type SettingsSnapshot } from "@/app/(workspace)/(shared-zone)/settings/use-settings-runtime-state";
import { isValidRuPhone, toRuPhoneStorage } from "@/lib/phone";
import { mapUiErrorMessage } from "@/lib/ui-error-map";

export type SettingsValidationInput = {
  confirmPassword: string;
  currentPassword: string;
  firstName: string;
  lastName: string;
  newEmail: string;
  nextPassword: string;
  phone: string;
};

export type SettingsValidationResult = {
  fieldErrors: Partial<Record<FieldErrorKey, string>>;
  normalizedEmail: string;
  normalizedPhone: string | null;
  passwordRequested: boolean;
  trimmedFirstName: string;
  trimmedLastName: string;
};

export type SettingsDirtyStateInput = {
  birthDate: string;
  normalizedEmail: string;
  normalizedPhoneValue: string;
  pendingAvatarBlob: Blob | null;
  pendingAvatarDelete: boolean;
  pendingEmailAwaitingConfirm: string;
  snapshot: SettingsSnapshot;
  trimmedFirstName: string;
  trimmedLastName: string;
  passwordRequested: boolean;
};

export function composeDisplayName(firstName: string, lastName: string, fallbackEmail: string) {
  const merged = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
  if (merged) return merged;
  return fallbackEmail.split("@")[0] ?? "";
}

export function initialsFromName(displayName: string, email: string) {
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || email[0]?.toUpperCase() || "U";
}

export function mapPasswordUpdateError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials") ||
    normalized.includes("wrong password") ||
    normalized.includes("invalid password")
  ) {
    return "Текущий пароль введён неверно";
  }

  return mapUiErrorMessage(message, "Не удалось обновить пароль");
}

export function validateSettingsForm(input: SettingsValidationInput): SettingsValidationResult {
  const fieldErrors: Partial<Record<FieldErrorKey, string>> = {};
  const normalizedPhone = toRuPhoneStorage(input.phone);
  const trimmedFirstName = input.firstName.trim();
  const trimmedLastName = input.lastName.trim();
  const normalizedEmail = normalizeEmailValue(input.newEmail);
  const passwordRequested = Boolean(input.currentPassword || input.nextPassword || input.confirmPassword);

  if (!trimmedFirstName) fieldErrors.firstName = "Введите имя";
  if (!trimmedLastName) fieldErrors.lastName = "Введите фамилию";
  if (!isValidRuPhone(input.phone) || !normalizedPhone) fieldErrors.phone = "Телефон должен быть в формате +7 (999) 999 99 99";
  if (!normalizedEmail) {
    fieldErrors.email = "Введите email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    fieldErrors.email = "Некорректный формат email";
  }

  if (passwordRequested) {
    if (!input.currentPassword) fieldErrors.currentPassword = "Введите текущий пароль";
    if (input.nextPassword.length < 8) fieldErrors.nextPassword = "Новый пароль должен быть не короче 8 символов";
    if (input.nextPassword !== input.confirmPassword) fieldErrors.confirmPassword = "Подтверждение пароля не совпадает";
  }

  return {
    fieldErrors,
    normalizedEmail,
    normalizedPhone,
    passwordRequested,
    trimmedFirstName,
    trimmedLastName
  };
}

export function getSettingsErrorSections(fieldErrors: Partial<Record<FieldErrorKey, string>>) {
  const hasProfileErrors = ["firstName", "lastName", "birthDate", "phone"].some((key) => Boolean(fieldErrors[key as FieldErrorKey]));
  const hasAccessErrors = ["email", "currentPassword", "nextPassword", "confirmPassword"].some((key) => Boolean(fieldErrors[key as FieldErrorKey]));

  return {
    hasAccessErrors,
    hasProfileErrors
  };
}

export function getSettingsDirtyState({
  birthDate,
  normalizedEmail,
  normalizedPhoneValue,
  passwordRequested,
  pendingAvatarBlob,
  pendingAvatarDelete,
  pendingEmailAwaitingConfirm,
  snapshot,
  trimmedFirstName,
  trimmedLastName
}: SettingsDirtyStateInput) {
  const avatarDirty = pendingAvatarDelete || Boolean(pendingAvatarBlob);
  const profileDirty =
    trimmedFirstName !== snapshot.firstName ||
    trimmedLastName !== snapshot.lastName ||
    normalizedPhoneValue !== snapshot.phone ||
    (birthDate || "") !== (snapshot.birthDate || "");
  const emailDirty = normalizedEmail !== snapshot.email && normalizedEmail !== pendingEmailAwaitingConfirm;

  return {
    avatarDirty,
    emailDirty,
    passwordDirty: passwordRequested,
    profileDirty
  };
}
