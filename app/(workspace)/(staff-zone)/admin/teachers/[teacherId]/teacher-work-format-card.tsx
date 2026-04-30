"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import { ApiRequestError, fetchJson } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.utils";
import {
  teacherLessonDurationOptions,
  teacherLessonTypeOptions,
  teacherWeekdayOptions,
  type TeacherLessonDuration,
  type TeacherLessonType,
  type TeacherWeekday
} from "@/lib/admin/teacher-dossier-options";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TeacherDossierActionMenu } from "./teacher-dossier-action-menu";

const SCHEMA_PENDING_MESSAGE = "Сохранение будет доступно после расширения базы данных";

export type TeacherWorkFormatDto = {
  teacherId: string;
  availableWeekdays: TeacherWeekday[];
  timeSlots: string;
  maxLessonsPerDay: number | null;
  maxLessonsPerWeek: number | null;
  lessonTypes: TeacherLessonType[];
  lessonDurations: TeacherLessonDuration[];
};

type TeacherWorkFormatFieldKey =
  | "availableWeekdays"
  | "timeSlots"
  | "maxLessonsPerDay"
  | "maxLessonsPerWeek"
  | "lessonTypes"
  | "lessonDurations";

function toFormState(value: TeacherWorkFormatDto): TeacherWorkFormatDto {
  return {
    ...value,
    timeSlots: value.timeSlots ?? ""
  };
}

function WorkFormatField({
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

export function TeacherWorkFormatCard({ initialData }: { initialData: TeacherWorkFormatDto }) {
  const [data, setData] = useState(() => toFormState(initialData));
  const [form, setForm] = useState(() => toFormState(initialData));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<TeacherWorkFormatFieldKey, string>>>({});

  const updateForm = <K extends TeacherWorkFormatFieldKey>(key: K, value: TeacherWorkFormatDto[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleWeekday = (value: TeacherWeekday) => {
    if (!editing || saving) return;
    const nextValue = form.availableWeekdays.includes(value)
      ? form.availableWeekdays.filter((item) => item !== value)
      : [...form.availableWeekdays, value];
    updateForm("availableWeekdays", nextValue);
  };

  const toggleLessonType = (value: TeacherLessonType) => {
    if (!editing || saving) return;
    const nextValue = form.lessonTypes.includes(value)
      ? form.lessonTypes.filter((item) => item !== value)
      : [...form.lessonTypes, value];
    updateForm("lessonTypes", nextValue);
  };

  const toggleLessonDuration = (value: TeacherLessonDuration) => {
    if (!editing || saving) return;
    const nextValue = form.lessonDurations.includes(value)
      ? form.lessonDurations.filter((item) => item !== value)
      : [...form.lessonDurations, value];
    updateForm("lessonDurations", nextValue);
  };

  const cancelEditing = () => {
    setForm(toFormState(data));
    setFieldErrors({});
    setFormError("");
    setEditing(false);
  };

  const saveWorkFormat = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});
    setSaving(true);

    try {
      const savedData = await fetchJson<TeacherWorkFormatDto>(`/api/admin/teachers/${data.teacherId}/dossier/work-format`, {
        method: "PATCH",
        body: JSON.stringify({
          available_weekdays: form.availableWeekdays,
          time_slots: form.timeSlots.trim() || null,
          max_lessons_per_day: form.maxLessonsPerDay,
          max_lessons_per_week: form.maxLessonsPerWeek,
          lesson_types: form.lessonTypes,
          lesson_durations: form.lessonDurations
        })
      });
      setData(toFormState(savedData));
      setForm(toFormState(savedData));
      setEditing(false);
    } catch (error) {
      if (error instanceof ApiRequestError && error.details?.fieldErrors) {
        const nextFieldErrors: Partial<Record<TeacherWorkFormatFieldKey, string>> = {};
        const fieldMap: Partial<Record<string, TeacherWorkFormatFieldKey>> = {
          available_weekdays: "availableWeekdays",
          time_slots: "timeSlots",
          max_lessons_per_day: "maxLessonsPerDay",
          max_lessons_per_week: "maxLessonsPerWeek",
          lesson_types: "lessonTypes",
          lesson_durations: "lessonDurations"
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
      setFormError(error instanceof ApiRequestError && error.code === "TEACHER_DOSSIER_SCHEMA_PENDING" ? SCHEMA_PENDING_MESSAGE : error instanceof Error ? error.message : "Не удалось сохранить формат работы");
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
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">Формат работы и доступность</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Рабочие дни, слоты, нагрузка и предпочтительные параметры уроков.</p>
            </div>
          </div>
          {!editing ? <TeacherDossierActionMenu onEdit={() => setEditing(true)} /> : null}
        </div>

        <form className="space-y-4" onSubmit={saveWorkFormat}>
          <div data-testid="teacher-work-format-fields-grid" className="grid gap-4 md:grid-cols-3">
            <WorkFormatField label="Доступные дни недели" error={fieldErrors.availableWeekdays}>
              <MultiSelectDropdown
                label="Доступные дни недели"
                options={teacherWeekdayOptions}
                value={form.availableWeekdays}
                disabled={!editing || saving}
                onChange={toggleWeekday}
              />
            </WorkFormatField>
            <WorkFormatField label="Временные слоты" error={fieldErrors.timeSlots}>
              <Input
                value={form.timeSlots}
                onChange={(event) => updateForm("timeSlots", event.target.value)}
                disabled={!editing || saving}
                placeholder="10:00-14:00, 18:00-21:00"
                className={cn(fieldClassName, fieldErrors.timeSlots && "border-red-500")}
              />
            </WorkFormatField>
            <WorkFormatField label="Максимум уроков в день" error={fieldErrors.maxLessonsPerDay}>
              <Input
                value={form.maxLessonsPerDay ?? ""}
                onChange={(event) => updateForm("maxLessonsPerDay", event.target.value === "" ? null : Number(event.target.value))}
                disabled={!editing || saving}
                type="number"
                min={0}
                max={20}
                className={cn(fieldClassName, fieldErrors.maxLessonsPerDay && "border-red-500")}
              />
            </WorkFormatField>
            <WorkFormatField label="Максимум уроков в неделю" error={fieldErrors.maxLessonsPerWeek}>
              <Input
                value={form.maxLessonsPerWeek ?? ""}
                onChange={(event) => updateForm("maxLessonsPerWeek", event.target.value === "" ? null : Number(event.target.value))}
                disabled={!editing || saving}
                type="number"
                min={0}
                max={80}
                className={cn(fieldClassName, fieldErrors.maxLessonsPerWeek && "border-red-500")}
              />
            </WorkFormatField>
            <WorkFormatField label="Тип уроков" error={fieldErrors.lessonTypes}>
              <MultiSelectDropdown
                label="Тип уроков"
                options={teacherLessonTypeOptions}
                value={form.lessonTypes}
                disabled={!editing || saving}
                onChange={toggleLessonType}
              />
            </WorkFormatField>
            <WorkFormatField label="Длительность урока" error={fieldErrors.lessonDurations}>
              <MultiSelectDropdown
                label="Длительность урока"
                options={teacherLessonDurationOptions}
                value={form.lessonDurations}
                disabled={!editing || saving}
                onChange={toggleLessonDuration}
              />
            </WorkFormatField>
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
