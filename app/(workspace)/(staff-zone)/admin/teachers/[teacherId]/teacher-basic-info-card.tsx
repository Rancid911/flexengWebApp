"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { ApiRequestError, fetchJson } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.utils";
import {
  DEFAULT_TEACHER_INTERNAL_ROLE,
  DEFAULT_TEACHER_TIMEZONE,
  getTeacherInternalRoleLabel,
  teacherInternalRoleOptions,
  teacherTimezoneOptions,
  type TeacherInternalRole,
  type TeacherTimezone
} from "@/lib/admin/teacher-dossier-options";
import { backspaceRuPhone, isValidRuPhone, normalizeRuPhoneInput, toRuPhoneStorage } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TeacherDossierActionMenu } from "./teacher-dossier-action-menu";

export type TeacherBasicInfoDto = {
  teacherId: string;
  profileId: string;
  firstName: string;
  lastName: string;
  patronymic: string | null;
  email: string;
  phone: string;
  internalRole: TeacherInternalRole;
  internalRoleLabel: string;
  timezone: TeacherTimezone;
};

type TeacherBasicInfoForm = {
  firstName: string;
  lastName: string;
  patronymic: string;
  email: string;
  phone: string;
  internalRole: TeacherInternalRole;
  timezone: TeacherTimezone;
};

type TeacherBasicInfoFieldKey = keyof TeacherBasicInfoForm;

function toFormState(value: TeacherBasicInfoDto): TeacherBasicInfoForm {
  return {
    firstName: value.firstName,
    lastName: value.lastName,
    patronymic: value.patronymic ?? "",
    email: value.email,
    phone: normalizeRuPhoneInput(value.phone),
    internalRole: value.internalRole || DEFAULT_TEACHER_INTERNAL_ROLE,
    timezone: value.timezone || DEFAULT_TEACHER_TIMEZONE
  };
}

function toDtoState(value: TeacherBasicInfoDto, form: TeacherBasicInfoForm, normalizedPhone: string): TeacherBasicInfoDto {
  return {
    ...value,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    patronymic: form.patronymic.trim() || null,
    email: form.email.trim().toLowerCase(),
    phone: normalizedPhone,
    internalRole: form.internalRole,
    internalRoleLabel: getTeacherInternalRoleLabel(form.internalRole),
    timezone: form.timezone
  };
}

