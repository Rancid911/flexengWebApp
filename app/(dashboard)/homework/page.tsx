import { StudentPageHeader, StudentSubnav } from "@/app/(dashboard)/_components/student-page-primitives";
import { renderHomeworkList } from "./render-homework-list";
import { getHomeworkAssignments } from "@/lib/homework/queries";

export default async function HomeworkPage() {
  const items = await getHomeworkAssignments();
  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Домашнее задание" description="Все задания от преподавателя, дедлайны и текущий статус выполнения." />
      <StudentSubnav
        items={[
          { href: "/homework", label: "Все", active: true },
          { href: "/homework/active", label: "Активные" },
          { href: "/homework/completed", label: "Завершённые" },
          { href: "/homework/overdue", label: "Просроченные" }
        ]}
      />
      {renderHomeworkList(items)}
    </div>
  );
}
