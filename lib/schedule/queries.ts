import { createAdminClient } from "@/lib/supabase/admin";
import { ScheduleHttpError } from "@/lib/schedule/http";
import type {
  SchedulePageData,
  ScheduleStudentOptionDto,
  ScheduleTeacherOptionDto,
  StaffScheduleFilters,
  StaffScheduleLessonDto,
  StaffSchedulePageData,
  StudentScheduleLessonDto,
  StudentSchedulePageData,
  ScheduleLessonMutationPayload,
  ScheduleLessonStatus
} from "@/lib/schedule/types";
import { buildStudentSchedulePreview } from "@/lib/schedule/utils";
import type { ScheduleActor } from "@/lib/schedule/server";
import { assertScheduleWriteAccess, assertTeacherScope } from "@/lib/schedule/server";

type ScheduleLessonRow = {
  id: string;
  student_id: string;
  teacher_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  meeting_url: string | null;
  comment: string | null;
  status: ScheduleLessonStatus;
  created_at: string | null;
  updated_at: string | null;
};

type ProfileLabelRow = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

type StudentLabelRow = {
  id: string;
  profile_id: string;
};

type TeacherLabelRow = {
  id: string;
  profile_id: string;
};

function isSchemaMissing(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("does not exist") || normalized.includes("could not find") || normalized.includes("schema cache");
}

function buildDisplayName(
  profile: Pick<ProfileLabelRow, "display_name" | "first_name" | "last_name" | "email"> | undefined,
  fallback: string
) {
  if (!profile) return fallback;
  return profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email || fallback;
}

function compactFilters(filters: StaffScheduleFilters = {}) {
  return {
    studentId: filters.studentId ?? "",
    teacherId: filters.teacherId ?? "",
    status: (filters.status ?? "all") as "all" | ScheduleLessonStatus,
    dateFrom: filters.dateFrom ?? "",
    dateTo: filters.dateTo ?? ""
  };
}

function getTeacherScopedFilters(actor: ScheduleActor, filters: StaffScheduleFilters = {}) {
  if (actor.role !== "teacher") {
    return compactFilters(filters);
  }

  return {
    studentId: filters.studentId ?? "",
    teacherId: actor.teacherId ?? "",
    status: (filters.status ?? "all") as "all" | ScheduleLessonStatus,
    dateFrom: filters.dateFrom ?? "",
    dateTo: filters.dateTo ?? ""
  };
}

