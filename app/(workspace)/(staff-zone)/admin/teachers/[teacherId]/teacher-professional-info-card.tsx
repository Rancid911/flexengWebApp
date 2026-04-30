"use client";

import { useState } from "react";
import { BookOpenCheck } from "lucide-react";

import { ApiRequestError, fetchJson } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.utils";
import {
  DEFAULT_TEACHER_CERTIFICATES,
  teacherCertificateOptions,
  teacherEducationLevelOptions,
  teacherEnglishProficiencyOptions,
  teacherSpecializationOptions,
  teacherTargetAudienceOptions,
  type TeacherCertificate,
  type TeacherEducationLevel,
  type TeacherEnglishProficiency,
  type TeacherSpecialization,
  type TeacherTargetAudience
} from "@/lib/admin/teacher-dossier-options";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { TeacherDossierActionMenu } from "./teacher-dossier-action-menu";

const SCHEMA_PENDING_MESSAGE = "Сохранение будет доступно после расширения базы данных";

export type TeacherProfessionalInfoDto = {
  teacherId: string;
  englishProficiency: TeacherEnglishProficiency | "";
  specializations: TeacherSpecialization[];
  teachingExperienceYears: number | null;
  educationLevel: TeacherEducationLevel | "";
  certificates: TeacherCertificate[];
  targetAudiences: TeacherTargetAudience[];
  certificateOther: string;
  teacherBio: string;
};

type TeacherProfessionalInfoFieldKey =
  | "englishProficiency"
  | "specializations"
  | "teachingExperienceYears"
  | "educationLevel"
  | "certificates"
  | "targetAudiences"
  | "certificateOther"
  | "teacherBio";

function toFormState(value: TeacherProfessionalInfoDto): TeacherProfessionalInfoDto {
  return {
    ...value,
    certificates: value.certificates.length ? value.certificates : [...DEFAULT_TEACHER_CERTIFICATES],
    certificateOther: value.certificateOther ?? "",
    teacherBio: value.teacherBio ?? ""
  };
}

