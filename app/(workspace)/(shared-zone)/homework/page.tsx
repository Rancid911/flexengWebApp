import { AlertCircle, CalendarClock, ClipboardList } from "lucide-react";

import { StudentPageHeader, StudentSubnav } from "@/app/(workspace)/_components/student-page-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { formatRuLongDateTime } from "@/lib/dates/format-ru-date";
import { getHomeworkAssignments, getHomeworkOverviewSummary } from "@/lib/homework/queries";
import { renderHomeworkList } from "./render-homework-list";

function formatNearestDeadline(value: string | null) {
  if (!value) return "Без дедлайна";
  return formatRuLongDateTime(value) || "Без дедлайна";
}

export default async function HomeworkPage() {
  const [summary, items] = await Promise.all([getHomeworkOverviewSummary(), getHomeworkAssignments()]);

  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Домашнее задание" description="Держите под контролем задания от преподавателя, дедлайны и то, что важно закончить до следующего урока." />
      <StudentSubnav
        items={[
          { href: "/homework", label: "Все", active: true },
          { href: "/homework/active", label: "Активные" },
          { href: "/homework/completed", label: "Завершённые" },
          { href: "/homework/overdue", label: "Просроченные" }
        ]}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={<ClipboardList className="h-4 w-4" />} label="Активных" value={String(summary.activeCount)} hint="задания в работе и не начатые" />
        <SummaryCard icon={<AlertCircle className="h-4 w-4" />} label="Просроченных" value={String(summary.overdueCount)} hint="их лучше закрыть в первую очередь" />
        <SummaryCard
          icon={<CalendarClock className="h-4 w-4" />}
          label="Ближайший дедлайн"
          value={summary.nearestDueAt ? formatNearestDeadline(summary.nearestDueAt) : "Нет срока"}
          hint={summary.nearestDueTitle ?? "сейчас нет срочных дедлайнов"}
        />
      </section>
      {renderHomeworkList(items)}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  hint
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="rounded-[1.8rem] border-[#dde2e9] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
      <CardContent className="space-y-3 p-5">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#1f7aff]">{icon}</span>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-black tracking-[-0.04em] text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{hint}</p>
      </CardContent>
    </Card>
  );
}