export function hasExplicitPastDateSelection(filters: StaffScheduleFilters, referenceDate = new Date()) {
  const todayKey = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, "0")}-${String(referenceDate.getDate()).padStart(2, "0")}`;

  return (typeof filters.dateFrom === "string" && filters.dateFrom < todayKey) || (typeof filters.dateTo === "string" && filters.dateTo < todayKey);
}

async function loadStudentOptions(
  adminClient: ReturnType<typeof createAdminClient>,
  actor: ScheduleActor,
  studentIdsOverride?: string[]
): Promise<ScheduleStudentOptionDto[]> {
  let studentIds: string[] | null = studentIdsOverride ?? null;
  if (actor.role === "student") {
    studentIds = actor.studentId ? [actor.studentId] : [];
  } else if (actor.role === "teacher") {
    studentIds = actor.accessibleStudentIds ?? [];
  }

  let query = adminClient.from("students").select("id, profile_id").order("created_at", { ascending: true });
  if (studentIds) {
    if (studentIds.length === 0) return [];
    query = query.in("id", studentIds);
  }

  const studentsResponse = await query;
  if (studentsResponse.error) {
    throw new ScheduleHttpError(500, "SCHEDULE_LOOKUP_FAILED", "Failed to load students", studentsResponse.error.message);
  }

  const studentRows = (studentsResponse.data ?? []) as StudentLabelRow[];
  if (studentRows.length === 0) return [];

  const profileIds = Array.from(new Set(studentRows.map((row) => row.profile_id)));
  const profilesResponse = await adminClient.from("profiles").select("id, display_name, first_name, last_name, email").in("id", profileIds);
  if (profilesResponse.error) {
    throw new ScheduleHttpError(500, "SCHEDULE_LOOKUP_FAILED", "Failed to load student profiles", profilesResponse.error.message);
  }

  const profilesById = new Map<string, ProfileLabelRow>();
  for (const profile of (profilesResponse.data ?? []) as ProfileLabelRow[]) {
    profilesById.set(profile.id, profile);
  }

  return studentRows.map((row) => ({
    id: row.id,
    label: buildDisplayName(profilesById.get(row.profile_id), "Ученик")
  }));
}

async function loadTeacherOptions(
  adminClient: ReturnType<typeof createAdminClient>,
  actor: ScheduleActor,
  teacherIdsOverride?: string[]
): Promise<ScheduleTeacherOptionDto[]> {
  let teacherIds: string[] | null = teacherIdsOverride ?? null;
  if (actor.role === "teacher") {
    teacherIds = actor.teacherId ? [actor.teacherId] : [];
  }

  let query = adminClient.from("teachers").select("id, profile_id").order("created_at", { ascending: true });
  if (teacherIds) {
    if (teacherIds.length === 0) return [];
    query = query.in("id", teacherIds);
  }

  const teachersResponse = await query;
  if (teachersResponse.error) {
    throw new ScheduleHttpError(500, "SCHEDULE_LOOKUP_FAILED", "Failed to load teachers", teachersResponse.error.message);
  }

  const teacherRows = (teachersResponse.data ?? []) as TeacherLabelRow[];
  if (teacherRows.length === 0) return [];

  const profileIds = Array.from(new Set(teacherRows.map((row) => row.profile_id)));
  const profilesResponse = await adminClient.from("profiles").select("id, display_name, first_name, last_name, email").in("id", profileIds);
  if (profilesResponse.error) {
    throw new ScheduleHttpError(500, "SCHEDULE_LOOKUP_FAILED", "Failed to load teacher profiles", profilesResponse.error.message);
  }

  const profilesById = new Map<string, ProfileLabelRow>();
  for (const profile of (profilesResponse.data ?? []) as ProfileLabelRow[]) {
    profilesById.set(profile.id, profile);
  }

  return teacherRows.map((row) => ({
    id: row.id,
    label: buildDisplayName(profilesById.get(row.profile_id), "Преподаватель")
  }));
}

async function mapScheduleLessons(adminClient: ReturnType<typeof createAdminClient>, rows: ScheduleLessonRow[]) {
  const studentIds = Array.from(new Set(rows.map((row) => row.student_id)));
  const teacherIds = Array.from(new Set(rows.map((row) => row.teacher_id)));
  const [studentOptions, teacherOptions] = await Promise.all([
    loadStudentOptions(adminClient, { userId: "", role: "admin", studentId: null, teacherId: null, accessibleStudentIds: null }, studentIds),
    loadTeacherOptions(adminClient, { userId: "", role: "admin", studentId: null, teacherId: null, accessibleStudentIds: null }, teacherIds)
  ]);

  const studentsById = new Map(studentOptions.map((item) => [item.id, item.label]));
  const teachersById = new Map(teacherOptions.map((item) => [item.id, item.label]));

  return rows.map((row) => ({
    id: row.id,
    studentId: row.student_id,
    studentName: studentsById.get(row.student_id) ?? "Ученик",
    teacherId: row.teacher_id,
    teacherName: teachersById.get(row.teacher_id) ?? "Преподаватель",
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    meetingUrl: row.meeting_url,
    comment: row.comment,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

async function listScheduleLessonRows(actor: ScheduleActor, filters: StaffScheduleFilters = {}) {
  const adminClient = createAdminClient();
  let query = adminClient
    .from("student_schedule_lessons")
    .select("id, student_id, teacher_id, title, starts_at, ends_at, meeting_url, comment, status, created_at, updated_at")
    .order("starts_at", { ascending: true });

  if (actor.role === "student") {
    if (!actor.studentId) return [];
    query = query.eq("student_id", actor.studentId).eq("status", "scheduled").gt("starts_at", new Date().toISOString());
  } else {
    if (actor.role === "teacher") {
      const accessibleIds = actor.accessibleStudentIds ?? [];
      if (accessibleIds.length === 0) return [];
      query = query.in("student_id", accessibleIds).eq("teacher_id", actor.teacherId ?? "");
    }
    if (filters.studentId) query = query.eq("student_id", filters.studentId);
    if (filters.teacherId) query = query.eq("teacher_id", filters.teacherId);
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    } else {
      query = query.neq("status", "canceled");
    }
    if (filters.dateFrom) {
      query = query.gte("starts_at", `${filters.dateFrom}T00:00:00.000Z`);
    } else if (!hasExplicitPastDateSelection(filters)) {
      query = query.gte("starts_at", new Date().toISOString());
    }
    if (filters.dateTo) query = query.lte("starts_at", `${filters.dateTo}T23:59:59.999Z`);
    if (filters.dateFrom && !hasExplicitPastDateSelection(filters)) {
      query = query.gte("starts_at", new Date().toISOString());
    }
  }

  const response = await query;
  if (response.error) {
    if (isSchemaMissing(response.error.message)) {
      return [];
    }
    throw new ScheduleHttpError(500, "SCHEDULE_FETCH_FAILED", "Failed to load schedule lessons", response.error.message);
  }

  return (response.data ?? []) as ScheduleLessonRow[];
}

export async function getSchedulePageData(actor: ScheduleActor, filters: StaffScheduleFilters = {}): Promise<SchedulePageData> {
  const adminClient = createAdminClient();
  const rows = await listScheduleLessonRows(actor, filters);
  const mapped = await mapScheduleLessons(adminClient, rows);

  if (actor.role === "student") {
    const preview = buildStudentSchedulePreview(mapped as StudentScheduleLessonDto[]);
    return {
      role: "student",
      nextLesson: preview.nextLesson,
      lessons: mapped as StudentScheduleLessonDto[]
    } satisfies StudentSchedulePageData;
  }

  const [students, teachers] = await Promise.all([loadStudentOptions(adminClient, actor), loadTeacherOptions(adminClient, actor)]);
  return {
    role: actor.role,
    lessons: mapped as StaffScheduleLessonDto[],
    students,
    teachers,
    filters: getTeacherScopedFilters(actor, filters),
    teacherLocked: actor.role === "teacher"
  } satisfies StaffSchedulePageData;
}

export async function getStudentSchedulePreviewByStudentId(studentId: string, limit = 3) {
  const adminClient = createAdminClient();
  const response = await adminClient
    .from("student_schedule_lessons")
    .select("id, student_id, teacher_id, title, starts_at, ends_at, meeting_url, comment, status, created_at, updated_at")
    .eq("student_id", studentId)
    .eq("status", "scheduled")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(Math.max(1, limit));

  if (response.error) {
    if (isSchemaMissing(response.error.message)) {
      return {
        nextLesson: null,
        upcomingLessons: []
      };
    }
    throw new ScheduleHttpError(500, "SCHEDULE_FETCH_FAILED", "Failed to load student schedule preview", response.error.message);
  }

  const mapped = await mapScheduleLessons(adminClient, (response.data ?? []) as ScheduleLessonRow[]);
  return buildStudentSchedulePreview(mapped as StudentScheduleLessonDto[], new Date(), limit);
}

export async function createScheduleLesson(actor: ScheduleActor, payload: ScheduleLessonMutationPayload) {
  assertScheduleWriteAccess(actor);
  assertTeacherScope(actor, payload);

  const adminClient = createAdminClient();
  const insertPayload = {
    student_id: payload.studentId,
    teacher_id: actor.role === "teacher" ? actor.teacherId : payload.teacherId,
    title: payload.title,
    starts_at: payload.startsAt,
    ends_at: payload.endsAt,
    meeting_url: payload.meetingUrl ?? null,
    comment: payload.comment ?? null,
    status: payload.status ?? "scheduled",
    created_by_profile_id: actor.userId,
    updated_by_profile_id: actor.userId
  };

  const response = await adminClient
    .from("student_schedule_lessons")
    .insert(insertPayload)
    .select("id, student_id, teacher_id, title, starts_at, ends_at, meeting_url, comment, status, created_at, updated_at")
    .single();

  if (response.error) {
    throw new ScheduleHttpError(500, "SCHEDULE_CREATE_FAILED", "Failed to create schedule lesson", response.error.message);
  }

  const mapped = await mapScheduleLessons(adminClient, [response.data as ScheduleLessonRow]);
  return mapped[0] as StaffScheduleLessonDto;
}

async function getScheduleLessonRowById(id: string) {
  const adminClient = createAdminClient();
  const response = await adminClient
    .from("student_schedule_lessons")
    .select("id, student_id, teacher_id, title, starts_at, ends_at, meeting_url, comment, status, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (response.error) {
    throw new ScheduleHttpError(500, "SCHEDULE_FETCH_FAILED", "Failed to load schedule lesson", response.error.message);
  }

  if (!response.data) {
    throw new ScheduleHttpError(404, "SCHEDULE_NOT_FOUND", "Schedule lesson not found");
  }

  return response.data as ScheduleLessonRow;
}

function assertLessonAccess(actor: ScheduleActor, row: ScheduleLessonRow) {
  if (actor.role === "student") {
    if (!actor.studentId || row.student_id !== actor.studentId) {
      throw new ScheduleHttpError(403, "FORBIDDEN", "Lesson is outside the student scope");
    }
    return;
  }

  if (actor.role === "teacher") {
    assertTeacherScope(actor, {
      studentId: row.student_id,
      teacherId: row.teacher_id
    });
  }
}

export async function updateScheduleLesson(
  actor: ScheduleActor,
  id: string,
  payload: Partial<ScheduleLessonMutationPayload>
) {
  assertScheduleWriteAccess(actor);
  const existing = await getScheduleLessonRowById(id);
  assertLessonAccess(actor, existing);

  const nextStudentId = payload.studentId ?? existing.student_id;
  const nextTeacherId = actor.role === "teacher" ? actor.teacherId : payload.teacherId ?? existing.teacher_id;
  assertTeacherScope(actor, {
    studentId: nextStudentId,
    teacherId: nextTeacherId
  });

  const patch: Record<string, unknown> = {
    updated_by_profile_id: actor.userId
  };
  if (payload.studentId !== undefined) patch.student_id = payload.studentId;
  if (nextTeacherId) patch.teacher_id = nextTeacherId;
  if (payload.title !== undefined) patch.title = payload.title;
  if (payload.startsAt !== undefined) patch.starts_at = payload.startsAt;
  if (payload.endsAt !== undefined) patch.ends_at = payload.endsAt;
  if (payload.meetingUrl !== undefined) patch.meeting_url = payload.meetingUrl;
  if (payload.comment !== undefined) patch.comment = payload.comment;
  if (payload.status !== undefined) patch.status = payload.status;

  const adminClient = createAdminClient();
  const response = await adminClient
    .from("student_schedule_lessons")
    .update(patch)
    .eq("id", id)
    .select("id, student_id, teacher_id, title, starts_at, ends_at, meeting_url, comment, status, created_at, updated_at")
    .single();

  if (response.error) {
    throw new ScheduleHttpError(500, "SCHEDULE_UPDATE_FAILED", "Failed to update schedule lesson", response.error.message);
  }

  const mapped = await mapScheduleLessons(adminClient, [response.data as ScheduleLessonRow]);
  return mapped[0] as StaffScheduleLessonDto;
}

export async function cancelScheduleLesson(actor: ScheduleActor, id: string) {
  return updateScheduleLesson(actor, id, { status: "canceled" });
}
