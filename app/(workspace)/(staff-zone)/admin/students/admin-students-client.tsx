import { StudentsDirectoryClient, type StudentsDirectoryItem } from "@/app/(workspace)/_components/students-directory/students-directory-client";
import type { AdminUserDto } from "@/lib/admin/types";

type AdminStudentsClientProps = {
  query: string;
  students: AdminUserDto[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function getStudentDisplayName(student: AdminUserDto) {
  return `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || `User #${student.id.slice(0, 8)}`;
}

export function AdminStudentsClient({ query, students, total, page, pageSize, pageCount }: AdminStudentsClientProps) {
  const directoryStudents: StudentsDirectoryItem[] = students
    .filter((student) => student.student_id)
    .map((student) => ({
      id: student.id,
      studentId: student.student_id as string,
      displayName: getStudentDisplayName(student),
      email: student.email,
      phone: student.phone,
      englishLevel: student.english_level,
      targetLevel: student.target_level,
      assignedTeacherName: student.assigned_teacher_name,
      billingBalanceLabel: student.billing_balance_label,
      billingDebtLabel: student.billing_debt_label
    }));

  return <StudentsDirectoryClient mode="admin" basePath="/admin/students" query={query} students={directoryStudents} total={total} page={page} pageSize={pageSize} pageCount={pageCount} />;
}
