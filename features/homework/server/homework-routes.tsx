import { notFound } from "next/navigation";

import { HomeworkDetail } from "@/features/homework/components/homework-detail";
import { HomeworkFilteredListPage, HomeworkOverview } from "@/features/homework/components/homework-overview";
import { getHomeworkAssignmentDetail, getHomeworkAssignments, getHomeworkOverviewSummary } from "@/lib/homework/queries";

export async function renderHomeworkOverviewRoute() {
  const [summary, items] = await Promise.all([getHomeworkOverviewSummary(), getHomeworkAssignments()]);

  return <HomeworkOverview summary={summary} items={items} />;
}

export async function renderHomeworkDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assignment = await getHomeworkAssignmentDetail(id);
  if (!assignment) notFound();

  return <HomeworkDetail assignment={assignment} />;
}

export async function renderHomeworkActiveRoute() {
  const items = await getHomeworkAssignments("active");
  return <HomeworkFilteredListPage title="Активные задания" description="Домашние задания, которые ещё не завершены." activeHref="/homework/active" items={items} />;
}

export async function renderHomeworkCompletedRoute() {
  const items = await getHomeworkAssignments("completed");
  return <HomeworkFilteredListPage title="Завершённые задания" description="Домашние задания, которые уже закрыты и сданы." activeHref="/homework/completed" items={items} />;
}

export async function renderHomeworkOverdueRoute() {
  const items = await getHomeworkAssignments("overdue");
  return <HomeworkFilteredListPage title="Просроченные задания" description="Задания, по которым дедлайн уже прошёл." activeHref="/homework/overdue" items={items} />;
}