function ProfessionalInfoField({
  label,
  children,
  error,
  className
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</span>
      {children}
      {error ? <span className="block text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function getMultiSelectLabel<TValue extends string>(options: readonly { value: TValue; label: string }[], value: TValue[]) {
  const labels = options.filter((option) => value.includes(option.value)).map((option) => option.label);
  return labels.length ? labels.join(", ") : "Не выбрано";
}

function MultiSelectDropdown<TValue extends string>({
  label,
  options,
  value,
  disabled,
  onChange
}: {
  label: string;
  options: readonly { value: TValue; label: string }[];
  value: TValue[];
  disabled: boolean;
  onChange: (nextValue: TValue) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-xl border border-[#dfe9fb] bg-[#fbfdff] px-3 py-2 text-left text-sm font-normal text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7aff]",
            disabled && "cursor-default opacity-100"
          )}
        >
          <span className="truncate">{getMultiSelectLabel(options, value)}</span>
          <span className="ml-2 text-xs text-slate-400" aria-hidden="true">
            ▾
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] border-[#dfe9fb] bg-white p-2 text-slate-900 shadow-lg">
        <div className="space-y-1">
          {options.map((option) => (
            <label key={option.value} className="flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm font-normal text-slate-900 hover:bg-[#eef5ff]">
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={() => onChange(option.value)}
                className="h-4 w-4 rounded border-slate-300 text-[#1f7aff] focus:ring-[#1f7aff]"
              />
              {option.label}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function TeacherProfessionalInfoCard({ initialData }: { initialData: TeacherProfessionalInfoDto }) {
  const [data, setData] = useState(() => toFormState(initialData));
  const [form, setForm] = useState(() => toFormState(initialData));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<TeacherProfessionalInfoFieldKey, string>>>({});

  const updateForm = <K extends TeacherProfessionalInfoFieldKey>(key: K, value: TeacherProfessionalInfoDto[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleSpecialization = (value: TeacherSpecialization) => {
    if (!editing || saving) return;
    const nextValue = form.specializations.includes(value)
      ? form.specializations.filter((item) => item !== value)
      : [...form.specializations, value];
    updateForm("specializations", nextValue);
  };

  const toggleCertificate = (value: TeacherCertificate) => {
    if (!editing || saving) return;
    let nextValue: TeacherCertificate[];
    if (value === "none") {
      nextValue = ["none"];
    } else {
      const withoutNone = form.certificates.filter((item) => item !== "none");
      nextValue = withoutNone.includes(value) ? withoutNone.filter((item) => item !== value) : [...withoutNone, value];
      if (!nextValue.length) {
        nextValue = ["none"];
      }
    }
    updateForm("certificates", nextValue);
    if (!nextValue.includes("other")) {
      updateForm("certificateOther", "");
    }
  };

  const toggleTargetAudience = (value: TeacherTargetAudience) => {
    if (!editing || saving) return;
    const nextValue = form.targetAudiences.includes(value)
      ? form.targetAudiences.filter((item) => item !== value)
      : [...form.targetAudiences, value];
    updateForm("targetAudiences", nextValue);
  };

  const cancelEditing = () => {
    setForm(toFormState(data));
    setFieldErrors({});
    setFormError("");
    setEditing(false);
  };

  const saveProfessionalInfo = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});
    setSaving(true);

    try {
      const savedData = await fetchJson<TeacherProfessionalInfoDto>(`/api/admin/teachers/${data.teacherId}/dossier/professional-info`, {
        method: "PATCH",
        body: JSON.stringify({
          english_proficiency: form.englishProficiency || null,
          specializations: form.specializations,
          teaching_experience_years: form.teachingExperienceYears,
          education_level: form.educationLevel || null,
          certificates: form.certificates.length ? form.certificates : DEFAULT_TEACHER_CERTIFICATES,
          target_audiences: form.targetAudiences,
          certificate_other: form.certificateOther.trim() || null,
          teacher_bio: form.teacherBio.trim() || null
        })
      });
      setData(toFormState(savedData));
      setForm(toFormState(savedData));
      setEditing(false);
    } catch (error) {
      if (error instanceof ApiRequestError && error.details?.fieldErrors) {
        const nextFieldErrors: Partial<Record<TeacherProfessionalInfoFieldKey, string>> = {};
        const fieldMap: Partial<Record<string, TeacherProfessionalInfoFieldKey>> = {
          english_proficiency: "englishProficiency",
          specializations: "specializations",
          teaching_experience_years: "teachingExperienceYears",
          education_level: "educationLevel",
          certificates: "certificates",
          target_audiences: "targetAudiences",
          certificate_other: "certificateOther",
          teacher_bio: "teacherBio"
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
      setFormError(error instanceof ApiRequestError && error.code === "TEACHER_DOSSIER_SCHEMA_PENDING" ? SCHEMA_PENDING_MESSAGE : error instanceof Error ? error.message : "Не удалось сохранить профессиональные данные");
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
              <BookOpenCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">Профессиональные данные</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Квалификация, специализации, опыт и публичное описание преподавателя.</p>
            </div>
          </div>
          {!editing ? <TeacherDossierActionMenu onEdit={() => setEditing(true)} /> : null}
        </div>

        <form className="space-y-4" onSubmit={saveProfessionalInfo}>
          <div data-testid="teacher-professional-fields-grid" className="grid gap-4 md:grid-cols-3">
            <ProfessionalInfoField label="Уровень английского" error={fieldErrors.englishProficiency}>
              <Select
                value={form.englishProficiency}
                onChange={(event) => updateForm("englishProficiency", event.target.value as TeacherEnglishProficiency | "")}
                disabled={!editing || saving}
                className={cn(fieldClassName, fieldErrors.englishProficiency && "border-red-500")}
              >
                <option value="">Не указан</option>
                {teacherEnglishProficiencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </ProfessionalInfoField>
            <ProfessionalInfoField label="Опыт преподавания" error={fieldErrors.teachingExperienceYears}>
              <Input
                value={form.teachingExperienceYears ?? ""}
                onChange={(event) => updateForm("teachingExperienceYears", event.target.value === "" ? null : Number(event.target.value))}
                disabled={!editing || saving}
                type="number"
                min={0}
                max={60}
                className={cn(fieldClassName, fieldErrors.teachingExperienceYears && "border-red-500")}
              />
            </ProfessionalInfoField>
            <ProfessionalInfoField label="Образование" error={fieldErrors.educationLevel}>
              <Select
                value={form.educationLevel}
                onChange={(event) => updateForm("educationLevel", event.target.value as TeacherEducationLevel | "")}
                disabled={!editing || saving}
                className={cn(fieldClassName, fieldErrors.educationLevel && "border-red-500")}
              >
                <option value="">Не указано</option>
                {teacherEducationLevelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </ProfessionalInfoField>
            <ProfessionalInfoField label="Специализации" error={fieldErrors.specializations}>
              <MultiSelectDropdown
                label="Специализации"
                options={teacherSpecializationOptions}
                value={form.specializations}
                disabled={!editing || saving}
                onChange={toggleSpecialization}
              />
            </ProfessionalInfoField>
            <ProfessionalInfoField label="Сертификаты" error={fieldErrors.certificates}>
              <MultiSelectDropdown
                label="Сертификаты"
                options={teacherCertificateOptions}
                value={form.certificates}
                disabled={!editing || saving}
                onChange={toggleCertificate}
              />
            </ProfessionalInfoField>
            <ProfessionalInfoField label="Целевая аудитория" error={fieldErrors.targetAudiences}>
              <MultiSelectDropdown
                label="Целевая аудитория"
                options={teacherTargetAudienceOptions}
                value={form.targetAudiences}
                disabled={!editing || saving}
                onChange={toggleTargetAudience}
              />
            </ProfessionalInfoField>
            {form.certificates.includes("other") ? (
              <ProfessionalInfoField label="Другой сертификат" error={fieldErrors.certificateOther}>
                <Input
                  value={form.certificateOther}
                  onChange={(event) => updateForm("certificateOther", event.target.value)}
                  disabled={!editing || saving}
                  placeholder="Название сертификата"
                  className={cn(fieldClassName, fieldErrors.certificateOther && "border-red-500")}
                />
              </ProfessionalInfoField>
            ) : null}
          </div>

          <div data-testid="teacher-bio-field" className="w-full lg:w-1/2">
            <ProfessionalInfoField label="Краткая биография" error={fieldErrors.teacherBio}>
              <Textarea
                value={form.teacherBio}
                onChange={(event) => updateForm("teacherBio", event.target.value)}
                disabled={!editing || saving}
                rows={5}
                placeholder="Будет заполнено"
                className={cn(fieldClassName, "min-h-28", fieldErrors.teacherBio && "border-red-500")}
              />
            </ProfessionalInfoField>
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
