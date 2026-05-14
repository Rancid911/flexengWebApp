import { renderAdminStudentsDirectoryRoute } from "@/features/admin/server/admin-directory-routes";

export default async function AdminStudentsPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  return renderAdminStudentsDirectoryRoute({ searchParams });
}
