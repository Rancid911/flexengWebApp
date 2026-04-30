import Link from "next/link";
import { notFound } from "next/navigation";

import { StudentEmptyState, StudentPageHeader } from "@/app/(workspace)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { formatRuLongDateTime, formatRuShortDateTime } from "@/lib/dates/format-ru-date";
import { getHomeworkAssignmentDetail } from "@/lib/homework/queries";

function formatItemStatus(status: string) {
  switch (status) {
    case "completed":
      return "Завершено";
    case "in_progress":
      return "В работе";
    default:
      return "Не начато";
  }
}

function getItemStatusTone(status: string) {
  if (status === "completed") return "bg-[#edf9f0] text-[#1e7b43]";
  if (status === "in_progress") return "bg-[#eef4ff] text-[#1f7aff]";
  return "bg-[#f3f6fc] text-[#60708e]";
}

export default async function HomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assignment = await getHomeworkAssignmentDetail(id);
  if (!assignment) notFound();

  const items = Array.isArray(assignment.homework_items) ? assignment.homework_items : [];

  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title={assignment.title ?? "Домашнее задание"} description={assignment.description ?? "Подробности задания и список активностей."} />
      <Card className="rounded-[1.8rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
        <CardContent className="grid gap-4 p-5 md:grid-cols-3">
          <div>
            <p className="text-sm text-slate-500">Статус</p>
            <p className="mt-2 text-lg font-black text-slate-900">
              {assignment.status === "completed" ? "Завершено" : assignment.status === "overdue" ? "Просрочено" : assignment.status === "in_progress" ? "В работе" : "Не начато"}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Прогресс</p>
            <p className="mt-2 text-lg font-black text-slate-900">
              {assignment.requiredCount > 0 ? `${assignment.completedRequiredCount} из ${assignment.requiredCount} обязательных` : "Без обязательных пунктов"}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Дедлайн</p>
            <p className="mt-2 text-lg font-black text-slate-900">
              {assignment.due_at ? formatRuLongDateTime(assignment.due_at) || "Без дедлайна" : "Без дедлайна"}
            </p>
          </div>
        </CardContent>
      </Card>
      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="rounded-[1.8rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    {item.activityType === "trainer" ? "Тренажёр" : item.activityType === "test" ? "Тест" : item.source_type}
                  </p>
                  <p className="text-base font-bold text-slate-900">{item.title}</p>
                  {item.cefrLevel || item.drillTopicKey ? (
                    <p className="text-xs text-slate-500">
                      {item.cefrLevel ?? "без уровня"}
                      {item.drillTopicKey ? ` · ${item.drillTopicKey}` : ""}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className={`inline-flex min-h-9 items-center rounded-full px-3 py-1.5 font-semibold ${getItemStatusTone(item.status)}`}>
                      {formatItemStatus(item.status)}
                    </span>
                    <span className="inline-flex min-h-9 items-center rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                      {item.required ? "Обязательно" : "Опционально"}
                    </span>
                    {item.lastScore != null ? (
                      <span className="inline-flex min-h-9 items-center rounded-full bg-[#f2ecff] px-3 py-1.5 font-semibold text-[#6b46c1]">
                        Последний результат: {item.lastScore}%
                      </span>
                    ) : null}
                    {item.lastSubmittedAt ? (
                      <span className="inline-flex min-h-9 items-center rounded-full bg-slate-50 px-3 py-1.5 font-semibold text-slate-600">
                        Сдано: {formatRuShortDateTime(item.lastSubmittedAt) || "Без даты"}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item.href ? (
                    <Link href={item.href} className="inline-flex min-h-10 items-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
                      {item.status === "completed" ? "Пройти ещё раз" : item.status === "in_progress" ? "Продолжить" : "Открыть"}
                    </Link>
                  ) : null}
                </div>
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
