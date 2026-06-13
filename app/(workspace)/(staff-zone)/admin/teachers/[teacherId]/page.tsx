import { notFound } from "next/navigation";

import { AdminTeacherProfileView } from "@/features/admin/components/teacher-dossier/admin-teacher-profile-view";
import { requireAdminPagePermission } from "@/lib/admin/auth";
import { loadAdminTeacherProfilePageData } from "@/lib/admin/teacher-profile";

export default async function AdminTeacherProfilePage({ params }: { params: Promise<{ teacherId: string }> }) {
  await requireAdminPagePermission("teachers.view");
  const { teacherId } = await params;
  const pageData = await loadAdminTeacherProfilePageData(teacherId);
  if (!pageData) {
    notFound();
  }

  return <AdminTeacherProfileView pageData={pageData} />;
}
