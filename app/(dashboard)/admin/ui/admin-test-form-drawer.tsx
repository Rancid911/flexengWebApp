"use client";

import { AdminDrawer } from "@/app/(dashboard)/admin/ui/admin-drawer";
import type { TestsForm } from "@/app/(dashboard)/admin/ui/admin-console.constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  title: string;
  form: TestsForm;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => Promise<void> | void;
  setForm: React.Dispatch<React.SetStateAction<TestsForm>>;
  submitLabel: string;
};

export function AdminTestFormDrawer({ open, title, form, onClose, onSubmit, setForm, submitLabel }: Props) {
  return (
    <AdminDrawer open={open} onClose={onClose} title={title}>
      <form className="space-y-3" onSubmit={onSubmit}>
        <Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Название теста" required />
        <Input value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Описание" />
        <Input value={form.lesson_id} onChange={(event) => setForm((prev) => ({ ...prev, lesson_id: event.target.value }))} placeholder="lesson_id (uuid)" />
        <Input value={form.module_id} onChange={(event) => setForm((prev) => ({ ...prev, module_id: event.target.value }))} placeholder="module_id (uuid)" />
        <Input
          value={form.passing_score}
          onChange={(event) => setForm((prev) => ({ ...prev, passing_score: event.target.value }))}
          placeholder="Проходной балл (0-100)"
          type="number"
          min={0}
          max={100}
          required
        />
        <Input
          value={form.time_limit_minutes}
          onChange={(event) => setForm((prev) => ({ ...prev, time_limit_minutes: event.target.value }))}
          placeholder="Лимит времени (минуты)"
          type="number"
          min={1}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_published} onChange={(event) => setForm((prev) => ({ ...prev, is_published: event.target.checked }))} />
          Опубликован
        </label>
        <Button type="submit">{submitLabel}</Button>
      </form>
    </AdminDrawer>
  );
}
