import { StudentEmptyState, StudentPageHeader, StudentSubnav } from "@/app/(workspace)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { getWeakPoints } from "@/lib/progress/queries";

export default async function ProgressWeakPointsPage() {
  const weakPoints = await getWeakPoints();
  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Слабые места" description="Темы и задания, в которых чаще всего возникают ошибки." />
      <StudentSubnav
        items={[
          { href: "/progress/overview", label: "Обзор" },
          { href: "/progress/topics", label: "Темы" },
          { href: "/progress/history", label: "История" },
          { href: "/progress/weak-points", label: "Слабые места", active: true }
        ]}
      />
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
