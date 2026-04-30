import { cache } from "react";
import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";
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
import {
  createTeacherDashboardAgendaRepository,
  type TeacherDashboardAgendaAttendanceRow,
  type TeacherDashboardAgendaLabelRow,
  type TeacherDashboardAgendaLessonRow,
  type TeacherDashboardAgendaOutcomeRow,
  type TeacherDashboardAgendaProfileRow,
  type TeacherDashboardAgendaRepositoryClient,
  type TeacherDashboardAgendaStudentRow,
  type TeacherDashboardAgendaTeacherRow
} from "@/lib/teacher-workspace/dashboard-agenda.repository";

const TEACHER_DASHBOARD_AGENDA_ACCESS_MODE: AccessMode = "privileged";

export const TEACHER_DASHBOARD_TODAY_AGENDA_DATA_LOADING = defineDataLoadingDescriptor({
  id: "teacher-dashboard-today-agenda",
  owner: "@/lib/teacher-workspace/queries#getTeacherDashboardTodayAgenda",
  accessMode: TEACHER_DASHBOARD_AGENDA_ACCESS_MODE,
  loadLevel: "section",
  shape: "list",
  issues: [],
  notes: ["Teacher critical section: today's scoped lessons."]
});

export const TEACHER_DASHBOARD_ATTENTION_QUEUE_DATA_LOADING = defineDataLoadingDescriptor({
  id: "teacher-dashboard-attention-queue",
  owner: "@/lib/teacher-workspace/queries#getTeacherDashboardAttentionQueue",
  accessMode: TEACHER_DASHBOARD_AGENDA_ACCESS_MODE,
  loadLevel: "section",
  shape: "list",
  issues: [],
  notes: ["Teacher critical section: completed lessons that still need follow-up."]
});

export type TeacherDashboardWeekLessonBundle = {
  todayLessons: StaffScheduleLessonDto[];
  weekLessons: StaffScheduleLessonDto[];
  attentionQueue: StaffScheduleLessonDto[];
};

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

function buildDisplayName(profile: TeacherDashboardAgendaProfileRow | undefined, fallback: string) {
  if (!profile) return fallback;
  return profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email || fallback;
}

function getTeacherDashboardWindow(now = new Date()) {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return {
    todayStart,
    todayEnd,
    weekEnd
  };
}

function buildTeacherDashboardWeekBundle(weekLessons: StaffScheduleLessonDto[], now = new Date()): TeacherDashboardWeekLessonBundle {
  const { todayStart, todayEnd } = getTeacherDashboardWindow(now);
  const todayStartTime = todayStart.getTime();
  const todayEndTime = todayEnd.getTime();
  const todayLessons: StaffScheduleLessonDto[] = [];

  for (const lesson of weekLessons) {
    const lessonStartsAt = new Date(lesson.startsAt).getTime();
    if (lessonStartsAt >= todayStartTime && lessonStartsAt <= todayEndTime) {
      todayLessons.push(lesson);
    }
  }

  return {
    todayLessons,
    weekLessons,
    attentionQueue: []
  };
}

function getTeacherDashboardBundleCacheKey(actor: ScheduleActor) {
  return JSON.stringify({
    role: actor.role,
    userId: actor.userId,
    teacherId: actor.teacherId ?? "",
    studentId: actor.studentId ?? ""
  });
}

async function loadProfilesMap(repository: ReturnType<typeof createTeacherDashboardAgendaRepository>, profileIds: string[]) {
  const response = await repository.loadProfilesByIds(profileIds);
  if (response.error) {
    throw new ScheduleHttpError(500, "PROFILE_FETCH_FAILED", "Failed to load profiles", response.error.message);
  }

  return new Map<string, TeacherDashboardAgendaProfileRow>(
    ((response.data ?? []) as TeacherDashboardAgendaProfileRow[]).map((profile) => [profile.id, profile])
  );
}

async function loadTeacherDashboardStudentLabels(repository: ReturnType<typeof createTeacherDashboardAgendaRepository>, studentIds: string[]) {
  if (studentIds.length === 0) return new Map<string, string>();

  const rpcResponse = await repository.loadStudentLabelRows(studentIds);
  if (!rpcResponse.error && rpcResponse.data) {
    return new Map<string, string>(
      ((rpcResponse.data ?? []) as TeacherDashboardAgendaLabelRow[]).map((row) => [row.id, row.label ?? "Ученик"])
    );
  }

  const studentsResponse = await repository.loadStudentsByIds(studentIds);
  if (studentsResponse.error) {
    throw new ScheduleHttpError(500, "PROFILE_FETCH_FAILED", "Failed to load students", studentsResponse.error.message);
  }

  const studentRows = (studentsResponse.data ?? []) as TeacherDashboardAgendaStudentRow[];
  const profilesMap = await loadProfilesMap(repository, Array.from(new Set(studentRows.map((student) => student.profile_id))));

  return new Map<string, string>(
    studentRows.map((student) => [student.id, buildDisplayName(profilesMap.get(student.profile_id), "Ученик")])
  );
}

