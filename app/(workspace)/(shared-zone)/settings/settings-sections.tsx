"use client";

import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

import {
  AVATAR_CROP_SIZE,
  AVATAR_ZOOM_MAX,
  AVATAR_ZOOM_MIN,
  AVATAR_ZOOM_STEP
} from "@/app/(workspace)/(shared-zone)/settings/use-avatar-editor-state";
import type { useSettingsFormState } from "@/app/(workspace)/(shared-zone)/settings/use-settings-form-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { normalizeRuPhoneInput } from "@/lib/phone";
import { cn } from "@/lib/utils";

type SettingsFormState = ReturnType<typeof useSettingsFormState>;

export function SettingsProfileSection(props: SettingsFormState) {
  const {
    avatarError,
    avatarFallback,
    avatarMessage,
    avatarUrl,
    birthDate,
    displayName,
    fieldErrors,
    fileInputRef,
    firstName,
    handleAvatarDelete,
    handleAvatarUpload,
    handlePhoneInputKeyDown,
    lastName,
    minBirthDate,
    pendingAvatarBlob,
    phone,
    profileSectionError,
    savingAll,
    setBirthDate,
    setFirstName,
    setLastName,
    setPhone,
    today,
    uploadingAvatar
  } = props;

  return (
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
            <Button
              data-testid="settings-avatar-delete"
              type="button"
              variant="outline"
              onClick={handleAvatarDelete}
              disabled={uploadingAvatar || savingAll || (!avatarUrl && !pendingAvatarBlob)}
            >
              Удалить
            </Button>
          </div>
          {avatarError ? <p className="text-sm text-red-500">{avatarError}</p> : null}
          {avatarMessage ? <p className="text-sm text-emerald-600">{avatarMessage}</p> : null}
        </div>
      </div>

      <SettingsAvatarCropPanel {...props} />

      <div className="space-y-4 rounded-xl border border-border p-4">
        <div className="grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
          <FormField className="max-w-md" label="Имя" error={fieldErrors.firstName}>
            <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} className={cn(fieldErrors.firstName && "border-red-500")} />
          </FormField>
          <FormField className="max-w-md" label="Фамилия" error={fieldErrors.lastName}>
            <Input value={lastName} onChange={(event) => setLastName(event.target.value)} className={cn(fieldErrors.lastName && "border-red-500")} />
          </FormField>
          <FormField className="max-w-md" label="Дата рождения" error={fieldErrors.birthDate}>
            <DateField
              value={birthDate}
              onChange={setBirthDate}
              placeholder="Выберите дату"
              startMonth={minBirthDate}
              endMonth={today}
              className={cn(fieldErrors.birthDate && "[&>button]:border-red-500")}
            />
          </FormField>
          <FormField className="max-w-md" label="Телефон" error={fieldErrors.phone}>
            <Input
              data-testid="settings-phone-input"
              value={phone}
              onChange={(event) => setPhone(normalizeRuPhoneInput(event.target.value))}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && handlePhoneInputKeyDown(event.currentTarget.selectionStart, event.currentTarget.selectionEnd)) {
                  event.preventDefault();
                  return;
                }
              }}
              placeholder="+7 (999) 999 99 99"
              className={cn(fieldErrors.phone && "border-red-500")}
            />
          </FormField>
        </div>

        {profileSectionError ? <p className="text-sm text-red-500">{profileSectionError}</p> : null}
      </div>
    </div>
  );
}

export function SettingsAvatarCropPanel(props: SettingsFormState) {
  const {
    applyingCrop,
    applyCroppedAvatar,
    cropPosition,
    cropSource,
    cropZoom,
    resetCrop,
    setCropPosition,
    setCropZoom,
    setCroppedAreaPixels,
    uploadingAvatar
  } = props;

  if (!cropSource) return null;

  return (
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
          classes={{
            mediaClassName: "max-w-none max-h-none"
          }}
          style={{
            mediaStyle: {
              maxWidth: "none",
              maxHeight: "none"
            }
          }}
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
        <Button type="button" variant="outline" onClick={resetCrop} disabled={applyingCrop || uploadingAvatar}>
          Отмена
        </Button>
      </div>
    </div>
  );
}

export function SettingsEmailSection(props: SettingsFormState) {
  const { fieldErrors, newEmail, pendingEmailAwaitingConfirm, setNewEmail } = props;

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <h3 className="text-base font-semibold">Сменить email</h3>
      <FormField
        label="Новый email"
        error={fieldErrors.email}
        hint={pendingEmailAwaitingConfirm ? `Ожидает подтверждения: ${pendingEmailAwaitingConfirm}` : undefined}
      >
        <Input
          data-testid="settings-email-input"
          type="email"
          value={newEmail}
          onChange={(event) => setNewEmail(event.target.value)}
          className={cn(fieldErrors.email && "border-red-500")}
        />
      </FormField>
    </div>
  );
}

export function SettingsPasswordSection(props: SettingsFormState) {
  const {
    accessSectionError,
    confirmPassword,
    currentPassword,
    fieldErrors,
    nextPassword,
    setConfirmPassword,
    setCurrentPassword,
    setNextPassword
  } = props;

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <h3 className="text-base font-semibold">Сменить пароль</h3>
      <FormField label="Текущий пароль" error={fieldErrors.currentPassword}>
        <Input
          data-testid="settings-current-password-input"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className={cn(fieldErrors.currentPassword && "border-red-500")}
        />
      </FormField>
      <FormField label="Новый пароль" error={fieldErrors.nextPassword}>
        <Input
          data-testid="settings-next-password-input"
          type="password"
          value={nextPassword}
          onChange={(event) => setNextPassword(event.target.value)}
          className={cn(fieldErrors.nextPassword && "border-red-500")}
        />
      </FormField>
      <FormField label="Подтверждение нового пароля" error={fieldErrors.confirmPassword}>
        <Input
          data-testid="settings-confirm-password-input"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className={cn(fieldErrors.confirmPassword && "border-red-500")}
        />
      </FormField>
      {accessSectionError ? <p className="text-sm text-red-500">{accessSectionError}</p> : null}
    </div>
  );
}

export function SettingsSaveSection({ align = "left", ...props }: { align?: "left" | "right" } & SettingsFormState) {
  const { loadError, saveMessage, savingAll } = props;

  return (
    <div className="space-y-2">
      {loadError ? <p className={cn("text-sm text-red-500", align === "right" && "text-right")}>{loadError}</p> : null}
      {saveMessage ? <p className={cn("text-sm text-emerald-600", align === "right" && "text-right")}>{saveMessage}</p> : null}
      <div className={cn(align === "right" && "flex justify-end")}>
        <Button data-testid="settings-save-button" type="submit" disabled={savingAll}>
          {savingAll ? "Сохранение..." : "Сохранить изменения"}
        </Button>
      </div>
    </div>
  );
}
