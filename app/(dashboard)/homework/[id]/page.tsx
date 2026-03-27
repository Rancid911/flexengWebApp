import { notFound } from "next/navigation";

import { StudentEmptyState, StudentPageHeader } from "@/app/(dashboard)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { getHomeworkAssignmentDetail } from "@/lib/homework/queries";

export default async function HomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assignment = await getHomeworkAssignmentDetail(id);
  if (!assignment) notFound();

  const items = Array.isArray(assignment.homework_items) ? assignment.homework_items : [];

  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title={assignment.title ?? "Домашнее задание"} description={assignment.description ?? "Подробности задания и список активностей."} />
      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="rounded-[1.8rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">{item.source_type}</p>
                  <p className="text-base font-bold text-slate-900">{item.source_id}</p>
                </div>
                <span className="inline-flex min-h-10 items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                  {item.required ? "Обязательно" : "Опционально"}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StudentEmptyState title="В задании пока нет активностей" description="Содержимое домашней работы появится здесь после настройки teacher/admin flow." />
      )}
    </div>
  );
}