async function loadTeacherDashboardTeacherLabels(repository: ReturnType<typeof createTeacherDashboardAgendaRepository>, teacherIds: string[]) {
  if (teacherIds.length === 0) return new Map<string, string>();

  const rpcResponse = await repository.loadTeacherLabelRows(teacherIds);
  if (!rpcResponse.error && rpcResponse.data) {
    return new Map<string, string>(
      ((rpcResponse.data ?? []) as TeacherDashboardAgendaLabelRow[]).map((row) => [row.id, row.label ?? "Преподаватель"])
    );
  }

  const teachersResponse = await repository.loadTeachersByIds(teacherIds);
  if (teachersResponse.error) {
    throw new ScheduleHttpError(500, "TEACHER_DASHBOARD_FAILED", "Failed to load teacher labels", teachersResponse.error.message);
  }

  const teacherRows = (teachersResponse.data ?? []) as TeacherDashboardAgendaTeacherRow[];
  const profilesMap = await loadProfilesMap(repository, Array.from(new Set(teacherRows.map((row) => row.profile_id))));

  return new Map<string, string>(
    teacherRows.map((row) => [row.id, buildDisplayName(profilesMap.get(row.profile_id), "Преподаватель")])
  );
}

async function loadTeacherDashboardAttendanceByLessonId(repository: ReturnType<typeof createTeacherDashboardAgendaRepository>, lessonIds: string[]) {
  const attendanceByLessonId = new Map<string, StaffScheduleLessonDto["attendanceStatus"]>();
  if (lessonIds.length === 0) return attendanceByLessonId;

  const response = await repository.loadAttendanceByLessonIds(lessonIds);
  if (response.error) {
    throw new ScheduleHttpError(500, "TEACHER_DASHBOARD_FAILED", "Failed to load lesson attendance", response.error.message);
  }

  for (const item of (response.data ?? []) as TeacherDashboardAgendaAttendanceRow[]) {
    attendanceByLessonId.set(item.schedule_lesson_id, item.status ?? null);
  }

  return attendanceByLessonId;
}

async function loadTeacherDashboardOutcomePresenceByLessonId(repository: ReturnType<typeof createTeacherDashboardAgendaRepository>, lessonIds: string[]) {
  const outcomeByLessonId = new Map<string, boolean>();
  if (lessonIds.length === 0) return outcomeByLessonId;

  const response = await repository.loadOutcomePresenceByLessonIds(lessonIds);
  if (response.error) {
    throw new ScheduleHttpError(500, "TEACHER_DASHBOARD_FAILED", "Failed to load lesson outcomes", response.error.message);
  }

  for (const item of (response.data ?? []) as TeacherDashboardAgendaOutcomeRow[]) {
    outcomeByLessonId.set(item.schedule_lesson_id, true);
  }

  return outcomeByLessonId;
}

async function mapTeacherDashboardLessons(
  actor: ScheduleActor,
  rows: TeacherDashboardAgendaLessonRow[],
  options: {
    includeAttendance?: boolean;
    includeOutcomes?: boolean;
  } = {},
  client?: TeacherDashboardAgendaRepositoryClient
) {
  if (rows.length === 0) return [];

  const repository = createTeacherDashboardAgendaRepository(client);
  const studentIds = Array.from(new Set(rows.map((row) => row.student_id)));
  const teacherIds = Array.from(new Set(rows.map((row) => row.teacher_id)));
  const lessonIds = rows.map((row) => row.id);
  const includeAttendance = options.includeAttendance ?? true;
  const includeOutcomes = options.includeOutcomes ?? true;

  const [studentLabelsById, teacherLabelsById, attendanceByLessonId, outcomePresenceByLessonId] = await Promise.all([
    measureServerTiming("teacher-dashboard-student-labels", () => loadTeacherDashboardStudentLabels(repository, studentIds)),
    measureServerTiming("teacher-dashboard-teacher-labels", () =>
      isTeacherScopedActor(actor)
        ? Promise.resolve(new Map(teacherIds.map((teacherId) => [teacherId, "Вы"])))
        : loadTeacherDashboardTeacherLabels(repository, teacherIds)
    ),
    includeAttendance
      ? measureServerTiming("teacher-dashboard-attendance", () => loadTeacherDashboardAttendanceByLessonId(repository, lessonIds))
      : Promise.resolve(new Map<string, StaffScheduleLessonDto["attendanceStatus"]>()),
    includeOutcomes
      ? measureServerTiming("teacher-dashboard-outcomes", () => loadTeacherDashboardOutcomePresenceByLessonId(repository, lessonIds))
      : Promise.resolve(new Map<string, boolean>())
  ]);

  return rows.map(
    (row): StaffScheduleLessonDto => ({
      id: row.id,
      studentId: row.student_id,
      studentName: studentLabelsById.get(row.student_id) ?? "Ученик",
      teacherId: row.teacher_id,
      teacherName: teacherLabelsById.get(row.teacher_id) ?? "Преподаватель",
      title: row.title,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      meetingUrl: row.meeting_url,
      comment: row.comment,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      attendanceStatus: includeAttendance ? attendanceByLessonId.get(row.id) ?? null : null,
      hasOutcome: includeOutcomes ? outcomePresenceByLessonId.get(row.id) ?? false : false,
      studentVisibleOutcome: null
    })
  );
}

