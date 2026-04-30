import { createHomeworkAssignmentsRepository } from "@/lib/homework/assignments.repository";
import { ScheduleHttpError } from "@/lib/schedule/http";
import {
  assertStaffAdminCapability,
  assertTeacherCapability,
  isTeacherScheduleActor,
  type ScheduleActor
} from "@/lib/schedule/server";
import type { StaffScheduleLessonDto } from "@/lib/schedule/types";
import { measureServerTiming } from "@/lib/server/timing";
import type { AccessMode } from "@/lib/supabase/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";
import { getTeacherDashboardWeekLessonBundle } from "@/lib/teacher-workspace/dashboard.queries";
import {
  createTeacherStudentRosterRepository,
  type TeacherStudentRosterProfileRow,
  type TeacherStudentRosterStudentRow,
  type TeacherStudentRosterLessonSummaryRow
} from "@/lib/teacher-workspace/student-roster.repository";
import type { TeacherStudentListItemDto } from "@/lib/teacher-workspace/types";

const TEACHER_STUDENT_ROSTER_ACCESS_MODE: AccessMode = "privileged";
export const TEACHER_DASHBOARD_STUDENT_ROSTER_DATA_LOADING = defineDataLoadingDescriptor({
  id: "teacher-dashboard-student-roster",
  owner: "@/lib/teacher-workspace/queries#getTeacherDashboardStudentRosterSummary",
  accessMode: TEACHER_STUDENT_ROSTER_ACCESS_MODE,
  loadLevel: "section",
  shape: "list",
  issues: [],
  notes: ["Teacher secondary section: scoped student roster summary and homework counters."]
});

function buildDisplayName(profile: TeacherStudentRosterProfileRow | undefined, fallback: string) {
  if (!profile) return fallback;
  return profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email || fallback;
}

function assertTeacherActor(actor: ScheduleActor) {
  try {
    assertTeacherCapability(actor);
    return;
  } catch {}

  try {
    assertStaffAdminCapability(actor);
    return;
  } catch {}

  throw new ScheduleHttpError(403, "FORBIDDEN", "Teacher workspace is not available");
}

function isTeacherScopedActor(actor: ScheduleActor) {
  return isTeacherScheduleActor(actor) && actor.accessibleStudentIds !== null;
}

async function loadProfilesMap(profileIds: string[], repository = createTeacherStudentRosterRepository()) {
  const response = await repository.loadProfiles(profileIds);
  if (response.error) {
    throw new ScheduleHttpError(500, "TEACHER_PROFILES_FAILED", "Failed to load profile labels", response.error.message);
  }
  return new Map<string, TeacherStudentRosterProfileRow>(((response.data ?? []) as TeacherStudentRosterProfileRow[]).map((profile) => [profile.id, profile]));
}

async function mapTeacherStudentRosterSummary(
  studentRows: TeacherStudentRosterStudentRow[],
  lessonDtos: StaffScheduleLessonDto[],
  homeworkRows: Array<{ student_id: string }>
) {
  const profilesMap = await loadProfilesMap(studentRows.map((row) => row.profile_id));
  const homeworkCountByStudent = new Map<string, number>();
  for (const row of homeworkRows) {
    homeworkCountByStudent.set(row.student_id, (homeworkCountByStudent.get(row.student_id) ?? 0) + 1);
  }

  return studentRows.map(
    (row): TeacherStudentListItemDto => ({
      studentId: row.id,
      studentName: buildDisplayName(profilesMap.get(row.profile_id), "Ученик"),
      email: profilesMap.get(row.profile_id)?.email ?? null,
      phone: profilesMap.get(row.profile_id)?.phone ?? null,
      englishLevel: row.english_level,
      targetLevel: row.target_level,
      nextLessonAt: lessonDtos.find((lesson) => lesson.studentId === row.id && lesson.status === "scheduled")?.startsAt ?? null,
      activeHomeworkCount: homeworkCountByStudent.get(row.id) ?? 0
    })
  );
}

export async function getTeacherDashboardStudentRosterSummary(
  actor: ScheduleActor,
  options?: {
    weekLessons?: StaffScheduleLessonDto[];
  }
) {
  return measureServerTiming("teacher-dashboard-student-roster", async () => {
    assertTeacherActor(actor);
    const adminClient = createAdminClient();
    const repository = createTeacherStudentRosterRepository(adminClient);
    const weekLessons = options?.weekLessons ?? (await getTeacherDashboardWeekLessonBundle(actor)).weekLessons;

    let scopedStudentIds: string[] | undefined;
    if (isTeacherScopedActor(actor)) {
      const lessonStudentIds = Array.from(new Set(weekLessons.map((lesson) => lesson.studentId).filter(Boolean)));
      scopedStudentIds = Array.from(new Set([...(actor.accessibleStudentIds ?? []), ...lessonStudentIds]));
      if (scopedStudentIds.length === 0) {
        return [];
      }
    }

    const homeworkRepository = createHomeworkAssignmentsRepository(adminClient);
    const [studentsResponse, homeworkResponse] = await Promise.all([
      repository.loadStudents(scopedStudentIds),
      homeworkRepository.listActiveDashboardHomeworkRows(scopedStudentIds)
    ]);
    if (studentsResponse.error) {
      throw new ScheduleHttpError(500, "TEACHER_DASHBOARD_FAILED", "Failed to load teacher students", studentsResponse.error.message);
    }
    if (homeworkResponse.error) {
      throw new ScheduleHttpError(500, "TEACHER_DASHBOARD_FAILED", "Failed to load teacher homework", homeworkResponse.error.message);
    }

    return mapTeacherStudentRosterSummary(
      (studentsResponse.data ?? []) as TeacherStudentRosterStudentRow[],
      weekLessons,
      ((homeworkResponse.data ?? []) as Array<{ id: string; student_id: string; title: string; due_at: string | null; status: string }>).map((row) => ({
        student_id: row.student_id
      }))
    );
  });
}

