"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthApiError, changePassword } from "@/features/auth/client/auth-api";
import {
  readSettingsRuntimeSnapshot,
  SETTINGS_RUNTIME_KEY,
  type SettingsRuntimeSnapshot,
  type SettingsSnapshot,
  useSettingsCacheSync
} from "@/features/settings/client/use-settings-runtime-state";
import {
  normalizeAvatarImage,
  useAvatarEditorState
} from "@/features/settings/client/use-avatar-editor-state";
import {
  composeDisplayName,
  getSettingsDirtyState,
  getSettingsErrorSections,
  initialsFromName,
  mapPasswordUpdateError,
  validateSettingsForm
} from "@/features/settings/client/settings-form-helpers";
import { useAsyncAction } from "@/hooks/use-async-action";
import { backspaceRuPhone, normalizeRuPhoneInput, toRuPhoneStorage } from "@/lib/phone";
import { ApiRequestError, fetchJson } from "@/shared/client/api-client";
import { writeRuntimeCache } from "@/lib/session-runtime-cache";
import type { SettingsProfileDto, SettingsProfileUpdateResult } from "@/lib/settings/profile.types";
import { mapUiErrorMessage } from "@/lib/ui-error-map";

async function invalidateRequestContextCache() {
  await fetch("/api/request-context/invalidate", {
    method: "POST"
  });
}

