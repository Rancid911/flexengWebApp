import type { AdminTestDetailDto, AdminTestDto, AdminTestQuestionDto, AdminTestQuestionOptionDto } from "@/lib/admin/types";

export function toTestDto(row: Record<string, unknown>): AdminTestDto {
  return {
    id: String(row.id ?? ""),
    material_type: "test",
    lesson_id: row.lesson_id == null ? null : String(row.lesson_id),
    module_id: row.module_id == null ? null : String(row.module_id),
    activity_type: row.activity_type === "trainer" ? "trainer" : "test",
    assessment_kind: row.assessment_kind === "placement" ? "placement" : "regular",
    title: String(row.title ?? ""),
    description: row.description == null ? null : String(row.description),
    cefr_level: row.cefr_level == null ? null : String(row.cefr_level),
    drill_topic_key: row.drill_topic_key == null ? null : String(row.drill_topic_key),
    drill_kind:
      row.drill_kind === "grammar" || row.drill_kind === "vocabulary" || row.drill_kind === "mixed" ? row.drill_kind : null,
    scoring_profile: row.scoring_profile && typeof row.scoring_profile === "object" ? (row.scoring_profile as Record<string, unknown>) : null,
    lesson_reinforcement: Boolean(row.lesson_reinforcement),
    sort_order: Number(row.sort_order ?? 0),
    passing_score: Number(row.passing_score ?? 70),
    time_limit_minutes: row.time_limit_minutes == null ? null : Number(row.time_limit_minutes),
    is_published: Boolean(row.is_published),
    created_at: row.created_at == null ? null : String(row.created_at),
    updated_at: row.updated_at == null ? null : String(row.updated_at)
  };
}

function toQuestionOptionDto(row: Record<string, unknown>): AdminTestQuestionOptionDto {
  return {
    id: String(row.id ?? ""),
    option_text: String(row.option_text ?? ""),
    is_correct: Boolean(row.is_correct),
    sort_order: Number(row.sort_order ?? 0)
  };
}

function toQuestionDto(row: Record<string, unknown>): AdminTestQuestionDto {
  const optionsRaw = Array.isArray(row.test_question_options) ? row.test_question_options : [];
  return {
    id: String(row.id ?? ""),
    prompt: String(row.prompt ?? ""),
    explanation: row.explanation == null ? null : String(row.explanation),
    question_type: "single_choice",
    placement_band:
      row.placement_band === "beginner" ||
      row.placement_band === "elementary" ||
      row.placement_band === "pre_intermediate" ||
      row.placement_band === "intermediate" ||
      row.placement_band === "upper_intermediate" ||
      row.placement_band === "advanced"
        ? row.placement_band
        : null,
    sort_order: Number(row.sort_order ?? 0),
    options: optionsRaw
      .map((item) => toQuestionOptionDto(item as Record<string, unknown>))
      .sort((left, right) => left.sort_order - right.sort_order)
  };
}

export function toTestDetailDto(row: Record<string, unknown>, hasAttempts: boolean): AdminTestDetailDto {
  const questionsRaw = Array.isArray(row.test_questions) ? row.test_questions : [];
  return {
    ...toTestDto(row),
    has_attempts: hasAttempts,
    questions: questionsRaw
      .map((item) => toQuestionDto(item as Record<string, unknown>))
      .sort((left, right) => left.sort_order - right.sort_order)
  };
}
