import { StudentProfileView } from "@/app/(workspace)/_components/student-profile/student-profile-view";
import type { TeacherStudentProfileSections } from "@/lib/teacher-workspace/sections";

type Props = {
  sections: TeacherStudentProfileSections;
  canWriteNotes: boolean;
  canManageBilling: boolean;
  canAssignPlacement: boolean;
  canAssignHomework: boolean;
};

export function TeacherStudentProfileView(props: Props) {
  return <StudentProfileView {...props} backLink={{ href: "/dashboard", label: "Назад в дашборд" }} profileBasePath={`/students/${props.sections.header.studentId}`} />;
}
