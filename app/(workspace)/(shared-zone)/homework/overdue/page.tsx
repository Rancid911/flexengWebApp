import { StudentPageHeader, StudentSubnav } from "@/app/(workspace)/_components/student-page-primitives";
import { getHomeworkAssignments } from "@/lib/homework/queries";

import { renderHomeworkList } from "../render-homework-list";

export default async function HomeworkOverduePage() {
  const items = await getHomeworkAssignments("overdue");
  return (
    <div className="space-y-6 pb-8">
      <StudentPageHeader title="Просроченные задания" description="Задания, по которым дедлайн уже прошёл." />
      <StudentSubnav
        items={[
          { href: "/homework", label: "Все" },
          { href: "/homework/active", label: "Активные" },
          { href: "/homework/completed", label: "Завершённые" },
          { href: "/homework/overdue", label: "Просроченные", active: true }
        ]}
      />
      {renderHomeworkList(items)}
    </div>
  );
}
