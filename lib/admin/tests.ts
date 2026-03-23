import type { AdminTestDto } from "@/lib/admin/types";

export function toTestDto(row: Record<string, unknown>): AdminTestDto {
  return {
    id: String(row.id ?? ""),
    lesson_id: row.lesson_id == null ? null : String(row.lesson_id),
    module_id: row.module_id == null ? null : String(row.module_id),
    title: String(row.title ?? ""),
    description: row.description == null ? null : String(row.description),
    passing_score: Number(row.passing_score ?? 70),
    time_limit_minutes: row.time_limit_minutes == null ? null : Number(row.time_limit_minutes),
    is_published: Boolean(row.is_published),
    created_at: row.created_at == null ? null : String(row.created_at),
    updated_at: row.updated_at == null ? null : String(row.updated_at)
  };
}
