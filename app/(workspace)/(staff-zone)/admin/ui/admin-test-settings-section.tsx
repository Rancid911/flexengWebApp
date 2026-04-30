"use client";

import type { TestsForm } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import { DrawerSection } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-test-form-shared";
import { CheckboxField, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export function AdminTestSettingsSection({
  form,
  setForm
}: {
  form: TestsForm;
  setForm: React.Dispatch<React.SetStateAction<TestsForm>>;
}) {
  return (
    <DrawerSection title="Параметры" description="Эти настройки влияют на публикацию и отображение материала.">
      <div className="grid gap-4 lg:grid-cols-2">
        <FormField label="Проходной балл">
          <Input
            value={form.passing_score}
            onChange={(event) => setForm((prev) => ({ ...prev, passing_score: event.target.value }))}
            type="number"
            min={0}
            max={100}
            required
          />
        </FormField>
        <FormField label="Лимит времени (минуты)">
          <Input
            value={form.time_limit_minutes}
            onChange={(event) => setForm((prev) => ({ ...prev, time_limit_minutes: event.target.value }))}
            type="number"
            min={1}
            placeholder="Например, 20"
          />
        </FormField>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <CheckboxField label="Опубликовать сразу">
          <input type="checkbox" checked={form.is_published} onChange={(event) => setForm((prev) => ({ ...prev, is_published: event.target.checked }))} />
        </CheckboxField>
        <CheckboxField label="Закрепление после урока">
          <input
            type="checkbox"
            checked={form.lesson_reinforcement}
            onChange={(event) => setForm((prev) => ({ ...prev, lesson_reinforcement: event.target.checked }))}
          />
        </CheckboxField>
      </div>
    </DrawerSection>
  );
}