function BasicInfoField({
  label,
  children,
  error
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</span>
      {children}
      {error ? <span className="block text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

export function TeacherBasicInfoCard({ initialData }: { initialData: TeacherBasicInfoDto }) {
  const [data, setData] = useState(initialData);
  const [form, setForm] = useState(() => toFormState(initialData));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<TeacherBasicInfoFieldKey, string>>>({});

  const updateForm = <K extends TeacherBasicInfoFieldKey>(key: K, value: TeacherBasicInfoForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const cancelEditing = () => {
    setForm(toFormState(data));
    setFieldErrors({});
    setFormError("");
    setEditing(false);
  };

  const saveBasicInfo = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});

    const normalizedPhone = toRuPhoneStorage(form.phone);
    if (!isValidRuPhone(form.phone) || !normalizedPhone) {
      setFieldErrors({ phone: "Телефон должен быть в формате +7 (999) 999 99 99" });
      return;
    }

    setSaving(true);
    try {
      const saved = await fetchJson<TeacherBasicInfoDto>(`/api/admin/teachers/${data.teacherId}/dossier/basic-info`, {
        method: "PATCH",
        body: JSON.stringify({
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          patronymic: form.patronymic.trim() || null,
          email: form.email.trim(),
          phone: normalizedPhone,
          internal_role: form.internalRole,
          timezone: form.timezone
        })
      });
      const nextData = toDtoState(saved, form, normalizedPhone);
      setData(nextData);
      setForm(toFormState(nextData));
      setEditing(false);
    } catch (error) {
      if (error instanceof ApiRequestError && error.details?.fieldErrors) {
        const nextFieldErrors: Partial<Record<TeacherBasicInfoFieldKey, string>> = {};
        const fieldMap: Partial<Record<string, TeacherBasicInfoFieldKey>> = {
          first_name: "firstName",
          last_name: "lastName",
          patronymic: "patronymic",
          email: "email",
          phone: "phone",
          internal_role: "internalRole",
          timezone: "timezone"
        };
        for (const [apiField, messages] of Object.entries(error.details.fieldErrors)) {
          const fieldKey = fieldMap[apiField];
          const firstMessage = messages[0];
          if (fieldKey && firstMessage) {
            nextFieldErrors[fieldKey] = firstMessage;
          }
        }
        setFieldErrors(nextFieldErrors);
      }
      setFormError(error instanceof Error ? error.message : "Не удалось сохранить базовую информацию");
    } finally {
      setSaving(false);
    }
  };

  const fieldClassName = "border-[#dfe9fb] bg-[#fbfdff] font-normal text-slate-900 disabled:cursor-default disabled:opacity-100";

  return (
    <Card className="rounded-2xl border-[#dfe9fb] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef5ff] text-[#1f7aff]">
              <Pencil className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">Базовая информация</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Основные данные профиля и рабочие поля досье преподавателя.</p>
            </div>
          </div>
          {!editing ? <TeacherDossierActionMenu onEdit={() => setEditing(true)} /> : null}
        </div>

        <form className="space-y-4" onSubmit={saveBasicInfo}>
          <div className="grid gap-4 md:grid-cols-3">
            <BasicInfoField label="Имя" error={fieldErrors.firstName}>
              <Input
                value={form.firstName}
                onChange={(event) => updateForm("firstName", event.target.value)}
                disabled={!editing || saving}
                required
                className={cn(fieldClassName, fieldErrors.firstName && "border-red-500")}
              />
            </BasicInfoField>
            <BasicInfoField label="Фамилия" error={fieldErrors.lastName}>
              <Input
                value={form.lastName}
                onChange={(event) => updateForm("lastName", event.target.value)}
                disabled={!editing || saving}
                required
                className={cn(fieldClassName, fieldErrors.lastName && "border-red-500")}
              />
            </BasicInfoField>
            <BasicInfoField label="Отчество" error={fieldErrors.patronymic}>
              <Input
                value={form.patronymic}
                onChange={(event) => updateForm("patronymic", event.target.value)}
                disabled={!editing || saving}
                placeholder="Не указано"
                className={cn(fieldClassName, fieldErrors.patronymic && "border-red-500")}
              />
            </BasicInfoField>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <BasicInfoField label="E-mail" error={fieldErrors.email}>
              <Input
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
                disabled={!editing || saving}
                type="email"
                required
                className={cn(fieldClassName, fieldErrors.email && "border-red-500")}
              />
            </BasicInfoField>
            <BasicInfoField label="Телефон" error={fieldErrors.phone}>
              <Input
                value={form.phone}
                onChange={(event) => updateForm("phone", normalizeRuPhoneInput(event.target.value))}
                onKeyDown={(event) => {
                  if (!editing || saving) return;
                  if (event.key === "Backspace" && event.currentTarget.selectionStart === event.currentTarget.selectionEnd) {
                    event.preventDefault();
                    updateForm("phone", backspaceRuPhone(form.phone));
                  }
                }}
                disabled={!editing || saving}
                placeholder="+7 (999) 999 99 99"
                required
                className={cn(fieldClassName, fieldErrors.phone && "border-red-500")}
              />
            </BasicInfoField>
            <BasicInfoField label="Внутренняя роль" error={fieldErrors.internalRole}>
              <Select
                value={form.internalRole}
                onChange={(event) => updateForm("internalRole", event.target.value as TeacherInternalRole)}
                disabled={!editing || saving}
                className={cn(fieldClassName, fieldErrors.internalRole && "border-red-500")}
              >
                {teacherInternalRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </BasicInfoField>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <BasicInfoField label="Часовой пояс" error={fieldErrors.timezone}>
              <Select
                value={form.timezone}
                onChange={(event) => updateForm("timezone", event.target.value as TeacherTimezone)}
                disabled={!editing || saving}
                className={cn(fieldClassName, fieldErrors.timezone && "border-red-500")}
              >
                {teacherTimezoneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </BasicInfoField>
          </div>

          {formError ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{formError}</p> : null}

          {editing ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={cancelEditing} disabled={saving} className="h-10 rounded-2xl px-4 font-semibold">
                Отмена
              </Button>
              <Button type="submit" disabled={saving} className="h-10 rounded-2xl bg-[#1f7aff] px-4 font-black text-white hover:bg-[#1669db]">
                {saving ? "Сохраняем..." : "Сохранить"}
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
