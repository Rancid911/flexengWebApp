"use client";

import { useState } from "react";

import { adminPrimaryButtonClassName } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-button-tokens";
import type { TestsForm } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import { Button } from "@/components/ui/button";
import { CheckboxField, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CourseModuleOptionDto, CourseOptionDto } from "@/lib/admin/types";

export function AdminTestModuleSelectField({
  courseOptions,
  courseOptionsError,
  form,
  moduleOptions,
  moduleOptionsError,
  onCreateModule,
  required,
  setForm
}: {
  courseOptions: CourseOptionDto[];
  courseOptionsError?: string;
  form: TestsForm;
  moduleOptions: CourseModuleOptionDto[];
  moduleOptionsError?: string;
  onCreateModule: (input: { course_id: string; title: string; description: string | null; is_published: boolean }) => Promise<CourseModuleOptionDto>;
  required?: boolean;
  setForm: React.Dispatch<React.SetStateAction<TestsForm>>;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newModuleCourseId, setNewModuleCourseId] = useState("");
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleDescription, setNewModuleDescription] = useState("");
  const [newModulePublished, setNewModulePublished] = useState(true);
  const selectedModule = moduleOptions.find((item) => item.id === form.module_id);
  const shouldRenderFallbackOption = form.module_id && !selectedModule;
  const createDisabled = Boolean(courseOptionsError) || courseOptions.length === 0;

  const submitNewModule = async () => {
    setCreateError("");
    if (!newModuleCourseId) {
      setCreateError("Выберите курс");
      return;
    }
    if (!newModuleTitle.trim()) {
      setCreateError("Введите название модуля");
      return;
    }

    setCreating(true);
    try {
      const createdModule = await onCreateModule({
        course_id: newModuleCourseId,
        title: newModuleTitle.trim(),
        description: newModuleDescription.trim() || null,
        is_published: newModulePublished
      });
      setForm((prev) => ({ ...prev, module_id: createdModule.id }));
      setCreateOpen(false);
      setNewModuleCourseId("");
      setNewModuleTitle("");
      setNewModuleDescription("");
      setNewModulePublished(true);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Не удалось создать модуль");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      <Select
        data-testid="admin-test-module-select"
        value={form.module_id}
        onChange={(event) => setForm((prev) => ({ ...prev, module_id: event.target.value }))}
        required={required}
      >
        <option value="">Выберите модуль</option>
        {shouldRenderFallbackOption ? <option value={form.module_id}>Текущий модуль</option> : null}
        {moduleOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </Select>
      {moduleOptionsError ? <p className="text-xs text-red-500">{moduleOptionsError}</p> : null}
      {!moduleOptionsError && moduleOptions.length === 0 ? (
        <p className="text-xs text-slate-500">Модули не найдены. Сначала добавьте модуль курса.</p>
      ) : null}
      {courseOptionsError ? <p className="text-xs text-red-500">{courseOptionsError}</p> : null}
      {!courseOptionsError && courseOptions.length === 0 ? <p className="text-xs text-slate-500">Сначала создайте курс.</p> : null}
      <Button type="button" variant="secondary" size="sm" onClick={() => setCreateOpen((prev) => !prev)} disabled={createDisabled}>
        Создать модуль
      </Button>
      {createOpen ? (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Курс *">
              <Select
                data-testid="admin-test-new-module-course"
                value={newModuleCourseId}
                onChange={(event) => setNewModuleCourseId(event.target.value)}
              >
                <option value="">Выберите курс</option>
                {courseOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Название модуля *">
              <Input
                data-testid="admin-test-new-module-title"
                value={newModuleTitle}
                onChange={(event) => setNewModuleTitle(event.target.value)}
                placeholder="Например, Present Simple"
              />
            </FormField>
          </div>
          <FormField label="Описание">
            <Textarea
              value={newModuleDescription}
              onChange={(event) => setNewModuleDescription(event.target.value)}
              rows={2}
              placeholder="Короткое описание модуля"
            />
          </FormField>
          <CheckboxField label="Опубликовать">
            <input type="checkbox" checked={newModulePublished} onChange={(event) => setNewModulePublished(event.target.checked)} />
          </CheckboxField>
          {createError ? <p className="text-xs text-red-500">{createError}</p> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setCreateOpen(false);
                setCreateError("");
              }}
              disabled={creating}
            >
              Отмена
            </Button>
            <Button type="button" size="sm" className={adminPrimaryButtonClassName} onClick={() => void submitNewModule()} disabled={creating}>
              {creating ? "Создание..." : "Создать"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
