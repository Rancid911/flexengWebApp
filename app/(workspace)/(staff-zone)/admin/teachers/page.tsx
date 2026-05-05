import { requireStaffAdminPage } from "@/lib/admin/auth";
import { listAdminTeachersDirectoryPage } from "@/lib/admin/user-directory";

import { AdminTeachersClient } from "./admin-teachers-client";

const TEACHERS_PAGE_SIZE = 5;

function parsePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AdminTeachersPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  await requireStaffAdminPage();
  const params = (await searchParams) ?? {};
  const query = (params.q ?? "").trim();
  const page = parsePage(params.page);
  const pageData = await listAdminTeachersDirectoryPage({ query, page, pageSize: TEACHERS_PAGE_SIZE });

  return (
    <AdminTeachersClient
      query={pageData.query}
      teachers={pageData.teachers}
      total={pageData.total}
      page={pageData.page}
      pageSize={pageData.pageSize}
      pageCount={pageData.pageCount}
    />
  );
}
