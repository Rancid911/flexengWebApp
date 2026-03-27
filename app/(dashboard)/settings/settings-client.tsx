"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import { profileCacheKey, readDashboardCache, writeDashboardCache } from "@/lib/dashboard-cache";
import { readRuntimeCache, writeRuntimeCache } from "@/lib/session-runtime-cache";
import { backspaceRuPhone, isValidRuPhone, normalizeRuPhoneInput, toRuPhoneStorage } from "@/lib/phone";
import { runAuthRequestWithLockRetry } from "@/lib/supabase/auth-request";
import { createClient } from "@/lib/supabase/client";
import { mapUiErrorMessage } from "@/lib/ui-error-map";
import { cn } from "@/lib/utils";

const AVATAR_CROP_SIZE = 220;
const AVATAR_EXPORT_SIZE = 512;
const AVATAR_ZOOM_MIN = 0.5;
const AVATAR_ZOOM_MAX = 4;
const AVATAR_ZOOM_DEFAULT = 1.15;
const AVATAR_ZOOM_STEP = 0.05;

type ProfileCacheUpdatedDetail = {
  displayName: string;
  email: string;
  avatarUrl: string | null;
};

type FieldErrorKey =
  | "firstName"
  | "lastName"
  | "birthDate"
  | "phone"
  | "email"
  | "currentPassword"
  | "nextPassword"
  | "confirmPassword";

type SettingsSnapshot = {
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  email: string;
};

type SettingsRuntimeSnapshot = SettingsSnapshot & {
  userId: string;
  avatarUrl: string | null;
  pendingEmailAwaitingConfirm?: string;
};

const SETTINGS_RUNTIME_KEY = "student-settings:v1";

function composeDisplayName(firstName: string, lastName: string, fallbackEmail: string) {
  const merged = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
  if (merged) return merged;
  return fallbackEmail.split("@")[0] ?? "";
}

function initialsFromName(displayName: string, email: string) {
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || email[0]?.toUpperCase() || "U";
}

