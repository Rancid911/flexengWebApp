"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusMessage } from "@/components/ui/status-message";
import { formatRuLongDateTime } from "@/lib/dates/format-ru-date";
import type { TeacherStudentPlacementSummaryDto } from "@/lib/teacher-workspace/types";

export function TeacherStudentPlacementCard({
  placementSummary,
  loading,
  error,
  onToggle
}: {
  placementSummary: TeacherStudentPlacementSummaryDto | null;
  loading: boolean;
  error: string | null;
  onToggle: () => Promise<void>;
}) {
  const status = placementSummary?.status ?? "not_assigned";
  const assigned = status === "not_started" || status === "in_progress" || status === "overdue";
  const buttonLabel = assigned ? "Отменить" : "Назначить placement test";
  const loadingLabel = assigned ? "Отменяем..." : "Назначаем...";
  const statusLabel =
    status === "completed"
      ? "Завершён"
      : status === "overdue"
        ? "Просрочен"
        : status === "in_progress"
          ? "В работе"
          : status === "not_started"
            ? "Назначен"
            : "Не назначен";
  const compactSummary =
    placementSummary?.score != null
      ? ["Результат: " + `${placementSummary.score}%`, placementSummary.recommendedLevel, placementSummary.recommendedBandLabel]
          .filter(Boolean)
          .join(" · ")
      : assigned
        ? status === "in_progress"
          ? "Ученик начал прохождение теста."
          : status === "overdue"
            ? "Срок прохождения истёк."
            : "Тест назначен и ожидает прохождения."
        : "Тест ещё не назначен этому ученику.";
  const submittedLabel = placementSummary?.submittedAt ? formatRuLongDateTime(placementSummary.submittedAt) || "Без даты" : null;

  return (
    <Card className="rounded-[2rem] border-[#dfe9fb] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
      <CardContent className="space-y-3 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black tracking-[-0.04em] text-slate-900">Placement test</h2>
              <span className="inline-flex rounded-full bg-[#eef5ff] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#1f7aff]">
                {statusLabel}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{compactSummary}</p>
            {submittedLabel ? <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{submittedLabel}</p> : null}
          </div>
          <div className="sm:shrink-0">
            <Button
              type="button"
              onClick={() => void onToggle()}
              disabled={loading}
              className="h-9 rounded-2xl bg-[#1f7aff] px-3.5 text-sm font-black text-white hover:bg-[#1669db] disabled:bg-[#bfdbfe] disabled:text-white"
            >
              {loading ? loadingLabel : buttonLabel}
            </Button>
          </div>
        </div>

        {error ? <StatusMessage>{error}</StatusMessage> : null}
      </CardContent>
    </Card>
  );
}
