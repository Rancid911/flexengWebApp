"use client";

import {
  drillKindOptions,
  englishLevelOptions,
  type TestsForm
} from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import { AdminTestModuleSelectField } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-test-module-select-field";
import {
  applyMaterialKind,
  DrawerSection,
  materialKindOptions,
  type MaterialKind
} from "@/app/(workspace)/(staff-zone)/admin/ui/admin-test-form-shared";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.utils";
import type { CourseModuleOptionDto, CourseOptionDto } from "@/lib/admin/types";

export function AdminTestBasicSection({
  courseOptions,
  courseOptionsError,
  form,
  isTrainer,
  materialKind,
  moduleOptions,
  moduleOptionsError,
  onCreateModule,
  requiresModule,
  setForm
}: {
  courseOptions: CourseOptionDto[];
  courseOptionsError?: string;
  form: TestsForm;
  isTrainer: boolean;
  materialKind: MaterialKind;
  moduleOptions: CourseModuleOptionDto[];
  moduleOptionsError?: string;
  onCreateModule: (input: { course_id: string; title: string; description: string | null; is_published: boolean }) => Promise<CourseModuleOptionDto>;
  requiresModule: boolean;
  setForm: React.Dispatch<React.SetStateAction<TestsForm>>;
}) {
  return (
    <DrawerSection title="Основное" description="Заполните понятные для администратора свойства материала.">
      <div className="grid gap-4 lg:grid-cols-2">
        <FormField label="Название">
          <Input
            data-testid="admin-test-title-input"
            value={form.title}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                title: event.target.value,
                drill_topic_key: prev.drill_topic_key.trim() ? prev.drill_topic_key : slugify(event.target.value)
              }))
            }
            placeholder="Например, Present Simple: базовый материал"
            required
          />
        </FormField>
        <FormField
          label="Тип материала"
          hint={
            materialKind === "trainer"
              ? "Для ежедневной практики и домашних заданий."
              : materialKind === "final_test"
                ? "Для итоговой проверки после прохождения темы."
                : "Для диагностики уровня. Используется редко и требует уровни блоков."
          }
        >
          <Select value={materialKind} onChange={(event) => setForm((prev) => applyMaterialKind(prev, event.target.value as MaterialKind))}>
            {materialKindOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={isTrainer ? "CEFR *" : "CEFR"} hint={isTrainer ? "Обязательно для тренажёра." : undefined}>
          <Select value={form.cefr_level} onChange={(event) => setForm((prev) => ({ ...prev, cefr_level: event.target.value }))}>
            <option value="">Не задан</option>
            {englishLevelOptions.filter((option) => option.value !== "C2").map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        {requiresModule ? (
          <FormField label="Модуль *" hint="Материал будет показан внутри выбранного модуля.">
            <AdminTestModuleSelectField
              form={form}
              courseOptions={courseOptions}
              courseOptionsError={courseOptionsError}
              moduleOptions={moduleOptions}
              moduleOptionsError={moduleOptionsError}
              onCreateModule={onCreateModule}
              required
              setForm={setForm}
            />
          </FormField>
        ) : null}
        <FormField
          label={isTrainer ? "Тема *" : "Тема"}
          hint={
            isTrainer
              ? "Обязательно для тренажёра. Заполняется автоматически из названия, но можно изменить вручную."
              : "Заполняется автоматически из названия, но при необходимости можно изменить вручную."
          }
        >
          <Input
            value={form.drill_topic_key}
            onChange={(event) => setForm((prev) => ({ ...prev, drill_topic_key: event.target.value }))}
            placeholder="present-simple-basic"
            required={isTrainer}
          />
        </FormField>
        <FormField label="Тип тренировки">
          <Select value={form.drill_kind} onChange={(event) => setForm((prev) => ({ ...prev, drill_kind: event.target.value as TestsForm["drill_kind"] }))}>
            <option value="">Не задан</option>
            {drillKindOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Описание">
        <Textarea
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          rows={3}
          placeholder="Коротко опишите, для чего нужен этот учебный материал."
        />
      </FormField>
    </DrawerSection>
  );
}
