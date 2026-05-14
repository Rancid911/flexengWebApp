"use client";

import { useCallback } from "react";

import { profileCacheKey, writeDashboardCache } from "@/lib/dashboard-cache";
import { readRuntimeCache, writeRuntimeCache } from "@/lib/session-runtime-cache";

export type ProfileCacheUpdatedDetail = {
  displayName: string;
  email: string;
  avatarUrl: string | null;
};

export type FieldErrorKey =
  | "firstName"
  | "lastName"
  | "birthDate"
  | "phone"
  | "email"
  | "currentPassword"
  | "nextPassword"
  | "confirmPassword";

export type SettingsSnapshot = {
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  email: string;
};

export type SettingsRuntimeSnapshot = SettingsSnapshot & {
  userId: string;
  avatarUrl: string | null;
  pendingEmailAwaitingConfirm?: string;
};

export const SETTINGS_RUNTIME_KEY = "student-settings:v1";

export function normalizeEmailValue(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

export function getPendingEmailFromAuthUser(user: unknown): string {
  if (!user || typeof user !== "object") return "";
  const maybePending = (user as { new_email?: unknown }).new_email;
  return normalizeEmailValue(maybePending);
}

export function readSettingsRuntimeSnapshot() {
  return readRuntimeCache<SettingsRuntimeSnapshot>(SETTINGS_RUNTIME_KEY);
}

type SettingsCacheSyncArgs = {
  userId: string;
  displayName: string;
  profileEmail: string;
  avatarUrl: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  pendingEmailAwaitingConfirm: string;
};

export function useSettingsCacheSync({
  userId,
  displayName,
  profileEmail,
  avatarUrl,
  firstName,
  lastName,
  phone,
  birthDate,
  pendingEmailAwaitingConfirm
}: SettingsCacheSyncArgs) {
  const syncProfileCache = useCallback(
    (override?: Partial<ProfileCacheUpdatedDetail>) => {
      if (!userId) return;

      const payload: ProfileCacheUpdatedDetail = {
        displayName: override?.displayName ?? displayName,
        email: override?.email ?? profileEmail,
        avatarUrl: override?.avatarUrl ?? avatarUrl
      };

      writeDashboardCache(profileCacheKey(userId), payload);
      window.dispatchEvent(new CustomEvent<ProfileCacheUpdatedDetail>("dashboard:profile-updated", { detail: payload }));
    },
    [avatarUrl, displayName, profileEmail, userId]
  );

  const syncSettingsRuntimeCache = useCallback(
    (override?: Partial<SettingsRuntimeSnapshot>) => {
      const resolvedUserId = override?.userId ?? userId;
      if (!resolvedUserId) return;

      writeRuntimeCache<SettingsRuntimeSnapshot>(SETTINGS_RUNTIME_KEY, {
        userId: resolvedUserId,
        firstName: override?.firstName ?? firstName,
        lastName: override?.lastName ?? lastName,
        phone: override?.phone ?? phone,
        birthDate: override?.birthDate ?? birthDate,
        email: override?.email ?? profileEmail,
        avatarUrl: override?.avatarUrl ?? avatarUrl,
        pendingEmailAwaitingConfirm: override?.pendingEmailAwaitingConfirm ?? pendingEmailAwaitingConfirm
      });
    },
    [avatarUrl, birthDate, firstName, lastName, pendingEmailAwaitingConfirm, phone, profileEmail, userId]
  );

  return {
    syncProfileCache,
    syncSettingsRuntimeCache
  };
}
