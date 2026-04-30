import { measureServerTiming } from "@/lib/server/timing";
import { ScheduleHttpError } from "@/lib/schedule/http";
import {
  buildOptionsFromLessons,
  mapScheduleLessonRows,
  mapStudentPreviewRows,
  type LessonAttendanceRow,
  type LessonOutcomeRow,
  type ScheduleLessonEnrichmentOptions,
  type ScheduleLessonRow
} from "@/lib/schedule/mappers";
import { createScheduleRepository } from "@/lib/schedule/schedule.repository";
import {
  SCHEDULE_FILTER_CATALOG_DATA_LOADING,
  SCHEDULE_PAGE_DATA_LOADING,
  SCHEDULE_QUERY_ACCESS_MODE,
  STUDENT_SCHEDULE_PREVIEW_DATA_LOADING
} from "@/lib/schedule/descriptors";
import type {
  SchedulePageData,
  ScheduleFilterCatalogEntity,
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
import { buildStudentSchedulePreview, hasLessonEnded } from "@/lib/schedule/utils";
import type { ScheduleActor } from "@/lib/schedule/server";
import { assertScheduleWriteAccess, assertTeacherScope } from "@/lib/schedule/server";

export {
  SCHEDULE_FILTER_CATALOG_DATA_LOADING,
  SCHEDULE_PAGE_DATA_LOADING,
  SCHEDULE_QUERY_ACCESS_MODE,
  STUDENT_SCHEDULE_PREVIEW_DATA_LOADING
};
export type { ScheduleLessonRow };

const TEACHER_SCHEDULE_DEFAULT_WINDOW_DAYS = 21;
const STAFF_SCHEDULE_DEFAULT_WINDOW_DAYS = 14;
const SCHEDULE_FILTER_SEARCH_LIMIT = 50;

function assertCanMarkLessonCompleted(lesson: Pick<ScheduleLessonRow, "ends_at">) {
  if (hasLessonEnded(lesson.ends_at)) return;
  throw new ScheduleHttpError(
    409,
    "LESSON_NOT_FINISHED",
    "Урок можно отметить проведённым только после его окончания. Измените время урока, если он прошёл раньше."
  );
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

function hasExplicitFutureDateSelection(filters: StaffScheduleFilters) {
  return Boolean(filters.dateFrom || filters.dateTo);
}

export function resolveStudentOptionIds(actor: ScheduleActor, studentIdsOverride?: string[]) {
  if (studentIdsOverride) {
    return studentIdsOverride;
  }

  if (actor.role === "student") {
    return actor.studentId ? [actor.studentId] : [];
  }

  if (actor.role === "teacher") {
    return actor.accessibleStudentIds ?? [];
  }

  return null;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getStaffScheduleWindow(actor: ScheduleActor, filters: StaffScheduleFilters, now = new Date()) {
  const explicitPastSelection = hasExplicitPastDateSelection(filters, now);
  const baseStart = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00.000Z`) : new Date(now);
  const normalizedStart = explicitPastSelection ? baseStart : new Date(Math.max(baseStart.getTime(), now.getTime()));
  const defaultWindowDays = actor.role === "teacher" ? TEACHER_SCHEDULE_DEFAULT_WINDOW_DAYS : STAFF_SCHEDULE_DEFAULT_WINDOW_DAYS;
  const endDate = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999Z`) : addDays(normalizedStart, defaultWindowDays);

  return {
    startsAt: normalizedStart.toISOString(),
    endsAt: endDate.toISOString()
  };
}

async function mapScheduleLessons(rows: ScheduleLessonRow[], options?: ScheduleLessonEnrichmentOptions) {
  return measureServerTiming("schedule-enrichment", async () => {
    if (rows.length === 0) return [];
    const repository = createScheduleRepository();
    const studentIds = Array.from(new Set(rows.map((row) => row.student_id)));
    const teacherIds = Array.from(new Set(rows.map((row) => row.teacher_id)));
    const lessonIds = rows.map((row) => row.id);
    const [studentLabelsById, teacherLabelsById, attendanceByLessonId, outcomeByLessonId] = await Promise.all([
      measureServerTiming("schedule-label-resolution", () =>
        options?.studentLabelsById
          ? Promise.resolve(options.studentLabelsById)
          : options?.studentOptions
            ? Promise.resolve(new Map(options.studentOptions.map((item) => [item.id, item.label])))
            : repository.loadStudentLabelsByIds(studentIds)
      ),
      measureServerTiming("schedule-teacher-label-resolution", () =>
        options?.teacherLabelsById
          ? Promise.resolve(options.teacherLabelsById)
          : options?.teacherOptions
            ? Promise.resolve(new Map(options.teacherOptions.map((item) => [item.id, item.label])))
            : repository.loadTeacherLabelsByIds(teacherIds)
      ),
      measureServerTiming("schedule-attendance-load", () =>
        options?.attendanceByLessonId ? Promise.resolve(options.attendanceByLessonId) : repository.loadAttendanceByLessonIds(lessonIds)
      ),
      measureServerTiming("schedule-outcomes-load", () =>
        options?.outcomeByLessonId ? Promise.resolve(options.outcomeByLessonId) : repository.loadOutcomesByLessonIds(lessonIds)
      )
    ]);

    return mapScheduleLessonRows(rows, {
      studentLabelsById,
      teacherLabelsById,
      attendanceByLessonId,
      outcomeByLessonId
    });
  });
}

export async function mapStaffScheduleLessons(
  rows: ScheduleLessonRow[],
  options?: {
    studentOptions?: ScheduleStudentOptionDto[];
    teacherOptions?: ScheduleTeacherOptionDto[];
  }
) {
  return mapScheduleLessons(rows, options);
}

async function listScheduleLessonRows(actor: ScheduleActor, filters: StaffScheduleFilters = {}) {
  const window = getStaffScheduleWindow(actor, filters);
  const explicitPastSelection = hasExplicitPastDateSelection(filters);
  const explicitDateSelection = hasExplicitFutureDateSelection(filters);
  const agendaMode = !explicitPastSelection && !explicitDateSelection;
  return createScheduleRepository().listScheduleLessonRows({
    actor,
    filters,
    startsAt: window.startsAt,
    endsAt: window.endsAt,
    agendaMode
  });
}

export async function getSchedulePageData(actor: ScheduleActor, filters: StaffScheduleFilters = {}): Promise<SchedulePageData> {
  return getSchedulePageDataInternal(actor, filters, { includeFollowup: true });
}

type GetSchedulePageDataOptions = {
  includeFollowup?: boolean;
};

export async function getSchedulePageDataInternal(
  actor: ScheduleActor,
  filters: StaffScheduleFilters = {},
  options: GetSchedulePageDataOptions = {}
): Promise<SchedulePageData> {
  return measureServerTiming("schedule-page-data", async () => {
    const repository = createScheduleRepository();
    const includeFollowup = options.includeFollowup ?? true;

    if (actor.role === "student") {
      const rows = await measureServerTiming("schedule-list", () => listScheduleLessonRows(actor, filters));
      const mapped = await mapScheduleLessons(rows);
      const preview = buildStudentSchedulePreview(mapped as StudentScheduleLessonDto[]);
      return {
        role: "student",
        nextLesson: preview.nextLesson,
        lessons: mapped as StudentScheduleLessonDto[]
      } satisfies StudentSchedulePageData;
    }

    const rows = await measureServerTiming("schedule-list", () => listScheduleLessonRows(actor, filters));
    const lessonIds = rows.map((row) => row.id);
    const [attendanceByLessonId, outcomeByLessonId] = await Promise.all([
      measureServerTiming("schedule-shared-attendance", () =>
        includeFollowup ? repository.loadAttendanceByLessonIds(lessonIds) : Promise.resolve(new Map<string, LessonAttendanceRow>())
      ),
      measureServerTiming("schedule-shared-outcomes", () =>
        includeFollowup ? repository.loadOutcomesByLessonIds(lessonIds) : Promise.resolve(new Map<string, LessonOutcomeRow>())
      )
    ]);
    const mapped = await mapScheduleLessons(rows, {
      attendanceByLessonId,
      outcomeByLessonId
    });
    const { students, teachers } = await measureServerTiming("schedule-filter-catalog-deferred", async () =>
      buildOptionsFromLessons(mapped as StaffScheduleLessonDto[], filters, actor)
    );
    return {
      role: actor.role,
      lessons: mapped as StaffScheduleLessonDto[],
      students,
      teachers,
      filterCatalogDeferred: true,
      filters: getTeacherScopedFilters(actor, filters),
      teacherLocked: actor.role === "teacher"
    } satisfies StaffSchedulePageData;
  });
}

export async function getScheduleFilterCatalog(
  actor: ScheduleActor,
  options: {
    entity?: ScheduleFilterCatalogEntity;
    search?: string | null;
    limit?: number;
  } = {}
) {
  return measureServerTiming("schedule-filter-catalog", async () => {
    const repository = createScheduleRepository();
    const entity = options.entity ?? "all";
    const search = options.search ?? null;
    const limit = options.limit ?? SCHEDULE_FILTER_SEARCH_LIMIT;
    const [students, teachers] = await Promise.all([
      entity === "teachers" ? Promise.resolve([]) : measureServerTiming("schedule-full-filter-students", () => repository.searchStudentOptions(actor, search, limit)),
      entity === "students" ? Promise.resolve([]) : measureServerTiming("schedule-full-filter-teachers", () => repository.searchTeacherOptions(actor, search, limit))
    ]);

    return { students, teachers };
  });
}

export async function getStudentSchedulePreviewByStudentId(studentId: string, limit = 3) {
  return measureServerTiming("schedule-preview-load", async () => {
    const repository = createScheduleRepository();
    const rows = await repository.loadStudentSchedulePreviewRows(studentId, limit);
    if (rows.length === 0) {
      return {
        nextLesson: null,
        upcomingLessons: []
      };
    }

    const teacherOptions = await measureServerTiming("schedule-preview-teachers", () =>
      repository.loadTeacherOptions(
        { userId: "", role: "admin", studentId: null, teacherId: null, accessibleStudentIds: null },
        Array.from(new Set(rows.map((row) => row.teacher_id)))
      )
    );
    const teachersById = new Map(teacherOptions.map((item) => [item.id, item.label]));
    const previewLessons = mapStudentPreviewRows(rows, teachersById);

    return buildStudentSchedulePreview(previewLessons, new Date(), limit);
  });
}

export async function createScheduleLesson(actor: ScheduleActor, payload: ScheduleLessonMutationPayload) {
  assertScheduleWriteAccess(actor);
  assertTeacherScope(actor, payload);

  const row = await createScheduleRepository().createScheduleLessonRow(payload, actor);
  const mapped = await mapScheduleLessons([row]);
  return mapped[0] as StaffScheduleLessonDto;
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

export async function updateScheduleLesson(actor: ScheduleActor, id: string, payload: Partial<ScheduleLessonMutationPayload>) {
  assertScheduleWriteAccess(actor);
  const repository = createScheduleRepository();
  const existing = await repository.getScheduleLessonRowById(id);
  assertLessonAccess(actor, existing);

  const nextStudentId = payload.studentId ?? existing.student_id;
  const nextTeacherId = actor.role === "teacher" ? actor.teacherId : payload.teacherId ?? existing.teacher_id;
  assertTeacherScope(actor, {
    studentId: nextStudentId,
    teacherId: nextTeacherId
  });

  if (payload.status === "completed") {
    assertCanMarkLessonCompleted(existing);
  }

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

  const row = await repository.updateScheduleLessonRow(id, patch);
  const mapped = await mapScheduleLessons([row]);
  return mapped[0] as StaffScheduleLessonDto;
}

export async function cancelScheduleLesson(actor: ScheduleActor, id: string) {
  return updateScheduleLesson(actor, id, { status: "canceled" });
}
