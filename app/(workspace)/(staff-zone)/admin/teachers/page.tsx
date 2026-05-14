import { renderAdminTeachersDirectoryRoute } from "@/features/admin/server/admin-directory-routes";

export default async function AdminTeachersPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  return renderAdminTeachersDirectoryRoute({ searchParams });
}