const getTeacherDashboardWeekLessonBundleBase = cache(async (cacheKey: string, nowKey: string): Promise<TeacherDashboardWeekLessonBundle> =>
  measureServerTiming("teacher-dashboard-week-bundle", async () => {
    const actor = JSON.parse(cacheKey) as Pick<ScheduleActor, "role" | "userId" | "teacherId" | "studentId" | "accessibleStudentIds">;
    assertTeacherActor(actor as ScheduleActor);
    const now = new Date(nowKey);
    const { todayStart, weekEnd } = getTeacherDashboardWindow(now);

    if (actor.role === "teacher" && !actor.teacherId) {
      return {
        todayLessons: [],
        weekLessons: [],
        attentionQueue: []
      };
    }

    const repository = createTeacherDashboardAgendaRepository();
    const response = await measureServerTiming("teacher-dashboard-week-rows", async () =>
      repository.loadWeekLessonRows({
        todayStartIso: todayStart.toISOString(),
        weekEndIso: weekEnd.toISOString(),
        teacherId: actor.role === "teacher" ? actor.teacherId ?? undefined : undefined
      })
    );
    if (response.error) {
      throw new ScheduleHttpError(500, "TEACHER_DASHBOARD_FAILED", "Failed to load teacher week lessons", response.error.message);
    }

    const weekLessons = await measureServerTiming("teacher-dashboard-week-enrichment", async () =>
      mapTeacherDashboardLessons(
        actor as ScheduleActor,
        (response.data ?? []) as TeacherDashboardAgendaLessonRow[],
        {
          includeAttendance: false,
          includeOutcomes: false
        },
        repository.client
      )
    );

    return buildTeacherDashboardWeekBundle(weekLessons, now);
  })
);

const getTeacherDashboardAttentionQueueBase = cache(async (cacheKey: string, nowKey: string): Promise<StaffScheduleLessonDto[]> =>
  measureServerTiming("teacher-dashboard-attention-queue", async () => {
    const actor = JSON.parse(cacheKey) as Pick<ScheduleActor, "role" | "userId" | "teacherId" | "studentId" | "accessibleStudentIds">;
    assertTeacherActor(actor as ScheduleActor);
    const now = new Date(nowKey);
    const { todayStart, weekEnd } = getTeacherDashboardWindow(now);

    if (actor.role === "teacher" && !actor.teacherId) {
      return [];
    }

    const repository = createTeacherDashboardAgendaRepository();
    const response = await repository.loadCompletedLessonRows({
      todayStartIso: todayStart.toISOString(),
      weekEndIso: weekEnd.toISOString(),
      teacherId: actor.role === "teacher" ? actor.teacherId ?? undefined : undefined
    });
    if (response.error) {
      throw new ScheduleHttpError(500, "TEACHER_DASHBOARD_FAILED", "Failed to load teacher attention queue", response.error.message);
    }

    const lessons = await measureServerTiming("teacher-dashboard-attention-enrichment", async () =>
      mapTeacherDashboardLessons(
        actor as ScheduleActor,
        (response.data ?? []) as TeacherDashboardAgendaLessonRow[],
        {
          includeAttendance: false,
          includeOutcomes: true
        },
        repository.client
      )
    );

    return lessons.filter((lesson) => !lesson.hasOutcome);
  })
);

export async function getTeacherDashboardTodayAgenda(actor: ScheduleActor) {
  return measureServerTiming("teacher-dashboard-today-agenda", async () => (await getTeacherDashboardWeekLessonBundle(actor)).todayLessons);
}

export async function getTeacherDashboardAttentionQueue(actor: ScheduleActor) {
  assertTeacherActor(actor);
  const now = new Date();
  const nowKey = now.toISOString().slice(0, 10);
  return getTeacherDashboardAttentionQueueBase(getTeacherDashboardBundleCacheKey(actor), `${nowKey}T00:00:00.000Z`);
}

export async function getTeacherDashboardWeekAgenda(actor: ScheduleActor) {
  return measureServerTiming("teacher-dashboard-week-agenda", async () => (await getTeacherDashboardWeekLessonBundle(actor)).weekLessons);
}

export async function getTeacherDashboardWeekLessonBundle(actor: ScheduleActor): Promise<TeacherDashboardWeekLessonBundle> {
  assertTeacherActor(actor);
  const now = new Date();
  const nowKey = now.toISOString().slice(0, 10);
  return getTeacherDashboardWeekLessonBundleBase(getTeacherDashboardBundleCacheKey(actor), `${nowKey}T00:00:00.000Z`);
}