export async function listTeacherStudentsPage(
  actor: ScheduleActor,
  options: {
    q?: string;
    page: number;
    pageSize: number;
  }
): Promise<{ items: TeacherStudentListItemDto[]; total: number; page: number; pageSize: number; pageCount: number }> {
  return measureServerTiming("teacher-students-directory", async () => {
    assertTeacherCapability(actor);
    if (!isTeacherScheduleActor(actor)) {
      throw new ScheduleHttpError(403, "FORBIDDEN", "Teacher workspace is not available");
    }
    if (actor.accessibleStudentIds === null) {
      throw new ScheduleHttpError(403, "FORBIDDEN", "Teacher scope is not loaded");
    }

    const scopedStudentIds = Array.from(new Set(actor.accessibleStudentIds));
    const page = Math.max(1, options.page);
    const pageSize = Math.max(1, options.pageSize);
    if (scopedStudentIds.length === 0) {
      return { items: [], total: 0, page, pageSize, pageCount: 1 };
    }

    const adminClient = createAdminClient();
    const repository = createTeacherStudentRosterRepository(adminClient);
    const studentsResponse = await repository.loadStudents(scopedStudentIds);

    if (studentsResponse.error) {
      throw new ScheduleHttpError(500, "TEACHER_STUDENTS_FAILED", "Failed to load teacher students", studentsResponse.error.message);
    }

    const studentRows = ((studentsResponse.data ?? []) as TeacherStudentRosterStudentRow[]).filter((row) => scopedStudentIds.includes(row.id));
    const profilesMap = await loadProfilesMap(studentRows.map((row) => row.profile_id), repository);
    const normalizedQuery = (options.q ?? "").trim().toLowerCase();
    const filteredRows = studentRows
      .filter((row) => {
        if (normalizedQuery.length < 3) return true;
        const profile = profilesMap.get(row.profile_id);
        const searchable = [profile?.display_name, profile?.first_name, profile?.last_name, profile?.email, profile?.phone]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchable.includes(normalizedQuery);
      })
      .sort((left, right) => buildDisplayName(profilesMap.get(left.profile_id), "Ученик").localeCompare(buildDisplayName(profilesMap.get(right.profile_id), "Ученик"), "ru"));

    const total = filteredRows.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
    const pageStudentIds = pageRows.map((row) => row.id);

    let activeHomeworkRows: Array<{ student_id: string }> = [];
    let lessonRows: TeacherStudentRosterLessonSummaryRow[] = [];

    if (pageStudentIds.length > 0) {
      const homeworkRepository = createHomeworkAssignmentsRepository(adminClient);
      const [homeworkResponse, lessonsResponse] = await Promise.all([
        homeworkRepository.listActiveHomeworkRowsByStudentIds(pageStudentIds),
        repository.loadUpcomingLessonSummaries(pageStudentIds, new Date().toISOString())
      ]);

      if (homeworkResponse.error) {
        throw new ScheduleHttpError(500, "TEACHER_STUDENTS_FAILED", "Failed to load teacher homework", homeworkResponse.error.message);
      }
      if (lessonsResponse.error) {
        throw new ScheduleHttpError(500, "TEACHER_STUDENTS_FAILED", "Failed to load teacher lessons", lessonsResponse.error.message);
      }

      activeHomeworkRows = (homeworkResponse.data ?? []) as Array<{ student_id: string }>;
      lessonRows = (lessonsResponse.data ?? []) as TeacherStudentRosterLessonSummaryRow[];
    }

    const homeworkCountByStudent = new Map<string, number>();
    for (const row of activeHomeworkRows) {
      homeworkCountByStudent.set(row.student_id, (homeworkCountByStudent.get(row.student_id) ?? 0) + 1);
    }

    return {
      items: pageRows.map((row): TeacherStudentListItemDto => {
        const profile = profilesMap.get(row.profile_id);
        return {
          studentId: row.id,
          studentName: buildDisplayName(profile, "Ученик"),
          email: profile?.email ?? null,
          phone: profile?.phone ?? null,
          englishLevel: row.english_level,
          targetLevel: row.target_level,
          nextLessonAt: lessonRows.find((lesson) => lesson.student_id === row.id)?.starts_at ?? null,
          activeHomeworkCount: homeworkCountByStudent.get(row.id) ?? 0
        };
      }),
      total,
      page,
      pageSize,
      pageCount
    };
  });
}
