import type { AdminWordCardItemDto, AdminWordCardSetDetailDto, AdminWordCardSetDto } from "@/lib/admin/types";

export const WORD_CARD_SET_DETAIL_SELECT =
  "*, word_card_items(id, term, translation, example_sentence, example_translation, sort_order)";

export function toWordCardSetDto(row: Record<string, unknown>): AdminWordCardSetDto {
  const cards = Array.isArray(row.word_card_items) ? row.word_card_items : [];
  return {
    id: String(row.id ?? ""),
    material_type: "word_cards",
    title: String(row.title ?? ""),
    description: row.description == null ? null : String(row.description),
    topic_slug: String(row.topic_slug ?? ""),
    topic_title: String(row.topic_title ?? ""),
    cefr_level:
      row.cefr_level === "A1" || row.cefr_level === "A2" || row.cefr_level === "B1" || row.cefr_level === "B2" || row.cefr_level === "C1"
        ? row.cefr_level
        : "A1",
    sort_order: Number(row.sort_order ?? 0),
    is_published: Boolean(row.is_published),
    card_count: Number(row.card_count ?? cards.length ?? 0),
    created_at: row.created_at == null ? null : String(row.created_at),
    updated_at: row.updated_at == null ? null : String(row.updated_at)
  };
}

function toWordCardItemDto(row: Record<string, unknown>): AdminWordCardItemDto {
  return {
    id: String(row.id ?? ""),
    term: String(row.term ?? ""),
    translation: String(row.translation ?? ""),
    example_sentence: String(row.example_sentence ?? ""),
    example_translation: String(row.example_translation ?? ""),
    sort_order: Number(row.sort_order ?? 0)
  };
}

export function toWordCardSetDetailDto(row: Record<string, unknown>): AdminWordCardSetDetailDto {
  const cards = Array.isArray(row.word_card_items) ? row.word_card_items : [];
  return {
    ...toWordCardSetDto(row),
    cards: cards
      .map((item) => toWordCardItemDto(item as Record<string, unknown>))
      .sort((left, right) => left.sort_order - right.sort_order)
  };
}

export function toWordCardsListMaterialDto(row: Record<string, unknown>) {
  const dto = toWordCardSetDto(row);
  return {
    id: dto.id,
    material_type: "word_cards" as const,
    lesson_id: null,
    module_id: null,
    activity_type: "trainer" as const,
    assessment_kind: "regular" as const,
    title: dto.title,
    description: dto.description,
    cefr_level: dto.cefr_level,
    drill_topic_key: dto.topic_slug,
    drill_kind: "vocabulary" as const,
    scoring_profile: null,
    lesson_reinforcement: false,
    sort_order: dto.sort_order,
    passing_score: 0,
    time_limit_minutes: null,
    is_published: dto.is_published,
    created_at: dto.created_at,
    updated_at: dto.updated_at,
    card_count: dto.card_count,
    topic_title: dto.topic_title
  };
}
