import { requireStaffAdminPage } from "@/lib/admin/auth";
import { listAdminStudentsDirectoryPage } from "@/lib/admin/user-directory";

import { AdminStudentsClient } from "./admin-students-client";

const STUDENTS_PAGE_SIZE = 5;

function parsePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AdminStudentsPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  await requireStaffAdminPage();
  const params = (await searchParams) ?? {};
  const query = (params.q ?? "").trim();
  const page = parsePage(params.page);
  const pageData = await listAdminStudentsDirectoryPage({ query, page, pageSize: STUDENTS_PAGE_SIZE });

  return (
    <AdminStudentsClient
      query={pageData.query}
      students={pageData.students}
      total={pageData.total}
      page={pageData.page}
      pageSize={pageData.pageSize}
      pageCount={pageData.pageCount}
    />
  );
}
