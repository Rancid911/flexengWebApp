import { requireStaffAdminPage } from "@/lib/admin/auth";
import { hydrateUsersWithStudentDetails, toUserDto } from "@/lib/admin/users";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const from = (page - 1) * STUDENTS_PAGE_SIZE;
  const to = from + STUDENTS_PAGE_SIZE - 1;
  const supabase = createAdminClient();
  let studentsQuery = supabase
    .from("profiles")
    .select("id, role, first_name, last_name, email, phone, created_at", { count: "exact" })
    .eq("role", "student");

  if (query.length >= 3) {
    studentsQuery = studentsQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`);
  }

  const { data, error, count } = await studentsQuery
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch students: ${error.message}`);
  }

  const students = (await hydrateUsersWithStudentDetails(supabase, (data ?? []) as Record<string, unknown>[], "ADMIN_STUDENTS_FETCH_FAILED")).map((row) => toUserDto(row));
  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / STUDENTS_PAGE_SIZE));

  return (
    <AdminStudentsClient
      query={query}
      students={students}
      total={total}
      page={page}
      pageSize={STUDENTS_PAGE_SIZE}
      pageCount={pageCount}
    />
  );
}