function loadImageFromDataUrl(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Не удалось прочитать изображение"));
    img.src = src;
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(meta)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function mapPasswordUpdateError(error: unknown): string {
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

function normalizeEmailValue(value: unknown): string {
  if (typeof value !== "string") return "";
  const normalized = value.trim().toLowerCase();
  return normalized;
}

function getPendingEmailFromAuthUser(user: unknown): string {
  if (!user || typeof user !== "object") return "";
  const maybePending = (user as { new_email?: unknown }).new_email;
  return normalizeEmailValue(maybePending);
}

export function SettingsClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const runtimeSnapshot = readRuntimeCache<SettingsRuntimeSnapshot>(SETTINGS_RUNTIME_KEY);
  const hasRuntimeSnapshot = Boolean(runtimeSnapshot);

  const [userId, setUserId] = useState(runtimeSnapshot?.userId ?? "");
  const [profileEmail, setProfileEmail] = useState(runtimeSnapshot?.email ?? "");
  const [firstName, setFirstName] = useState(runtimeSnapshot?.firstName ?? "");
  const [lastName, setLastName] = useState(runtimeSnapshot?.lastName ?? "");
  const [phone, setPhone] = useState(runtimeSnapshot?.phone ? normalizeRuPhoneInput(runtimeSnapshot.phone) : "+7 ");
  const [birthDate, setBirthDate] = useState(runtimeSnapshot?.birthDate ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(runtimeSnapshot?.avatarUrl ?? null);
  const [newEmail, setNewEmail] = useState(runtimeSnapshot?.email ?? "");
  const [pendingEmailAwaitingConfirm, setPendingEmailAwaitingConfirm] = useState(runtimeSnapshot?.pendingEmailAwaitingConfirm ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(!runtimeSnapshot);
  const [savingAll, setSavingAll] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [profileSectionError, setProfileSectionError] = useState("");
  const [accessSectionError, setAccessSectionError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldErrorKey, string>>>({});
  const [avatarMessage, setAvatarMessage] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(AVATAR_ZOOM_DEFAULT);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applyingCrop, setApplyingCrop] = useState(false);
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null);
  const [pendingAvatarDelete, setPendingAvatarDelete] = useState(false);
  const [snapshot, setSnapshot] = useState<SettingsSnapshot>({
    firstName: runtimeSnapshot?.firstName ?? "",
    lastName: runtimeSnapshot?.lastName ?? "",
    phone: runtimeSnapshot?.phone ?? "",
    birthDate: runtimeSnapshot?.birthDate ?? "",
    email: runtimeSnapshot?.email ?? ""
  });
  const today = useMemo(() => new Date(), []);
  const minBirthDate = useMemo(() => new Date(1930, 0), []);

  const displayName = useMemo(() => composeDisplayName(firstName, lastName, profileEmail), [firstName, lastName, profileEmail]);
  const avatarFallback = useMemo(() => initialsFromName(displayName, profileEmail), [displayName, profileEmail]);

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
        phone: override?.phone ?? toRuPhoneStorage(phone) ?? "",
        birthDate: override?.birthDate ?? birthDate,
        email: override?.email ?? profileEmail,
        avatarUrl: override?.avatarUrl ?? avatarUrl,
        pendingEmailAwaitingConfirm: override?.pendingEmailAwaitingConfirm ?? pendingEmailAwaitingConfirm
      });
    },
    [avatarUrl, birthDate, firstName, lastName, pendingEmailAwaitingConfirm, phone, profileEmail, userId]
  );

  const loadSettings = useCallback(async () => {
    const supabase = createClient();
    try {
      if (!hasRuntimeSnapshot) {
        setLoading(true);
      }
      const { data: authData, error: authError } = await runAuthRequestWithLockRetry(() => supabase.auth.getUser());
      if (authError) throw authError;

      if (!authData.user) {
        router.replace("/login");
        return;
      }

      const uid = authData.user.id;
      setUserId(uid);
      const email = normalizeEmailValue(authData.user.email ?? "");
      const pendingEmail = getPendingEmailFromAuthUser(authData.user);
      setProfileEmail(email);
      setNewEmail(pendingEmail || email);
      setPendingEmailAwaitingConfirm(pendingEmail);

      const cachedProfile = readDashboardCache<{ displayName: string; email: string; avatarUrl: string | null }>(profileCacheKey(uid));
      if (cachedProfile?.avatarUrl) {
        setAvatarUrl(cachedProfile.avatarUrl);
      }

      let profile: {
        first_name: string | null;
        last_name: string | null;
        phone: string | null;
        avatar_url: string | null;
        role: string | null;
        email?: string | null;
        birth_date?: string | null;
      } | null = null;

      const profileWithBirth = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, avatar_url, role, email, birth_date")
        .eq("id", uid)
        .maybeSingle();

      if (!profileWithBirth.error) {
        profile = profileWithBirth.data;
      } else if (String(profileWithBirth.error.message).includes("birth_date")) {
        const profileFallback = await supabase
          .from("profiles")
          .select("first_name, last_name, phone, avatar_url, role, email")
          .eq("id", uid)
          .maybeSingle();
        if (profileFallback.error) throw profileFallback.error;
        profile = profileFallback.data;
      } else {
        throw profileWithBirth.error;
      }

      let resolvedBirthDate = profile?.birth_date ?? "";
      if (!resolvedBirthDate) {
        const { data: studentProfile, error: studentError } = await supabase
          .from("students")
          .select("birth_date")
          .eq("profile_id", uid)
          .maybeSingle();
        if (studentError) throw studentError;
        resolvedBirthDate = studentProfile?.birth_date ?? "";
      }

      setFirstName(profile?.first_name ?? "");
      setLastName(profile?.last_name ?? "");
      setPhone(profile?.phone ? normalizeRuPhoneInput(profile.phone) : "+7 ");
      setAvatarUrl(profile?.avatar_url ?? null);
      setBirthDate(resolvedBirthDate);

      const profileEmailValue = normalizeEmailValue(profile?.email ?? "");
      if (email && profileEmailValue !== email) {
        await supabase.from("profiles").update({ email }).eq("id", uid);
      }

      setLoadError("");
      setProfileSectionError("");
      setAccessSectionError("");
      setFieldErrors({});
      setSaveMessage("");
      setAvatarMessage("");
      setAvatarError("");
      setPendingAvatarBlob(null);
      setPendingAvatarDelete(false);
      setSnapshot({
        firstName: profile?.first_name ?? "",
        lastName: profile?.last_name ?? "",
        phone: profile?.phone ?? "",
        birthDate: resolvedBirthDate,
        email
      });
      writeRuntimeCache<SettingsRuntimeSnapshot>(SETTINGS_RUNTIME_KEY, {
        userId: uid,
        firstName: profile?.first_name ?? "",
        lastName: profile?.last_name ?? "",
        phone: profile?.phone ?? "",
        birthDate: resolvedBirthDate,
        email,
        avatarUrl: profile?.avatar_url ?? null,
        pendingEmailAwaitingConfirm: pendingEmail
      });
    } catch (error) {
      const message = mapUiErrorMessage(error instanceof Error ? error.message : "", "Не удалось загрузить настройки");
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [hasRuntimeSnapshot, router]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!saveMessage) return;
    const timer = window.setTimeout(() => setSaveMessage(""), 5000);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  useEffect(() => {
    if (!avatarMessage) return;
    const timer = window.setTimeout(() => setAvatarMessage(""), 5000);
    return () => window.clearTimeout(timer);
  }, [avatarMessage]);

  async function handleSaveAll(event: FormEvent) {
    event.preventDefault();
    if (!userId) return;

    setSaveMessage("");
    setLoadError("");
    setProfileSectionError("");
    setAccessSectionError("");
    setFieldErrors({});

    const nextFieldErrors: Partial<Record<FieldErrorKey, string>> = {};
    const normalizedPhone = toRuPhoneStorage(phone);
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const normalizedEmail = normalizeEmailValue(newEmail);
    const passwordRequested = Boolean(currentPassword || nextPassword || confirmPassword);

    if (!trimmedFirstName) nextFieldErrors.firstName = "Введите имя";
    if (!trimmedLastName) nextFieldErrors.lastName = "Введите фамилию";
    if (!isValidRuPhone(phone) || !normalizedPhone) nextFieldErrors.phone = "Телефон должен быть в формате +7 (999) 999 99 99";
    if (!normalizedEmail) {
      nextFieldErrors.email = "Введите email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextFieldErrors.email = "Некорректный формат email";
    }

    if (passwordRequested) {
      if (!currentPassword) nextFieldErrors.currentPassword = "Введите текущий пароль";
      if (nextPassword.length < 8) nextFieldErrors.nextPassword = "Новый пароль должен быть не короче 8 символов";
      if (nextPassword !== confirmPassword) nextFieldErrors.confirmPassword = "Подтверждение пароля не совпадает";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      const hasProfileErrors = ["firstName", "lastName", "birthDate", "phone"].some((key) => Boolean(nextFieldErrors[key as FieldErrorKey]));
      const hasAccessErrors = ["email", "currentPassword", "nextPassword", "confirmPassword"].some((key) =>
        Boolean(nextFieldErrors[key as FieldErrorKey])
      );
      if (hasProfileErrors) setProfileSectionError("Проверьте поля профиля");
      if (hasAccessErrors) setAccessSectionError("Проверьте поля доступа");
      return;
    }

    const normalizedPhoneValue = normalizedPhone as string;

    const avatarDirty = pendingAvatarDelete || Boolean(pendingAvatarBlob);
    const profileDirty =
      trimmedFirstName !== snapshot.firstName ||
      trimmedLastName !== snapshot.lastName ||
      normalizedPhoneValue !== snapshot.phone ||
      (birthDate || "") !== (snapshot.birthDate || "");
    const emailDirty = normalizedEmail !== snapshot.email && normalizedEmail !== pendingEmailAwaitingConfirm;
    const passwordDirty = passwordRequested;

    if (!profileDirty && !emailDirty && !passwordDirty && !avatarDirty) {
      setSaveMessage("Нет изменений");
      return;
    }

    setSavingAll(true);
    let hasAppliedChanges = false;
    let hasEmailPendingConfirmation = false;
    let nextSnapshotEmail = snapshot.email;
    let nextPendingEmail = pendingEmailAwaitingConfirm;
    const supabase = createClient();

    try {
      if (profileDirty) {
        const profilePayload = {
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          phone: normalizedPhoneValue
        };

        const { error: profileUpdateError } = await supabase.from("profiles").update(profilePayload).eq("id", userId);
        if (profileUpdateError) throw profileUpdateError;

        const { error: profileBirthDateError } = await supabase.from("profiles").update({ birth_date: birthDate || null }).eq("id", userId);
        if (profileBirthDateError && !String(profileBirthDateError.message).includes("birth_date")) {
          throw profileBirthDateError;
        }
        if (profileBirthDateError && String(profileBirthDateError.message).includes("birth_date")) {
          if (birthDate) {
            const { error: studentUpsertError } = await supabase
              .from("students")
              .upsert({ profile_id: userId, birth_date: birthDate }, { onConflict: "profile_id" });
            if (studentUpsertError) throw studentUpsertError;
          } else {
            const { error: studentClearError } = await supabase.from("students").update({ birth_date: null }).eq("profile_id", userId);
            if (studentClearError) throw studentClearError;
          }
        }

        syncProfileCache({
          displayName: composeDisplayName(trimmedFirstName, trimmedLastName, profileEmail)
        });
        syncSettingsRuntimeCache({
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          phone: normalizedPhoneValue,
          birthDate: birthDate || ""
        });
        setFirstName(trimmedFirstName);
        setLastName(trimmedLastName);
        hasAppliedChanges = true;
      }
    } catch (error) {
      setProfileSectionError(mapUiErrorMessage(error instanceof Error ? error.message : "", "Не удалось сохранить профиль"));
      setSavingAll(false);
      return;
    }

    try {
      if (avatarDirty) {
        setUploadingAvatar(true);
        const path = `${userId}/avatar`;

        if (pendingAvatarDelete) {
          await supabase.storage.from("avatars").remove([path]);
          const { error: avatarDeleteError } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
          if (avatarDeleteError) throw avatarDeleteError;
          setAvatarUrl(null);
          setAvatarMessage("Аватар удалён");
          syncProfileCache({ avatarUrl: null });
          syncSettingsRuntimeCache({ avatarUrl: null });
          hasAppliedChanges = true;
        }

        if (pendingAvatarBlob) {
          const { error: uploadError } = await supabase.storage.from("avatars").upload(path, pendingAvatarBlob, {
            upsert: true,
            contentType: "image/png",
            cacheControl: "3600"
          });
          if (uploadError) throw uploadError;

          const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);
          const updatedAvatarUrl = `${publicData.publicUrl}?v=${Date.now()}`;
          const { error: profileAvatarUpdateError } = await supabase.from("profiles").update({ avatar_url: updatedAvatarUrl }).eq("id", userId);
          if (profileAvatarUpdateError) throw profileAvatarUpdateError;

          setAvatarUrl(updatedAvatarUrl);
          setAvatarMessage("Аватар обновлён");
          syncProfileCache({ avatarUrl: updatedAvatarUrl });
          syncSettingsRuntimeCache({ avatarUrl: updatedAvatarUrl });
          hasAppliedChanges = true;
        }

        setPendingAvatarBlob(null);
        setPendingAvatarDelete(false);
      }
    } catch (error) {
      setProfileSectionError(mapUiErrorMessage(error instanceof Error ? error.message : "", "Не удалось сохранить аватар"));
      setSavingAll(false);
      setUploadingAvatar(false);
      return;
    } finally {
      setUploadingAvatar(false);
    }

    try {
      if (emailDirty) {
        const { data, error: authUpdateError } = await runAuthRequestWithLockRetry(() => supabase.auth.updateUser({ email: normalizedEmail }));
        if (authUpdateError) throw authUpdateError;
        const authEmail = normalizeEmailValue(data.user?.email ?? profileEmail);
        const pendingEmail = getPendingEmailFromAuthUser(data.user) || (authEmail !== normalizedEmail ? normalizedEmail : "");

        if (pendingEmail) {
          setPendingEmailAwaitingConfirm(pendingEmail);
          setNewEmail(pendingEmail);
          syncSettingsRuntimeCache({ pendingEmailAwaitingConfirm: pendingEmail });
          nextPendingEmail = pendingEmail;
          hasEmailPendingConfirmation = true;
        } else {
          const { error: profileEmailError } = await supabase.from("profiles").update({ email: authEmail }).eq("id", userId);
          if (profileEmailError) throw profileEmailError;

          setProfileEmail(authEmail);
          setNewEmail(authEmail);
          setPendingEmailAwaitingConfirm("");
          syncProfileCache({ email: authEmail });
          syncSettingsRuntimeCache({ email: authEmail, pendingEmailAwaitingConfirm: "" });
          nextSnapshotEmail = authEmail;
          nextPendingEmail = "";
          hasAppliedChanges = true;
        }
      }
    } catch (error) {
      const message = mapUiErrorMessage(error instanceof Error ? error.message : "", "Не удалось обновить email");
      setFieldErrors((prev) => ({ ...prev, email: message }));
      setAccessSectionError(message);
      setSavingAll(false);
      return;
    }

    try {
      if (passwordDirty) {
        const { error: verifyError } = await runAuthRequestWithLockRetry(() =>
          supabase.auth.signInWithPassword({
            email: profileEmail,
            password: currentPassword
          })
        );
        if (verifyError) throw new Error("Текущий пароль указан неверно");

        const { error: updateError } = await runAuthRequestWithLockRetry(() => supabase.auth.updateUser({ password: nextPassword }));
        if (updateError) throw updateError;

        setCurrentPassword("");
        setNextPassword("");
        setConfirmPassword("");
        hasAppliedChanges = true;
      }
    } catch (error) {
      const message = mapPasswordUpdateError(error);
      setAccessSectionError(message);
      if (message.includes("Текущий пароль")) {
        setFieldErrors((prev) => ({ ...prev, currentPassword: message }));
      } else if (message.includes("короче 8")) {
        setFieldErrors((prev) => ({ ...prev, nextPassword: message }));
      } else {
        setFieldErrors((prev) => ({ ...prev, nextPassword: message }));
      }
      setSavingAll(false);
      return;
    }

    setSnapshot({
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      phone: normalizedPhoneValue,
      birthDate: birthDate || "",
      email: nextSnapshotEmail
    });
    syncSettingsRuntimeCache({
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      phone: normalizedPhoneValue,
      birthDate: birthDate || "",
      email: nextSnapshotEmail,
      pendingEmailAwaitingConfirm: nextPendingEmail
    });
    if (hasAppliedChanges) {
      setSaveMessage("Изменения сохранены");
    } else if (hasEmailPendingConfirmation) {
      setSaveMessage("");
    }
    setSavingAll(false);
  }

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Можно загрузить только изображение");
      return;
    }

    const maxSizeMb = 5;
    if (file.size > maxSizeMb * 1024 * 1024) {
      setAvatarError(`Размер файла должен быть меньше ${maxSizeMb} МБ`);
      return;
    }

    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
        reader.readAsDataURL(file);
      });

      setCropSource(dataUrl);
      setCropZoom(AVATAR_ZOOM_DEFAULT);
      setCropPosition({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
      setAvatarError("");
    } catch (error) {
      setAvatarError(mapUiErrorMessage(error instanceof Error ? error.message : "", "Не удалось загрузить аватар"));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleAvatarDelete() {
    setAvatarError("");
    setAvatarMessage("Аватар будет удалён после сохранения");
    setPendingAvatarBlob(null);
    setPendingAvatarDelete(true);
    setAvatarUrl(null);
    setCropSource(null);
    setCropZoom(AVATAR_ZOOM_DEFAULT);
    setCropPosition({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
  }

  async function applyCroppedAvatar() {
    if (!cropSource || !croppedAreaPixels) return;

    setApplyingCrop(true);
    setAvatarError("");
    setAvatarMessage("");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_EXPORT_SIZE;
      canvas.height = AVATAR_EXPORT_SIZE;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Не удалось подготовить изображение");

      const image = await loadImageFromDataUrl(cropSource);
      const sourceX = Math.max(0, Math.round(croppedAreaPixels.x));
      const sourceY = Math.max(0, Math.round(croppedAreaPixels.y));
      const sourceWidth = Math.max(1, Math.round(croppedAreaPixels.width));
      const sourceHeight = Math.max(1, Math.round(croppedAreaPixels.height));

      context.clearRect(0, 0, AVATAR_EXPORT_SIZE, AVATAR_EXPORT_SIZE);
      context.save();
      context.beginPath();
      context.arc(AVATAR_EXPORT_SIZE / 2, AVATAR_EXPORT_SIZE / 2, AVATAR_EXPORT_SIZE / 2, 0, Math.PI * 2);
      context.closePath();
      context.clip();
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, AVATAR_EXPORT_SIZE, AVATAR_EXPORT_SIZE);
      context.restore();

      const dataUrl = canvas.toDataURL("image/png");
      const blob = dataUrlToBlob(dataUrl);
      setPendingAvatarBlob(blob);
      setPendingAvatarDelete(false);
      setAvatarUrl(dataUrl);
      setAvatarMessage("Новый аватар будет сохранён после нажатия «Сохранить изменения»");
      setCropSource(null);
      setCropZoom(AVATAR_ZOOM_DEFAULT);
      setCropPosition({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
    } catch (error) {
      setAvatarError(mapUiErrorMessage(error instanceof Error ? error.message : "", "Не удалось применить кадрирование"));
    } finally {
      setApplyingCrop(false);
    }
  }


  if (loading) {
    return <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">Загрузка настроек...</div>;
  }

  const profileSection = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-4 rounded-xl border border-border p-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback className={cn("p-0 text-lg font-semibold", avatarUrl ? "bg-slate-100 text-transparent" : "")}>
            {avatarUrl ? "" : avatarFallback}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Аватар профиля</p>
          <div className="flex flex-wrap gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            <Button data-testid="settings-avatar-upload" type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar || savingAll}>
              {uploadingAvatar ? "Загрузка..." : "Загрузить"}
            </Button>
            <Button data-testid="settings-avatar-delete" type="button" variant="outline" onClick={handleAvatarDelete} disabled={uploadingAvatar || savingAll || (!avatarUrl && !pendingAvatarBlob)}>
              Удалить
            </Button>
          </div>
          {avatarError ? <p className="text-sm text-red-500">{avatarError}</p> : null}
          {avatarMessage ? <p className="text-sm text-emerald-600">{avatarMessage}</p> : null}
        </div>
      </div>

      {cropSource ? (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <p className="text-sm font-medium text-foreground">Подберите позицию аватара</p>
          <div className="relative overflow-hidden rounded-full border border-border bg-[#f3f4f6]" style={{ width: AVATAR_CROP_SIZE, height: AVATAR_CROP_SIZE }}>
            <Cropper
              image={cropSource}
              crop={cropPosition}
              zoom={cropZoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              objectFit="cover"
              restrictPosition={false}
              minZoom={AVATAR_ZOOM_MIN}
              maxZoom={AVATAR_ZOOM_MAX}
              onCropChange={setCropPosition}
              onZoomChange={setCropZoom}
              onCropComplete={(_croppedArea, pixels) => setCroppedAreaPixels(pixels)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Масштаб</label>
            <div className="mt-1 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCropZoom((prev) => Math.max(AVATAR_ZOOM_MIN, Number((prev - AVATAR_ZOOM_STEP).toFixed(2))));
                }}
                disabled={applyingCrop || uploadingAvatar}
              >
                −
              </Button>
              <span className="w-20 text-center text-sm text-muted-foreground">{Math.round(cropZoom * 100)}%</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCropZoom((prev) => Math.min(AVATAR_ZOOM_MAX, Number((prev + AVATAR_ZOOM_STEP).toFixed(2))));
                }}
                disabled={applyingCrop || uploadingAvatar}
              >
                +
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button data-testid="settings-avatar-apply" type="button" onClick={() => void applyCroppedAvatar()} disabled={applyingCrop || uploadingAvatar}>
              {applyingCrop || uploadingAvatar ? "Сохранение..." : "Применить"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCropSource(null);
                setCropZoom(AVATAR_ZOOM_DEFAULT);
                setCropPosition({ x: 0, y: 0 });
                setCroppedAreaPixels(null);
              }}
              disabled={applyingCrop || uploadingAvatar}
            >
              Отмена
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-4 rounded-xl border border-border p-4">
        <div className="grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
          <div className="max-w-md space-y-1">
            <label className="text-sm text-muted-foreground">Имя</label>
            <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} className={cn(fieldErrors.firstName && "border-red-500")} />
            {fieldErrors.firstName ? <p className="text-xs text-red-500">{fieldErrors.firstName}</p> : null}
          </div>
          <div className="max-w-md space-y-1">
            <label className="text-sm text-muted-foreground">Фамилия</label>
            <Input value={lastName} onChange={(event) => setLastName(event.target.value)} className={cn(fieldErrors.lastName && "border-red-500")} />
            {fieldErrors.lastName ? <p className="text-xs text-red-500">{fieldErrors.lastName}</p> : null}
          </div>
          <div className="max-w-md space-y-1">
            <label className="text-sm text-muted-foreground">Дата рождения</label>
            <DateField
              value={birthDate}
              onChange={setBirthDate}
              placeholder="Выберите дату"
              startMonth={minBirthDate}
              endMonth={today}
              className={cn(fieldErrors.birthDate && "[&>button]:border-red-500")}
            />
            {fieldErrors.birthDate ? <p className="text-xs text-red-500">{fieldErrors.birthDate}</p> : null}
          </div>
          <div className="max-w-md space-y-1">
            <label className="text-sm text-muted-foreground">Телефон</label>
            <Input
              data-testid="settings-phone-input"
              value={phone}
              onChange={(event) => setPhone(normalizeRuPhoneInput(event.target.value))}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && event.currentTarget.selectionStart === event.currentTarget.selectionEnd) {
                  event.preventDefault();
                  setPhone(backspaceRuPhone(phone));
                  return;
                }
              }}
              placeholder="+7 (999) 999 99 99"
              className={cn(fieldErrors.phone && "border-red-500")}
            />
            {fieldErrors.phone ? <p className="text-xs text-red-500">{fieldErrors.phone}</p> : null}
          </div>
        </div>

        {profileSectionError ? <p className="text-sm text-red-500">{profileSectionError}</p> : null}
      </div>
    </div>
  );

  const emailSection = (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <h3 className="text-base font-semibold">Сменить email</h3>
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Новый email</label>
        <Input
          data-testid="settings-email-input"
          type="email"
          value={newEmail}
          onChange={(event) => setNewEmail(event.target.value)}
          className={cn(fieldErrors.email && "border-red-500")}
        />
        {fieldErrors.email ? <p className="text-xs text-red-500">{fieldErrors.email}</p> : null}
        {pendingEmailAwaitingConfirm ? (
          <p className="text-xs text-amber-600">Ожидает подтверждения: {pendingEmailAwaitingConfirm}</p>
        ) : null}
      </div>
    </div>
  );

  const passwordSection = (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <h3 className="text-base font-semibold">Сменить пароль</h3>
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Текущий пароль</label>
        <Input
          data-testid="settings-current-password-input"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className={cn(fieldErrors.currentPassword && "border-red-500")}
        />
        {fieldErrors.currentPassword ? <p className="text-xs text-red-500">{fieldErrors.currentPassword}</p> : null}
      </div>
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Новый пароль</label>
        <Input
          data-testid="settings-next-password-input"
          type="password"
          value={nextPassword}
          onChange={(event) => setNextPassword(event.target.value)}
          className={cn(fieldErrors.nextPassword && "border-red-500")}
        />
        {fieldErrors.nextPassword ? <p className="text-xs text-red-500">{fieldErrors.nextPassword}</p> : null}
      </div>
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Подтверждение нового пароля</label>
        <Input
          data-testid="settings-confirm-password-input"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className={cn(fieldErrors.confirmPassword && "border-red-500")}
        />
        {fieldErrors.confirmPassword ? <p className="text-xs text-red-500">{fieldErrors.confirmPassword}</p> : null}
      </div>
      {accessSectionError ? <p className="text-sm text-red-500">{accessSectionError}</p> : null}
    </div>
  );

  const saveButton = (
    <Button data-testid="settings-save-button" type="submit" disabled={savingAll}>
      {savingAll ? "Сохранение..." : "Сохранить изменения"}
    </Button>
  );

  const saveSection = (
    <div className="mt-2 space-y-2">
      {loadError ? <p className="text-sm text-red-500">{loadError}</p> : null}
      {saveMessage ? <p className="text-sm text-emerald-600">{saveMessage}</p> : null}
      {saveButton}
    </div>
  );

  return (
    <div className="w-full">
      <Card className="w-full rounded-2xl border-border bg-card">
        <CardHeader>
          <CardTitle className="text-2xl">Профиль</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveAll} className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="space-y-4">
                {profileSection}
                {emailSection}
              </section>
              <section className="flex h-full flex-col space-y-4">
                {passwordSection}
                <div className="mt-auto hidden xl:block">
                  <div className="space-y-2 pt-4">
                    {loadError ? <p className="text-right text-sm text-red-500">{loadError}</p> : null}
                    {saveMessage ? <p className="text-right text-sm text-emerald-600">{saveMessage}</p> : null}
                    <div className="flex justify-end">{saveButton}</div>
                  </div>
                </div>
              </section>
            </div>

            <div className="xl:hidden">{saveSection}</div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
