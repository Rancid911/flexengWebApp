"use client";

import type { TestsForm } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import { DrawerSection } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-test-form-shared";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";

export function AdminTestPlacementSection({
  form,
  setForm
}: {
  form: TestsForm;
  setForm: React.Dispatch<React.SetStateAction<TestsForm>>;
}) {
  return (
    <DrawerSection title="Расширенные настройки placement" description="Технические настройки диагностики уровня. Обычно можно оставить пустым.">
      <FormField label="Scoring profile" hint="Если оставить пустым, для placement будет подставлен профиль по умолчанию.">
        <Textarea
          value={form.scoring_profile}
          onChange={(event) => setForm((prev) => ({ ...prev, scoring_profile: event.target.value }))}
          rows={6}
          placeholder='{"kind":"placement_v1","bands":[...]}'
        />
      </FormField>
    </DrawerSection>
  );
}
