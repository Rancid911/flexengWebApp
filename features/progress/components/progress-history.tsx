import { Card, CardContent } from "@/components/ui/card";
import { formatRuShortDateTime } from "@/lib/dates/format-ru-date";
import type { ProgressHistoryItem } from "@/lib/progress/progress.types";
import { StudentEmptyState, StudentPageHeader } from "@/shared/ui/student-page-primitives";

import { ProgressSubnav } from "@/features/progress/components/progress-subnav";

export function ProgressHistory({ history }: { history: ProgressHistoryItem[] }) {
  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="История результатов" description="Все завершённые попытки по тестам и тренажёрам." />
      <ProgressSubnav active="history" />
      {history.length > 0 ? (
        <div className="space-y-4">
          {history.map((item) => (
            <Card key={item.id} className="rounded-[1.8rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-black tracking-tight text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black tracking-tight text-indigo-700">{Math.round(Number(item.score ?? 0))}%</p>
                  <p className="text-sm text-slate-500">{formatRuShortDateTime(item.submitted_at ?? item.created_at) || "Без даты"}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StudentEmptyState title="История пока пуста" description="Здесь появятся завершённые тесты и практические попытки." />
      )}
    </div>
  );
}
