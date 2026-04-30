"use client";

import { useState } from "react";
import { BriefcaseBusiness } from "lucide-react";

import { ApiRequestError, fetchJson } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.utils";
import {
  teacherCooperationTypeOptions,
  teacherCurrencyOptions,
  teacherOperationalStatusOptions,
  type TeacherCooperationType,
  type TeacherCurrency,
  type TeacherOperationalStatus
} from "@/lib/admin/teacher-dossier-options";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TeacherDossierActionMenu } from "./teacher-dossier-action-menu";

const SCHEMA_PENDING_MESSAGE = "Сохранение будет доступно после расширения базы данных";

export type TeacherOperationalInfoDto = {
  teacherId: string;
  status: TeacherOperationalStatus;
  startDate: string | null;
  cooperationType: TeacherCooperationType;
  lessonRateAmount: number | null;
  currency: TeacherCurrency;
};

type TeacherOperationalInfoFieldKey = "status" | "startDate" | "cooperationType" | "lessonRateAmount" | "currency";

function toFormState(value: TeacherOperationalInfoDto): TeacherOperationalInfoDto {
  return {
    ...value,
    startDate: value.startDate ?? null
  };
}

function OperationalInfoField({
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

export function TeacherOperationalInfoCard({ initialData }: { initialData: TeacherOperationalInfoDto }) {
  const [data, setData] = useState(() => toFormState(initialData));
  const [form, setForm] = useState(() => toFormState(initialData));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<TeacherOperationalInfoFieldKey, string>>>({});

  const updateForm = <K extends TeacherOperationalInfoFieldKey>(key: K, value: TeacherOperationalInfoDto[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const cancelEditing = () => {
    setForm(toFormState(data));
    setFieldErrors({});
    setFormError("");
    setEditing(false);
  };

  const saveOperationalInfo = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});
    setSaving(true);

    try {
      const savedData = await fetchJson<TeacherOperationalInfoDto>(`/api/admin/teachers/${data.teacherId}/dossier/operational-info`, {
        method: "PATCH",
        body: JSON.stringify({
          status: form.status,
          start_date: form.startDate || null,
          cooperation_type: form.cooperationType,
          lesson_rate_amount: form.lessonRateAmount,
          currency: form.currency
        })
      });
      setData(toFormState(savedData));
      setForm(toFormState(savedData));
      setEditing(false);
    } catch (error) {
      if (error instanceof ApiRequestError && error.details?.fieldErrors) {
        const nextFieldErrors: Partial<Record<TeacherOperationalInfoFieldKey, string>> = {};
        const fieldMap: Partial<Record<string, TeacherOperationalInfoFieldKey>> = {
          status: "status",
          start_date: "startDate",
          cooperation_type: "cooperationType",
          lesson_rate_amount: "lessonRateAmount",
          currency: "currency"
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
      setFormError(error instanceof ApiRequestError && error.code === "TEACHER_DOSSIER_SCHEMA_PENDING" ? SCHEMA_PENDING_MESSAGE : error instanceof Error ? error.message : "Не удалось сохранить операционные данные");
    } finally {
      setSaving(false);
    }
  };

  const fieldClassName = "border-[#dfe9fb] bg-[#fbfdff] font-normal text-slate-900 disabled:cursor-default disabled:text-slate-900 disabled:opacity-100 disabled:[-webkit-text-fill-color:#0f172a]";

  return (
    <Card className="rounded-2xl border-[#dfe9fb] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef5ff] text-[#1f7aff]">
              <BriefcaseBusiness className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-[-0.04em] text-slate-900">Операционные данные</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Внутренние рабочие настройки для управления сотрудничеством и оплатой.</p>
            </div>
          </div>
          {!editing ? <TeacherDossierActionMenu onEdit={() => setEditing(true)} /> : null}
        </div>

        <form className="space-y-4" onSubmit={saveOperationalInfo}>
          <div data-testid="teacher-operational-info-fields-grid" className="grid gap-4 md:grid-cols-3">
            <OperationalInfoField label="Статус" error={fieldErrors.status}>
              <Select
                value={form.status}
                onChange={(event) => updateForm("status", event.target.value as TeacherOperationalStatus)}
                disabled={!editing || saving}
                className={cn(fieldClassName, fieldErrors.status && "border-red-500")}
              >
                {teacherOperationalStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </OperationalInfoField>
            <OperationalInfoField label="Дата начала работы" error={fieldErrors.startDate}>
              <Input
                value={form.startDate ?? ""}
                onChange={(event) => updateForm("startDate", event.target.value || null)}
                disabled={!editing || saving}
                type="date"
                className={cn(fieldClassName, fieldErrors.startDate && "border-red-500")}
              />
            </OperationalInfoField>
            <OperationalInfoField label="Тип сотрудничества" error={fieldErrors.cooperationType}>
              <Select
                value={form.cooperationType}
                onChange={(event) => updateForm("cooperationType", event.target.value as TeacherCooperationType)}
                disabled={!editing || saving}
                className={cn(fieldClassName, fieldErrors.cooperationType && "border-red-500")}
              >
                {teacherCooperationTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </OperationalInfoField>
            <OperationalInfoField label="Ставка за урок" error={fieldErrors.lessonRateAmount}>
              <Input
                value={form.lessonRateAmount ?? ""}
                onChange={(event) => updateForm("lessonRateAmount", event.target.value === "" ? null : Number(event.target.value))}
                disabled={!editing || saving}
                type="number"
                min={0}
                step="0.01"
                className={cn(fieldClassName, fieldErrors.lessonRateAmount && "border-red-500")}
              />
            </OperationalInfoField>
            <OperationalInfoField label="Валюта" error={fieldErrors.currency}>
              <Select
                value={form.currency}
                onChange={(event) => updateForm("currency", event.target.value as TeacherCurrency)}
                disabled={!editing || saving}
                className={cn(fieldClassName, fieldErrors.currency && "border-red-500")}
              >
                {teacherCurrencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </OperationalInfoField>
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
