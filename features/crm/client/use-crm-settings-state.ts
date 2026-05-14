"use client";

import { useRef, useState, type ChangeEvent } from "react";

import { fetchJson } from "@/shared/client/api-client";
import { CRM_BACKGROUND_IMAGE_EVENT } from "@/features/workspace-shell/components/workspace-shell-client";
import type { CrmBackgroundUploadResponse, CrmSettingsDto } from "@/lib/crm/types";

type UseCrmSettingsStateOptions = {
  onBackgroundImageChange?: (url: string | null) => void;
};

export function useCrmSettingsState(initialSettings: CrmSettingsDto, options: UseCrmSettingsStateOptions = {}) {
  const [crmSettings, setCrmSettings] = useState(initialSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDraftUrl, setSettingsDraftUrl] = useState(initialSettings.background_image_url ?? "");
  const [settingsError, setSettingsError] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const backgroundInputRef = useRef<HTMLInputElement | null>(null);

  const backgroundImageUrl = crmSettings.background_image_url;
  const draftBackgroundImageUrl = settingsDraftUrl.trim();
  const hasSettingsChanges = draftBackgroundImageUrl !== (backgroundImageUrl ?? "");

  function openSettings() {
    setSettingsDraftUrl(crmSettings.background_image_url ?? "");
    setSettingsError("");
    setSettingsMessage("");
    setSettingsOpen(true);
  }

  async function handleBackgroundUpload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSettingsError("Выберите файл изображения.");
      input.value = "";
      return;
    }

    const maxSizeMb = 8;
    if (file.size > maxSizeMb * 1024 * 1024) {
      setSettingsError(`Файл должен быть не больше ${maxSizeMb} МБ.`);
      input.value = "";
      return;
    }

    setIsUploadingBackground(true);
    setSettingsError("");
    setSettingsMessage("");

    try {
      const formData = new FormData();
      formData.set("file", file);
      const data = await fetchJson<CrmBackgroundUploadResponse>("/api/crm/settings/background", {
        method: "POST",
        body: formData
      });
      setSettingsDraftUrl(data.publicUrl);
      setSettingsMessage("Фото загружено. Сохраните настройки, чтобы применить фон.");
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : "Не удалось загрузить фото.");
    } finally {
      setIsUploadingBackground(false);
      input.value = "";
    }
  }

  async function saveCrmSettings(nextUrl = draftBackgroundImageUrl) {
    setIsSavingSettings(true);
    setSettingsError("");
    setSettingsMessage("");
    try {
      const nextSettings = await fetchJson<CrmSettingsDto>("/api/crm/settings", {
        method: "PATCH",
        body: JSON.stringify({ background_image_url: nextUrl || null })
      });
      setCrmSettings(nextSettings);
      setSettingsDraftUrl(nextSettings.background_image_url ?? "");
      options.onBackgroundImageChange?.(nextSettings.background_image_url);
      window.dispatchEvent(new CustomEvent(CRM_BACKGROUND_IMAGE_EVENT, { detail: { backgroundImageUrl: nextSettings.background_image_url } }));
      setSettingsMessage(nextSettings.background_image_url ? "Фон CRM сохранён." : "Фон CRM удалён.");
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : "Не удалось сохранить настройки CRM.");
    } finally {
      setIsSavingSettings(false);
    }
  }

  return {
    backgroundImageUrl,
    backgroundInputRef,
    draftBackgroundImageUrl,
    handleBackgroundUpload,
    hasSettingsChanges,
    isSavingSettings,
    isUploadingBackground,
    openSettings,
    saveCrmSettings,
    settingsError,
    settingsMessage,
    settingsOpen,
    setSettingsOpen
  };
}
