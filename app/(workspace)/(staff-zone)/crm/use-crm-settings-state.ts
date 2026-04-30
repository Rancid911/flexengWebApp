"use client";

import { useRef, useState, type ChangeEvent } from "react";

import { fetchJson } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.utils";
import { CRM_BACKGROUND_IMAGE_EVENT } from "@/app/(workspace)/workspace-shell-client";
import type { CrmSettingsDto } from "@/lib/crm/types";
import { createClient } from "@/lib/supabase/client";

const CRM_ASSETS_BUCKET = "crm-assets";

function getUploadedBackgroundPath(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  return `background/crm-board-${Date.now()}.${extension}`;
}

export function useCrmSettingsState(initialSettings: CrmSettingsDto) {
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
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSettingsError("Выберите файл изображения.");
      event.currentTarget.value = "";
      return;
    }

    const maxSizeMb = 8;
    if (file.size > maxSizeMb * 1024 * 1024) {
      setSettingsError(`Файл должен быть не больше ${maxSizeMb} МБ.`);
      event.currentTarget.value = "";
      return;
    }

    setIsUploadingBackground(true);
    setSettingsError("");
    setSettingsMessage("");

    try {
      const supabase = createClient();
      const path = getUploadedBackgroundPath(file);
      const { error: uploadError } = await supabase.storage.from(CRM_ASSETS_BUCKET).upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: true
      });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(CRM_ASSETS_BUCKET).getPublicUrl(path);
      setSettingsDraftUrl(`${data.publicUrl}?v=${Date.now()}`);
      setSettingsMessage("Фото загружено. Сохраните настройки, чтобы применить фон.");
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : "Не удалось загрузить фото.");
    } finally {
      setIsUploadingBackground(false);
      event.currentTarget.value = "";
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
