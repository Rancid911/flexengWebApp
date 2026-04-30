import { requireStaffAdminPage } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

import { AdminTeachersClient, type AdminTeacherDirectoryItem } from "./admin-teachers-client";

const TEACHERS_PAGE_SIZE = 5;

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

function parsePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function getDisplayName(profile: ProfileRow) {
  const displayName = profile.display_name?.trim();
  if (displayName) return displayName;
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return fullName || profile.email || `Teacher #${profile.id.slice(0, 8)}`;
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
  const from = (page - 1) * TEACHERS_PAGE_SIZE;
  const to = from + TEACHERS_PAGE_SIZE - 1;
  const supabase = createAdminClient();

  let profilesQuery = supabase
    .from("profiles")
    .select("id, first_name, last_name, display_name, email, phone, created_at", { count: "exact" })
    .eq("role", "teacher");

  if (query.length >= 3) {
    profilesQuery = profilesQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`);
  }

  const { data, error, count } = await profilesQuery
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch teachers: ${error.message}`);
  }

  const profiles = (data ?? []) as ProfileRow[];
  const profileIds = profiles.map((profile) => profile.id);
  let teacherRows: TeacherRow[] = [];

  if (profileIds.length > 0) {
    const teachersResponse = await supabase
      .from("teachers")
      .select("id, profile_id")
      .in("profile_id", profileIds);

    if (teachersResponse.error) {
      throw new Error(`Failed to fetch teacher records: ${teachersResponse.error.message}`);
    }

    teacherRows = (teachersResponse.data ?? []) as TeacherRow[];
  }

  const teacherByProfileId = new Map(teacherRows.map((teacher) => [teacher.profile_id, teacher]));
  const teachers: AdminTeacherDirectoryItem[] = profiles.flatMap((profile) => {
    const teacher = teacherByProfileId.get(profile.id);
    if (!teacher) return [];
    return [{
      teacherId: teacher.id,
      profileId: profile.id,
      displayName: getDisplayName(profile),
      email: profile.email,
      phone: profile.phone,
      createdAt: profile.created_at
    }];
  });
  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / TEACHERS_PAGE_SIZE));

  return (
    <AdminTeachersClient
      query={query}
      teachers={teachers}
      total={total}
      page={page}
      pageSize={TEACHERS_PAGE_SIZE}
      pageCount={pageCount}
    />
  );
}
