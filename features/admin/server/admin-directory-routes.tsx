import { AdminStudentsClient } from "@/features/admin/components/students-directory/admin-students-client";
import { AdminTeachersClient } from "@/features/admin/components/teachers-directory/admin-teachers-client";
import { requireAdminPagePermission } from "@/lib/admin/auth";
import { listAdminStudentsDirectoryPage, listAdminTeachersDirectoryPage } from "@/lib/admin/user-directory";

const DIRECTORY_PAGE_SIZE = 5;

function parsePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

type DirectoryRouteProps = {
  searchParams?: Promise<{ q?: string; page?: string }>;
};

async function parseDirectorySearchParams(searchParams: DirectoryRouteProps["searchParams"]) {
  const params = (await searchParams) ?? {};
  return {
    query: (params.q ?? "").trim(),
    page: parsePage(params.page)
  };
}

export async function renderAdminStudentsDirectoryRoute({ searchParams }: DirectoryRouteProps) {
  await requireAdminPagePermission("students.view");
  const { query, page } = await parseDirectorySearchParams(searchParams);
  const pageData = await listAdminStudentsDirectoryPage({ query, page, pageSize: DIRECTORY_PAGE_SIZE });

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

export async function renderAdminTeachersDirectoryRoute({ searchParams }: DirectoryRouteProps) {
  await requireAdminPagePermission("teachers.view");
  const { query, page } = await parseDirectorySearchParams(searchParams);
  const pageData = await listAdminTeachersDirectoryPage({ query, page, pageSize: DIRECTORY_PAGE_SIZE });

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
