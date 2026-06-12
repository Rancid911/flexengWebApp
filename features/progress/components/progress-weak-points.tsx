import { Card, CardContent } from "@/components/ui/card";
import type { ProgressWeakPoint } from "@/lib/progress/progress.types";
import { StudentEmptyState, StudentPageHeader } from "@/shared/ui/student-page-primitives";

import { ProgressSubnav } from "@/features/progress/components/progress-subnav";

export function ProgressWeakPoints({ weakPoints }: { weakPoints: ProgressWeakPoint[] }) {
  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Слабые места" description="Темы и задания, в которых чаще всего возникают ошибки." />
      <ProgressSubnav active="weak-points" />
      {weakPoints.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {weakPoints.map((item) => (
            <Card key={item.id} className="rounded-[1.8rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
              <CardContent className="space-y-2 p-5">
                <p className="text-xl font-black tracking-tight text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-600">Повторных ошибок: {item.count}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StudentEmptyState title="Слабых мест пока нет" description="Когда появятся повторяющиеся ошибки, этот блок начнёт подсказывать проблемные темы." />
      )}
    </div>
  );
}
