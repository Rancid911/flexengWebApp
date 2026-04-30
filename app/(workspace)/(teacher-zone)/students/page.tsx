import { redirect } from "next/navigation";

import { StudentsDirectoryClient, type StudentsDirectoryItem } from "@/app/(workspace)/_components/students-directory/students-directory-client";
import { measureServerTiming } from "@/lib/server/timing";
import { isStaffAdminScheduleActor, isStudentScheduleActor, isTeacherScheduleActor, requireSchedulePage } from "@/lib/schedule/server";
import { listTeacherStudentsPage } from "@/lib/teacher-workspace/queries";

const STUDENTS_PAGE_SIZE = 5;

function parsePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function TeacherStudentsPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  const actor = await measureServerTiming("teacher-students-context", () => requireSchedulePage());
  if (isStudentScheduleActor(actor)) {
    redirect("/dashboard");
  }
  if (isStaffAdminScheduleActor(actor)) {
    redirect("/admin/students");
  }
  if (!isTeacherScheduleActor(actor)) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const query = (params.q ?? "").trim();
  const page = parsePage(params.page);
  const result = await measureServerTiming("teacher-students-route-data", () =>
    listTeacherStudentsPage(actor, { q: query, page, pageSize: STUDENTS_PAGE_SIZE })
  );
  const students: StudentsDirectoryItem[] = result.items.map((student) => ({
    id: student.studentId,
    studentId: student.studentId,
    displayName: student.studentName,
    email: student.email,
    phone: student.phone,
    englishLevel: student.englishLevel,
    targetLevel: student.targetLevel,
    activeHomeworkCount: student.activeHomeworkCount,
    nextLessonAt: student.nextLessonAt
  }));

  return (
    <StudentsDirectoryClient
      mode="teacher"
      basePath="/students"
      query={query}
      students={students}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      pageCount={result.pageCount}
    />
  );
}
