"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";

import { ApiRequestError, fetchJson } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.utils";
import {
  teacherTeachingApproachOptions,
  teacherTeachingMaterialOptions,
  type TeacherTeachingApproach,
  type TeacherTeachingMaterial
} from "@/lib/admin/teacher-dossier-options";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { TeacherDossierActionMenu } from "./teacher-dossier-action-menu";

export type TeacherMethodologyStyleDto = {
  teacherId: string;
  teachingApproach: TeacherTeachingApproach | "";
  teachingMaterials: TeacherTeachingMaterial[];
  teachingFeatures: string;
};

type TeacherMethodologyStyleFieldKey = "teachingApproach" | "teachingMaterials" | "teachingFeatures";

function toFormState(value: TeacherMethodologyStyleDto): TeacherMethodologyStyleDto {
  return {
    ...value,
    teachingFeatures: value.teachingFeatures ?? ""
  };
}

function MethodologyStyleField({
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

export function TeacherMethodologyStyleCard({ initialData }: { initialData: TeacherMethodologyStyleDto }) {
  const [data, setData] = useState(() => toFormState(initialData));
  const [form, setForm] = useState(() => toFormState(initialData));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<TeacherMethodologyStyleFieldKey, string>>>({});

  const updateForm = <K extends TeacherMethodologyStyleFieldKey>(key: K, value: TeacherMethodologyStyleDto[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleTeachingMaterial = (value: TeacherTeachingMaterial) => {
    if (!editing || saving) return;
    const nextValue = form.teachingMaterials.includes(value)
      ? form.teachingMaterials.filter((item) => item !== value)
      : [...form.teachingMaterials, value];
    updateForm("teachingMaterials", nextValue);
  };

  const cancelEditing = () => {
    setForm(toFormState(data));
    setFieldErrors({});
    setFormError("");
    setEditing(false);
  };

  const saveMethodologyStyle = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});
    setSaving(true);

    try {
      const savedData = await fetchJson<TeacherMethodologyStyleDto>(`/api/admin/teachers/${data.teacherId}/dossier/methodology-style`, {
        method: "PATCH",
        body: JSON.stringify({
          teaching_approach: form.teachingApproach || null,
          teaching_materials: form.teachingMaterials,
          teaching_features: form.teachingFeatures.trim() || null
        })
      });
      setData(toFormState(savedData));
      setForm(toFormState(savedData));
      setEditing(false);
    } catch (error) {
      if (error instanceof ApiRequestError && error.details?.fieldErrors) {
        const nextFieldErrors: Partial<Record<TeacherMethodologyStyleFieldKey, string>> = {};
        const fieldMap: Partial<Record<string, TeacherMethodologyStyleFieldKey>> = {
          teaching_approach: "teachingApproach",
          teaching_materials: "teachingMaterials",
          teaching_features: "teachingFeatures"
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
      setFormError(error instanceof Error ? error.message : "Не удалось сохранить методику и стиль");
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
              <ClipboardList className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">Методика и стиль</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Подход преподавателя, материалы и особенности ведения занятий.</p>
            </div>
          </div>
          {!editing ? <TeacherDossierActionMenu onEdit={() => setEditing(true)} /> : null}
        </div>

        <form className="space-y-4" onSubmit={saveMethodologyStyle}>
          <div data-testid="teacher-methodology-style-fields-grid" className="grid gap-4 md:grid-cols-3">
            <MethodologyStyleField label="Подход" error={fieldErrors.teachingApproach}>
              <Select
                value={form.teachingApproach}
                onChange={(event) => updateForm("teachingApproach", event.target.value as TeacherTeachingApproach | "")}
                disabled={!editing || saving}
                className={cn(fieldClassName, fieldErrors.teachingApproach && "border-red-500")}
              >
                <option value="">Не указан</option>
                {teacherTeachingApproachOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </MethodologyStyleField>
            <MethodologyStyleField label="Используемые материалы" error={fieldErrors.teachingMaterials}>
              <MultiSelectDropdown
                label="Используемые материалы"
                options={teacherTeachingMaterialOptions}
                value={form.teachingMaterials}
                disabled={!editing || saving}
                onChange={toggleTeachingMaterial}
              />
            </MethodologyStyleField>
            <MethodologyStyleField label="Особенности преподавания" error={fieldErrors.teachingFeatures}>
              <Textarea
                value={form.teachingFeatures}
                onChange={(event) => updateForm("teachingFeatures", event.target.value)}
                disabled={!editing || saving}
                rows={1}
                placeholder="Комментарий"
                className={cn(fieldClassName, "h-10 min-h-10 resize-none py-2", fieldErrors.teachingFeatures && "border-red-500")}
              />
            </MethodologyStyleField>
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
