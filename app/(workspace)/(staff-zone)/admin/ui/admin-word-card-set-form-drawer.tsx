"use client";

import { adminPrimaryButtonClassName } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-button-tokens";
import { AdminDrawer } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-drawer";
import {
  createEmptyWordCardItemForm,
  englishLevelOptions,
  type WordCardItemForm,
  type WordCardSetForm
} from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import { slugify } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.utils";
import { Button } from "@/components/ui/button";
import { CheckboxField, FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  title: string;
  form: WordCardSetForm;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => Promise<void> | void;
  setForm: React.Dispatch<React.SetStateAction<WordCardSetForm>>;
  submitLabel: string;
  submitting: boolean;
  formError: string;
};

function DrawerSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function AdminWordCardSetFormDrawer({
  open,
  title,
  form,
  onClose,
  onSubmit,
  setForm,
  submitLabel,
  submitting,
  formError
}: Props) {
  const updateCard = (clientId: string, updater: (card: WordCardItemForm) => WordCardItemForm) => {
    setForm((prev) => ({
      ...prev,
      cards: prev.cards.map((card) => (card.clientId === clientId ? updater(card) : card))
    }));
  };

  const addCard = () => {
    setForm((prev) => ({
      ...prev,
      cards: [...prev.cards, createEmptyWordCardItemForm()]
    }));
  };

  const removeCard = (clientId: string) => {
    setForm((prev) => ({
      ...prev,
      cards: prev.cards.length <= 1 ? prev.cards : prev.cards.filter((card) => card.clientId !== clientId)
    }));
  };

  const moveCard = (clientId: string, direction: -1 | 1) => {
    setForm((prev) => {
      const index = prev.cards.findIndex((card) => card.clientId === clientId);
      if (index < 0) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.cards.length) return prev;

      const cards = [...prev.cards];
      const [card] = cards.splice(index, 1);
      cards.splice(nextIndex, 0, card);
      return { ...prev, cards };
    });
  };

  return (
    <AdminDrawer open={open} onClose={onClose} title={title} widthClass="max-w-[72rem]">
      <form className="space-y-4" onSubmit={onSubmit}>
        <DrawerSection title="Набор карточек" description="Набор будет доступен ученикам в разделе Слова после публикации. CEFR обязателен.">
          <div className="grid gap-4 lg:grid-cols-2">
            <FormField label="Название">
              <Input
                data-testid="admin-word-card-set-title"
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    title: event.target.value,
                    topic_slug: prev.topic_slug.trim() ? prev.topic_slug : slugify(event.target.value)
                  }))
                }
                placeholder="Например, Кафе и ресторан"
                required
              />
            </FormField>
            <FormField label="CEFR *">
              <Select
                data-testid="admin-word-card-set-cefr"
                value={form.cefr_level}
                onChange={(event) => setForm((prev) => ({ ...prev, cefr_level: event.target.value }))}
                required
              >
                <option value="">Выберите уровень</option>
                {englishLevelOptions.filter((option) => option.value !== "C2").map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Тема">
              <Input
                value={form.topic_title}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    topic_title: event.target.value,
                    topic_slug: prev.topic_slug.trim() ? prev.topic_slug : slugify(event.target.value)
                  }))
                }
                placeholder="Например, Еда"
                required
              />
            </FormField>
            <FormField label="Slug темы">
              <Input
                value={form.topic_slug}
                onChange={(event) => setForm((prev) => ({ ...prev, topic_slug: event.target.value }))}
                placeholder="food"
                required
              />
            </FormField>
            <FormField label="Порядок">
              <Input
                value={form.sort_order}
                onChange={(event) => setForm((prev) => ({ ...prev, sort_order: event.target.value }))}
                type="number"
                min={0}
                placeholder="Автоматически"
              />
            </FormField>
            <CheckboxField label="Опубликовать">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(event) => setForm((prev) => ({ ...prev, is_published: event.target.checked }))}
              />
            </CheckboxField>
          </div>

          <FormField label="Описание">
            <Textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              placeholder="Коротко опишите набор."
            />
          </FormField>
        </DrawerSection>

        <DrawerSection title="Карточки" description="Для публикации нужно минимум 5 полностью заполненных карточек.">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{form.cards.length} шт.</span>
            <Button type="button" variant="secondary" onClick={addCard}>
              Добавить карточку
            </Button>
          </div>

          <div className="space-y-4">
            {form.cards.map((card, index) => (
              <div key={card.clientId} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Карточка {index + 1}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => moveCard(card.clientId, -1)} disabled={index === 0}>
                      Выше
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => moveCard(card.clientId, 1)} disabled={index === form.cards.length - 1}>
                      Ниже
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => removeCard(card.clientId)} disabled={form.cards.length <= 1}>
                      Удалить
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <FormField label="Слово">
                    <Input
                      value={card.term}
                      onChange={(event) => updateCard(card.clientId, (prev) => ({ ...prev, term: event.target.value }))}
                      placeholder="afford"
                      required
                    />
                  </FormField>
                  <FormField label="Перевод">
                    <Input
                      value={card.translation}
                      onChange={(event) => updateCard(card.clientId, (prev) => ({ ...prev, translation: event.target.value }))}
                      placeholder="позволить себе"
                      required
                    />
                  </FormField>
                  <FormField label="Пример">
                    <Textarea
                      value={card.example_sentence}
                      onChange={(event) => updateCard(card.clientId, (prev) => ({ ...prev, example_sentence: event.target.value }))}
                      rows={2}
                      placeholder="I can't afford a new phone."
                      required
                    />
                  </FormField>
                  <FormField label="Перевод примера">
                    <Textarea
                      value={card.example_translation}
                      onChange={(event) => updateCard(card.clientId, (prev) => ({ ...prev, example_translation: event.target.value }))}
                      rows={2}
                      placeholder="Я не могу позволить себе новый телефон."
                      required
                    />
                  </FormField>
                </div>
              </div>
            ))}
          </div>
        </DrawerSection>

        <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-border bg-[#f8fafc]/95 px-1 pb-1 pt-4 backdrop-blur">
          {formError ? <p data-testid="admin-word-card-set-form-error" className="mr-auto max-w-2xl text-sm text-red-500">{formError}</p> : null}
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button data-testid="admin-word-card-set-submit" type="submit" disabled={submitting} className={adminPrimaryButtonClassName}>
            {submitting ? "Сохранение..." : submitLabel}
          </Button>
        </div>
      </form>
    </AdminDrawer>
  );
}
