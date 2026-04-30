import { StudentPageHeader, StudentSubnav } from "@/app/(workspace)/_components/student-page-primitives";
import { getHomeworkAssignments } from "@/lib/homework/queries";

import { renderHomeworkList } from "../render-homework-list";

export default async function HomeworkCompletedPage() {
  const items = await getHomeworkAssignments("completed");
  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Завершённые задания" description="Домашние задания, которые уже закрыты и сданы." />
      <StudentSubnav
        items={[
          { href: "/homework", label: "Все" },
          { href: "/homework/active", label: "Активные" },
          { href: "/homework/completed", label: "Завершённые", active: true },
          { href: "/homework/overdue", label: "Просроченные" }
        ]}
      />
      {renderHomeworkList(items)}
    </div>
  );
}
