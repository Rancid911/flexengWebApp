import { StudentEmptyState, StudentPageHeader, StudentSubnav } from "@/app/(dashboard)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { getProgressHistory } from "@/lib/progress/queries";

export default async function ProgressHistoryPage() {
  const history = await getProgressHistory();
  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="История результатов" description="Все завершённые попытки по тестам и тренажёрам." />
      <StudentSubnav
        items={[
          { href: "/progress/overview", label: "Обзор" },
          { href: "/progress/topics", label: "Темы" },
          { href: "/progress/history", label: "История", active: true },
          { href: "/progress/weak-points", label: "Слабые места" }
        ]}
      />
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
                  <p className="text-sm text-slate-500">{item.submitted_at ?? item.created_at}</p>
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