export async function saveSettingsProfile(formData: FormData) {
  const response = await fetch("/api/settings/profile", {
    method: "PATCH",
    body: formData
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { code?: string; message?: string; details?: ApiRequestError["details"] } | null;
    throw new ApiRequestError({
      message: payload?.message ?? `Не удалось выполнить запрос (код ${response.status}).`,
      status: response.status,
      code: payload?.code,
      details: payload?.details
    });
  }

  return (await response.json()) as SettingsProfileUpdateResult;
}

export function useSettingsFormState() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const settingsLoadStartedRef = useRef(false);
  const runtimeSnapshot = readSettingsRuntimeSnapshot();
  const hasRuntimeSnapshot = Boolean(runtimeSnapshot);

  const [userId, setUserId] = useState(runtimeSnapshot?.userId ?? "");
  const [profileEmail, setProfileEmail] = useState(runtimeSnapshot?.email ?? "");
  const [firstName, setFirstName] = useState(runtimeSnapshot?.firstName ?? "");
  const [lastName, setLastName] = useState(runtimeSnapshot?.lastName ?? "");
  const [phone, setPhone] = useState(runtimeSnapshot?.phone ? normalizeRuPhoneInput(runtimeSnapshot.phone) : "+7 ");
  const [birthDate, setBirthDate] = useState(runtimeSnapshot?.birthDate ?? "");
  const [newEmail, setNewEmail] = useState(runtimeSnapshot?.email ?? "");
  const [pendingEmailAwaitingConfirm, setPendingEmailAwaitingConfirm] = useState(runtimeSnapshot?.pendingEmailAwaitingConfirm ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(!runtimeSnapshot);
  const [saveMessage, setSaveMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [profileSectionError, setProfileSectionError] = useState("");
  const [accessSectionError, setAccessSectionError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ReturnType<typeof validateSettingsForm>["fieldErrors"]>({});
  const [snapshot, setSnapshot] = useState<SettingsSnapshot>({
    firstName: runtimeSnapshot?.firstName ?? "",
    lastName: runtimeSnapshot?.lastName ?? "",
    phone: runtimeSnapshot?.phone ?? "",
    birthDate: runtimeSnapshot?.birthDate ?? "",
    email: runtimeSnapshot?.email ?? ""
  });
  const today = useMemo(() => new Date(), []);
  const minBirthDate = useMemo(() => new Date(1930, 0), []);
  const { pending: savingAll, run: runSaveAll } = useAsyncAction();
  const { pending: uploadingAvatar, run: runAvatarUpload } = useAsyncAction();
  const { run: runSettingsLoad } = useAsyncAction();

  const displayName = useMemo(() => composeDisplayName(firstName, lastName, profileEmail), [firstName, lastName, profileEmail]);
  const avatarFallback = useMemo(() => initialsFromName(displayName, profileEmail), [displayName, profileEmail]);
  const {
    avatarUrl,
    avatarMessage,
    avatarError,
    cropSource,
    cropZoom,
    cropPosition,
    applyingCrop,
    pendingAvatarBlob,
    pendingAvatarDelete,
    setAvatarUrl,
    setAvatarMessage,
    setAvatarError,
    setCropZoom,
    setCropPosition,
    setCroppedAreaPixels,
    setPendingAvatarBlob,
    setPendingAvatarDelete,
    startAvatarCrop,
    resetCrop,
    handleAvatarDelete,
    applyCroppedAvatar
  } = useAvatarEditorState(runtimeSnapshot?.avatarUrl ?? null);
  const { syncProfileCache, syncSettingsRuntimeCache } = useSettingsCacheSync({
    userId,
    displayName,
    profileEmail,
    avatarUrl,
    firstName,
    lastName,
    phone: toRuPhoneStorage(phone) ?? "",
    birthDate,
    pendingEmailAwaitingConfirm
  });

  useEffect(() => {
    if (settingsLoadStartedRef.current) return;
    settingsLoadStartedRef.current = true;

    void runSettingsLoad({
      onStart: () => {
        if (!hasRuntimeSnapshot) {
          setLoading(true);
        }
      },
      onError: (error) => {
        if (error instanceof ApiRequestError && error.status === 401) {
          router.replace("/login");
          setLoading(false);
          return;
        }
        const message = mapUiErrorMessage(error instanceof Error ? error.message : "", "Не удалось загрузить настройки");
        setLoadError(message);
        setLoading(false);
      },
      action: async () => {
        const result = await fetchJson<SettingsProfileDto>("/api/settings/profile");
        if (!result.userId) {
          router.replace("/login");
          return null;
        }

        return result;
      },
      onSuccess: (result) => {
        if (!result) {
          setLoading(false);
          return;
        }

        setUserId(result.userId);
        setProfileEmail(result.email);
        setNewEmail(result.pendingEmail || result.email);
        setPendingEmailAwaitingConfirm(result.pendingEmail);
        if (result.cachedAvatarUrl) {
          setAvatarUrl(result.cachedAvatarUrl);
        }

        setFirstName(result.profile.firstName);
        setLastName(result.profile.lastName);
        setPhone(result.profile.phone ? normalizeRuPhoneInput(result.profile.phone) : "+7 ");
        setAvatarUrl(result.profile.avatarUrl ?? result.cachedAvatarUrl ?? null);
        setBirthDate(result.resolvedBirthDate);

        setLoadError("");
        setProfileSectionError("");
        setAccessSectionError("");
        setFieldErrors({});
        setSaveMessage("");
        setAvatarMessage("");
        setAvatarError("");
        setPendingAvatarBlob(null);
        setPendingAvatarDelete(false);
        resetCrop();
        setSnapshot({
          firstName: result.profile.firstName,
          lastName: result.profile.lastName,
          phone: result.profile.phone,
          birthDate: result.resolvedBirthDate,
          email: result.email
        });
        writeRuntimeCache<SettingsRuntimeSnapshot>(SETTINGS_RUNTIME_KEY, {
          userId: result.userId,
          firstName: result.profile.firstName,
          lastName: result.profile.lastName,
          phone: result.profile.phone,
          birthDate: result.resolvedBirthDate,
          email: result.email,
          avatarUrl: result.profile.avatarUrl ?? null,
          pendingEmailAwaitingConfirm: result.pendingEmail
        });
        setLoading(false);
      }
    });
  }, [hasRuntimeSnapshot, resetCrop, router, runSettingsLoad, setAvatarError, setAvatarMessage, setAvatarUrl, setPendingAvatarBlob, setPendingAvatarDelete]);

  async function handleSaveAll(event: FormEvent) {
    event.preventDefault();
    if (!userId) return;

    setSaveMessage("");
    setLoadError("");
    setProfileSectionError("");
    setAccessSectionError("");
    setFieldErrors({});

    const {
      fieldErrors: nextFieldErrors,
      normalizedEmail,
      normalizedPhone,
      passwordRequested,
      trimmedFirstName,
      trimmedLastName
    } = validateSettingsForm({
      confirmPassword,
      currentPassword,
      firstName,
      lastName,
      newEmail,
      nextPassword,
      phone
    });

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      const { hasAccessErrors, hasProfileErrors } = getSettingsErrorSections(nextFieldErrors);
      if (hasProfileErrors) setProfileSectionError("Проверьте поля профиля");
      if (hasAccessErrors) setAccessSectionError("Проверьте поля доступа");
      return;
    }

    const normalizedPhoneValue = normalizedPhone as string;
    const { avatarDirty, emailDirty, passwordDirty, profileDirty } = getSettingsDirtyState({
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
    });

    if (!profileDirty && !emailDirty && !passwordDirty && !avatarDirty) {
      setSaveMessage("Нет изменений");
      return;
    }

    let hasAppliedChanges = false;
    let hasEmailPendingConfirmation = false;
    let nextSnapshotEmail = snapshot.email;
    let nextPendingEmail = pendingEmailAwaitingConfirm;

    await runSaveAll({
      action: async () => {
        const formData = new FormData();
        formData.set("firstName", trimmedFirstName);
        formData.set("lastName", trimmedLastName);
        formData.set("phone", normalizedPhoneValue);
        formData.set("birthDate", birthDate || "");
        formData.set("email", normalizedEmail);
        formData.set("profileDirty", String(profileDirty));
        formData.set("emailDirty", String(emailDirty));
        formData.set("passwordDirty", "false");
        formData.set("avatarDelete", String(Boolean(pendingAvatarDelete)));
        if (pendingAvatarBlob) {
          formData.set("avatarFile", pendingAvatarBlob, "avatar.png");
        }

        const shouldSaveProfile = profileDirty || emailDirty || avatarDirty;
        const result = shouldSaveProfile ? await saveSettingsProfile(formData) : null;
        const nextProfile = result?.profile;

        if (result?.applied.profile) {
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

        if (result?.applied.avatar && nextProfile) {
          setAvatarUrl(nextProfile.profile.avatarUrl);
          setAvatarMessage(result.avatarMessage);
          syncProfileCache({ avatarUrl: nextProfile.profile.avatarUrl });
          syncSettingsRuntimeCache({ avatarUrl: nextProfile.profile.avatarUrl });
          setPendingAvatarBlob(null);
          setPendingAvatarDelete(false);
          hasAppliedChanges = true;
        }

        if (emailDirty && result?.hasEmailPendingConfirmation && nextProfile) {
          const pendingEmail = nextProfile.pendingEmail || normalizedEmail;
          setPendingEmailAwaitingConfirm(pendingEmail);
          setNewEmail(pendingEmail);
          syncSettingsRuntimeCache({ pendingEmailAwaitingConfirm: pendingEmail });
          nextPendingEmail = pendingEmail;
          hasEmailPendingConfirmation = true;
        }

        if (result?.applied.email && nextProfile) {
          setProfileEmail(nextProfile.email);
          setNewEmail(nextProfile.email);
          setPendingEmailAwaitingConfirm("");
          syncProfileCache({ email: nextProfile.email });
          syncSettingsRuntimeCache({ email: nextProfile.email, pendingEmailAwaitingConfirm: "" });
          nextSnapshotEmail = nextProfile.email;
          nextPendingEmail = "";
          hasAppliedChanges = true;
        }

        if (passwordDirty) {
          await changePassword({ currentPassword, nextPassword });
          setCurrentPassword("");
          setNextPassword("");
          setConfirmPassword("");
          hasAppliedChanges = true;
        }

        if (hasAppliedChanges) {
          await invalidateRequestContextCache();
        }

        return true;
      },
      onError: (error) => {
        if (error instanceof AuthApiError) {
          const fieldErrorsFromResponse = error.details?.fieldErrors ?? {};
          const currentPasswordError = fieldErrorsFromResponse.currentPassword?.[0];
          const nextPasswordError = fieldErrorsFromResponse.nextPassword?.[0] || fieldErrorsFromResponse.password?.[0];

          if (currentPasswordError) {
            setFieldErrors((prev) => ({ ...prev, currentPassword: currentPasswordError }));
            setAccessSectionError(currentPasswordError);
            return;
          }
          if (nextPasswordError) {
            setFieldErrors((prev) => ({ ...prev, nextPassword: nextPasswordError }));
            setAccessSectionError(nextPasswordError);
            return;
          }
          if (error.code === "REAUTHENTICATION_REQUIRED" || error.status === 401) {
            setAccessSectionError("Сессия устарела. Войдите заново и повторите попытку.");
            return;
          }
          setAccessSectionError(mapUiErrorMessage(error.message, "Не удалось обновить пароль"));
          return;
        }

        if (error instanceof ApiRequestError) {
          const emailFieldError = error.details?.fieldErrors?.email?.[0];
          const formError = error.details?.formErrors?.[0];
          if (emailFieldError) {
            setFieldErrors((prev) => ({ ...prev, email: emailFieldError }));
            setAccessSectionError(emailFieldError);
            return;
          }
          if (formError) {
            setAccessSectionError(formError);
            return;
          }
        }

        const message = error instanceof Error ? error.message : "";
        if (message.startsWith("avatar:")) {
          setProfileSectionError(mapUiErrorMessage(message.slice("avatar:".length), "Не удалось сохранить аватар"));
          return;
        }
        if (message.startsWith("email:")) {
          const mapped = mapUiErrorMessage(message.slice("email:".length), "Не удалось обновить email");
          setFieldErrors((prev) => ({ ...prev, email: mapped }));
          setAccessSectionError(mapped);
          return;
        }
        if (message.startsWith("password:")) {
          const mapped = mapPasswordUpdateError(new Error(message.slice("password:".length)));
          setAccessSectionError(mapped);
          if (mapped.includes("Текущий пароль")) {
            setFieldErrors((prev) => ({ ...prev, currentPassword: mapped }));
          } else {
            setFieldErrors((prev) => ({ ...prev, nextPassword: mapped }));
          }
          return;
        }
        setProfileSectionError(mapUiErrorMessage(message, "Не удалось сохранить профиль"));
      },
      onSuccess: () => {
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
          setSaveMessage("Письмо подтверждения отправлено на новый email. Перейдите по ссылке из письма.");
        }
      }
    });
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

    await runAvatarUpload({
      onError: (error) => {
        setAvatarError(mapUiErrorMessage(error instanceof Error ? error.message : "", "Не удалось загрузить аватар"));
      },
      action: async () => {
        return await normalizeAvatarImage(file);
      },
      onSuccess: (normalizedImage) => {
        startAvatarCrop(normalizedImage);
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handlePhoneInputKeyDown(selectionStart: number | null, selectionEnd: number | null) {
    if (selectionStart === selectionEnd) {
      setPhone((currentPhone) => backspaceRuPhone(currentPhone));
      return true;
    }

    return false;
  }

  return {
    accessSectionError,
    applyingCrop,
    avatarError,
    avatarFallback,
    avatarMessage,
    avatarUrl,
    birthDate,
    confirmPassword,
    cropPosition,
    cropSource,
    cropZoom,
    currentPassword,
    displayName,
    fieldErrors,
    fileInputRef,
    firstName,
    handleAvatarDelete,
    handleAvatarUpload,
    handlePhoneInputKeyDown,
    handleSaveAll,
    lastName,
    loadError,
    loading,
    minBirthDate,
    newEmail,
    nextPassword,
    pendingAvatarBlob,
    pendingAvatarDelete,
    pendingEmailAwaitingConfirm,
    phone,
    profileSectionError,
    resetCrop,
    saveMessage,
    savingAll,
    setAvatarMessage,
    setBirthDate,
    setConfirmPassword,
    setCropPosition,
    setCropZoom,
    setCroppedAreaPixels,
    setCurrentPassword,
    setFirstName,
    setLastName,
    setNewEmail,
    setNextPassword,
    setPhone,
    setSaveMessage,
    startAvatarCrop,
    today,
    uploadingAvatar,
    applyCroppedAvatar
  };
}
