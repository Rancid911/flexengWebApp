import Link from "next/link";

import { StudentEmptyState } from "@/app/(dashboard)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import type { HomeworkListItem } from "@/lib/homework/queries";

function formatStatus(status: string) {
  switch (status) {
    case "completed":
      return "Завершено";
    case "in_progress":
      return "В работе";
    case "overdue":
      return "Просрочено";
    default:
      return "Не начато";
  }
}

function formatDueDate(value: string | null) {
  if (!value) return "Без дедлайна";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Без дедлайна";
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function renderHomeworkList(items: HomeworkListItem[]) {
  if (items.length === 0) {
    return <StudentEmptyState title="Заданий пока нет" description="Когда преподаватель назначит домашнюю работу, она появится в этом разделе." />;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Link key={item.id} href={`/homework/${item.id}`}>
          <Card className="rounded-[2rem] border-[#dde2e9] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition hover:border-slate-300">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-black tracking-tight text-slate-900">{item.title}</h2>
                <p className="text-sm text-slate-600">{item.description ?? "Описание задания будет доступно позже."}</p>
                <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                  <span>{item.itemCount} активностей</span>
                  <span>{formatDueDate(item.dueAt)}</span>
                </div>
              </div>
              <span className="inline-flex min-h-10 items-center rounded-full bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">
                {formatStatus(item.status)}
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
