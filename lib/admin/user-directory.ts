import { AdminHttpError, paginated } from "@/lib/admin/http";
import type { AdminUserDto, AdminUserRole, PaginatedResponse, TeacherOptionDto } from "@/lib/admin/types";
import { hydrateUsersWithStudentDetails, loadTeacherOptions, toUserDto } from "@/lib/admin/users";
import { createAdminClient } from "@/lib/supabase/admin";

const validUserRoles = new Set<AdminUserRole>(["student", "teacher", "manager", "admin"]);

export type AdminTeacherDirectoryItem = {
  teacherId: string;
  profileId: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  createdAt: string | null;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name?: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
};

type TeacherRow = {
  id: string;
  profile_id: string;
};

function buildDisplayName(profile: ProfileRow) {
  const displayName = profile.display_name?.trim();
  if (displayName) return displayName;
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return fullName || profile.email || `Teacher #${profile.id.slice(0, 8)}`;
}

function resolveRange(page: number, pageSize: number) {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10;
  const from = (safePage - 1) * safePageSize;
  return { page: safePage, pageSize: safePageSize, from, to: from + safePageSize - 1 };
}

export async function listAdminUsers(input: {
  page: number;
  pageSize: number;
  q: string;
  roleFilter: AdminUserRole | "all";
}): Promise<PaginatedResponse<AdminUserDto>> {
  if (input.roleFilter !== "all" && !validUserRoles.has(input.roleFilter)) {
    throw new AdminHttpError(400, "VALIDATION_ERROR", "Invalid role filter");
  }

  const supabase = createAdminClient();
  const { page, pageSize, from, to } = resolveRange(input.page, input.pageSize);
  let query = supabase
    .from("profiles")
    .select("id, role, first_name, last_name, email, phone, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (input.q) {
    query = query.or(`first_name.ilike.%${input.q}%,last_name.ilike.%${input.q}%,email.ilike.%${input.q}%,phone.ilike.%${input.q}%,role.ilike.%${input.q}%`);
  }
  if (input.roleFilter !== "all") {
    query = query.eq("role", input.roleFilter);
  }

  const { data, error, count } = await query;
  if (error) throw new AdminHttpError(500, "USERS_FETCH_FAILED", "Failed to fetch users", error.message);

  const hydrated = await hydrateUsersWithStudentDetails(supabase, (data ?? []) as Record<string, unknown>[], "USERS_FETCH_FAILED");
  return paginated(hydrated.map((item) => toUserDto(item)), count ?? 0, page, pageSize);
}

export async function listAdminStudentsDirectoryPage(input: {
  query: string;
  page: number;
  pageSize: number;
}) {
  const supabase = createAdminClient();
  const { page, pageSize, from, to } = resolveRange(input.page, input.pageSize);
  let studentsQuery = supabase
    .from("profiles")
    .select("id, role, first_name, last_name, email, phone, created_at", { count: "exact" })
    .eq("role", "student");

  if (input.query.length >= 3) {
    studentsQuery = studentsQuery.or(`first_name.ilike.%${input.query}%,last_name.ilike.%${input.query}%,email.ilike.%${input.query}%,phone.ilike.%${input.query}%`);
  }

  const { data, error, count } = await studentsQuery.order("created_at", { ascending: false }).range(from, to);
  if (error) {
    throw new Error(`Failed to fetch students: ${error.message}`);
  }

  const students = (await hydrateUsersWithStudentDetails(supabase, (data ?? []) as Record<string, unknown>[], "ADMIN_STUDENTS_FETCH_FAILED")).map((row) =>
    toUserDto(row)
  );
  const total = count ?? 0;

  return {
    query: input.query,
    students,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function listAdminTeachersDirectoryPage(input: {
  query: string;
  page: number;
  pageSize: number;
}) {
  const supabase = createAdminClient();
  const { page, pageSize, from, to } = resolveRange(input.page, input.pageSize);
  let profilesQuery = supabase
    .from("profiles")
    .select("id, first_name, last_name, display_name, email, phone, created_at", { count: "exact" })
    .eq("role", "teacher");

  if (input.query.length >= 3) {
    profilesQuery = profilesQuery.or(`first_name.ilike.%${input.query}%,last_name.ilike.%${input.query}%,email.ilike.%${input.query}%,phone.ilike.%${input.query}%`);
  }

  const { data, error, count } = await profilesQuery.order("created_at", { ascending: false }).range(from, to);
  if (error) {
    throw new Error(`Failed to fetch teachers: ${error.message}`);
  }

  const profiles = (data ?? []) as ProfileRow[];
  const profileIds = profiles.map((profile) => profile.id);
  let teacherRows: TeacherRow[] = [];

  if (profileIds.length > 0) {
    const teachersResponse = await supabase.from("teachers").select("id, profile_id").in("profile_id", profileIds);
    if (teachersResponse.error) {
      throw new Error(`Failed to fetch teacher records: ${teachersResponse.error.message}`);
    }
    teacherRows = (teachersResponse.data ?? []) as TeacherRow[];
  }

  const teacherByProfileId = new Map(teacherRows.map((teacher) => [teacher.profile_id, teacher]));
  const teachers: AdminTeacherDirectoryItem[] = profiles.flatMap((profile) => {
    const teacher = teacherByProfileId.get(profile.id);
    if (!teacher) return [];
    return [
      {
        teacherId: teacher.id,
        profileId: profile.id,
        displayName: buildDisplayName(profile),
        email: profile.email,
        phone: profile.phone,
        createdAt: profile.created_at
      }
    ];
  });
  const total = count ?? 0;

  return {
    query: input.query,
    teachers,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function listAdminTeacherOptions(): Promise<TeacherOptionDto[]> {
  return await loadTeacherOptions(createAdminClient());
}
