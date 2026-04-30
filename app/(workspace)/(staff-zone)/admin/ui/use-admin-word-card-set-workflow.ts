"use client";

import { useCallback, useState, type FormEvent } from "react";

import {
  createDefaultWordCardSetForm,
  type WordCardSetForm
} from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.constants";
import { fetchJson, slugify } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-console.utils";
import type { AdminTestDto, AdminWordCardSetDetailDto } from "@/lib/admin/types";

function buildWordCardSetFormFromDetail(item: AdminWordCardSetDetailDto): WordCardSetForm {
  return {
    title: item.title,
    description: item.description ?? "",
    topic_slug: item.topic_slug,
    topic_title: item.topic_title,
    cefr_level: item.cefr_level,
    sort_order: String(item.sort_order),
    is_published: item.is_published,
    cards: item.cards.map((card) => ({
      clientId: crypto.randomUUID(),
      id: card.id,
      term: card.term,
      translation: card.translation,
      example_sentence: card.example_sentence,
      example_translation: card.example_translation
    }))
  };
}

function normalizeWordCardSetPayload(form: WordCardSetForm) {
  const title = form.title.trim();
  const topicTitle = form.topic_title.trim();
  const topicSlug = form.topic_slug.trim() || slugify(topicTitle || title) || `cards-${crypto.randomUUID().slice(0, 8)}`;
  const payload: {
    title: string;
    description: string | null;
    topic_slug: string;
    topic_title: string;
    cefr_level: string;
    sort_order?: number;
    is_published: boolean;
    cards: Array<{
      id?: string;
      term: string;
      translation: string;
      example_sentence: string;
      example_translation: string;
      sort_order: number;
    }>;
  } = {
    title,
    description: form.description.trim() || null,
    topic_slug: topicSlug,
    topic_title: topicTitle || title,
    cefr_level: form.cefr_level,
    is_published: form.is_published,
    cards: form.cards.map((card, index) => ({
      ...(card.id ? { id: card.id } : {}),
      term: card.term.trim(),
      translation: card.translation.trim(),
      example_sentence: card.example_sentence.trim(),
      example_translation: card.example_translation.trim(),
      sort_order: index
    }))
  };

  if (form.sort_order.trim()) {
    payload.sort_order = Number(form.sort_order.trim());
  }

  return payload;
}

export function useAdminWordCardSetWorkflow({
  onAfterMutation,
  setActionError
}: {
  onAfterMutation: () => Promise<void>;
  setActionError: (message: string) => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<AdminTestDto | null>(null);
  const [form, setForm] = useState<WordCardSetForm>(() => createDefaultWordCardSetForm());

  const openCreateDrawer = useCallback(() => {
    setActionError("");
    setEditing(null);
    setForm(createDefaultWordCardSetForm());
    setDrawerOpen(true);
  }, [setActionError]);

  const startEditing = useCallback(
    async (item: AdminTestDto) => {
      setActionError("");
      try {
        const detail = await fetchJson<AdminWordCardSetDetailDto>(`/api/admin/word-card-sets/${item.id}`);
        setEditing(item);
        setForm(buildWordCardSetFormFromDetail(detail));
        setDrawerOpen(true);
      } catch (requestError) {
        setActionError(requestError instanceof Error ? requestError.message : "Не удалось загрузить набор карточек");
      }
    },
    [setActionError]
  );

  const submit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (submitting) return;
      setSubmitting(true);
      setActionError("");

      try {
        const payload = normalizeWordCardSetPayload(form);
        if (editing) {
          await fetchJson(`/api/admin/word-card-sets/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        } else {
          await fetchJson("/api/admin/word-card-sets", { method: "POST", body: JSON.stringify(payload) });
        }

        setDrawerOpen(false);
        setEditing(null);
        setForm(createDefaultWordCardSetForm());
        await onAfterMutation();
      } catch (requestError) {
        setActionError(requestError instanceof Error ? requestError.message : "Не удалось сохранить набор карточек");
      } finally {
        setSubmitting(false);
      }
    },
    [editing, form, onAfterMutation, setActionError, submitting]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (!window.confirm("Удалить набор карточек?")) return;
      setActionError("");
      try {
        await fetchJson(`/api/admin/word-card-sets/${id}`, { method: "DELETE" });
        await onAfterMutation();
      } catch (requestError) {
        setActionError(requestError instanceof Error ? requestError.message : "Не удалось удалить набор карточек");
      }
    },
    [onAfterMutation, setActionError]
  );

  return {
    deleteItem,
    drawerOpen,
    editing,
    form,
    openCreateDrawer,
    setDrawerOpen,
    setForm,
    startEditing,
    submit,
    submitting
  };
}
