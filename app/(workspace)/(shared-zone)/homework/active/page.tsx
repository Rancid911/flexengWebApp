import { StudentPageHeader, StudentSubnav } from "@/app/(workspace)/_components/student-page-primitives";
import { getHomeworkAssignments } from "@/lib/homework/queries";

import { renderHomeworkList } from "../render-homework-list";

export default async function HomeworkActivePage() {
  const items = await getHomeworkAssignments("active");
  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Активные задания" description="Домашние задания, которые ещё не завершены." />
      <StudentSubnav
        items={[
          { href: "/homework", label: "Все" },
          { href: "/homework/active", label: "Активные", active: true },
          { href: "/homework/completed", label: "Завершённые" },
          { href: "/homework/overdue", label: "Просроченные" }
        ]}
      />
      {renderHomeworkList(items)}
    </div>
  );
}
