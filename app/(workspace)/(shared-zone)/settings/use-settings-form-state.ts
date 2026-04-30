"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getPendingEmailFromAuthUser,
  normalizeEmailValue,
  readSettingsRuntimeSnapshot,
  SETTINGS_RUNTIME_KEY,
  type SettingsRuntimeSnapshot,
  type SettingsSnapshot,
  useSettingsCacheSync
} from "@/app/(workspace)/(shared-zone)/settings/use-settings-runtime-state";
import {
  normalizeAvatarImage,
  useAvatarEditorState
} from "@/app/(workspace)/(shared-zone)/settings/use-avatar-editor-state";
import {
  composeDisplayName,
  getSettingsDirtyState,
  getSettingsErrorSections,
  initialsFromName,
  mapPasswordUpdateError,
  validateSettingsForm
} from "@/app/(workspace)/(shared-zone)/settings/settings-form-helpers";
import { useAsyncAction } from "@/hooks/use-async-action";
import { profileCacheKey, readDashboardCache } from "@/lib/dashboard-cache";
import { backspaceRuPhone, normalizeRuPhoneInput, toRuPhoneStorage } from "@/lib/phone";
import { writeRuntimeCache } from "@/lib/session-runtime-cache";
import { runAuthRequestWithLockRetry } from "@/lib/supabase/auth-request";
import { createClient } from "@/lib/supabase/client";
import { mapUiErrorMessage } from "@/lib/ui-error-map";

async function invalidateRequestContextCache() {
  await fetch("/api/request-context/invalidate", {
    method: "POST"
  });
}

export function useSettingsFormState() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
    void runSettingsLoad({
      onStart: () => {
        if (!hasRuntimeSnapshot) {
          setLoading(true);
        }
      },
      onError: (error) => {
        const message = mapUiErrorMessage(error instanceof Error ? error.message : "", "Не удалось загрузить настройки");
        setLoadError(message);
        setLoading(false);
      },
      action: async () => {
        const supabase = createClient();
        const { data: authData, error: authError } = await runAuthRequestWithLockRetry(() => supabase.auth.getUser());
        if (authError) throw authError;

        if (!authData.user) {
          router.replace("/login");
          return null;
        }

        const uid = authData.user.id;
        const email = normalizeEmailValue(authData.user.email ?? "");
        const pendingEmail = getPendingEmailFromAuthUser(authData.user);
        const cachedProfile = readDashboardCache<{ displayName: string; email: string; avatarUrl: string | null }>(profileCacheKey(uid));

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

        const profileEmailValue = normalizeEmailValue(profile?.email ?? "");
        if (email && profileEmailValue !== email) {
          await supabase.from("profiles").update({ email }).eq("id", uid);
        }

        return {
          uid,
          email,
          pendingEmail,
          cachedAvatarUrl: cachedProfile?.avatarUrl ?? null,
          profile,
          resolvedBirthDate
        };
      },
      onSuccess: (result) => {
        if (!result) {
          setLoading(false);
          return;
        }

        setUserId(result.uid);
        setProfileEmail(result.email);
        setNewEmail(result.pendingEmail || result.email);
        setPendingEmailAwaitingConfirm(result.pendingEmail);
        if (result.cachedAvatarUrl) {
          setAvatarUrl(result.cachedAvatarUrl);
        }

        setFirstName(result.profile?.first_name ?? "");
        setLastName(result.profile?.last_name ?? "");
        setPhone(result.profile?.phone ? normalizeRuPhoneInput(result.profile.phone) : "+7 ");
        setAvatarUrl(result.profile?.avatar_url ?? result.cachedAvatarUrl ?? null);
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
          firstName: result.profile?.first_name ?? "",
          lastName: result.profile?.last_name ?? "",
          phone: result.profile?.phone ?? "",
          birthDate: result.resolvedBirthDate,
          email: result.email
        });
        writeRuntimeCache<SettingsRuntimeSnapshot>(SETTINGS_RUNTIME_KEY, {
          userId: result.uid,
          firstName: result.profile?.first_name ?? "",
          lastName: result.profile?.last_name ?? "",
          phone: result.profile?.phone ?? "",
          birthDate: result.resolvedBirthDate,
          email: result.email,
          avatarUrl: result.profile?.avatar_url ?? null,
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
    const supabase = createClient();

    await runSaveAll({
      action: async () => {
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

        if (avatarDirty) {
          const path = `${userId}/avatar`;

          if (pendingAvatarDelete) {
            await supabase.storage.from("avatars").remove([path]);
            const { error: avatarDeleteError } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
            if (avatarDeleteError) throw new Error(`avatar:${avatarDeleteError.message}`);
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
            if (uploadError) throw new Error(`avatar:${uploadError.message}`);

            const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);
            const updatedAvatarUrl = `${publicData.publicUrl}?v=${Date.now()}`;
            const { error: profileAvatarUpdateError } = await supabase.from("profiles").update({ avatar_url: updatedAvatarUrl }).eq("id", userId);
            if (profileAvatarUpdateError) throw new Error(`avatar:${profileAvatarUpdateError.message}`);

            setAvatarUrl(updatedAvatarUrl);
            setAvatarMessage("Аватар обновлён");
            syncProfileCache({ avatarUrl: updatedAvatarUrl });
            syncSettingsRuntimeCache({ avatarUrl: updatedAvatarUrl });
            hasAppliedChanges = true;
          }

          setPendingAvatarBlob(null);
          setPendingAvatarDelete(false);
        }

        if (emailDirty) {
          const { data, error: authUpdateError } = await runAuthRequestWithLockRetry(() => supabase.auth.updateUser({ email: normalizedEmail }));
          if (authUpdateError) throw new Error(`email:${authUpdateError.message}`);
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
            if (profileEmailError) throw new Error(`email:${profileEmailError.message}`);

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

        if (passwordDirty) {
          const { error: verifyError } = await runAuthRequestWithLockRetry(() =>
            supabase.auth.signInWithPassword({
              email: profileEmail,
              password: currentPassword
            })
          );
          if (verifyError) throw new Error(`password:${"Текущий пароль указан неверно"}`);

          const { error: updateError } = await runAuthRequestWithLockRetry(() => supabase.auth.updateUser({ password: nextPassword }));
          if (updateError) throw new Error(`password:${updateError.message}`);

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
          setSaveMessage("");
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
