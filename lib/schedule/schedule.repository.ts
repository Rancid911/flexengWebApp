import { createAdminClient } from "@/lib/supabase/admin";
import { ScheduleHttpError } from "@/lib/schedule/http";
import type { ScheduleActor } from "@/lib/schedule/server";
import type { StaffScheduleFilters, ScheduleLessonMutationPayload, ScheduleTeacherOptionDto, ScheduleStudentOptionDto } from "@/lib/schedule/types";
import {
  buildDisplayName,
  mapStudentRowsToOptionsWithProfiles,
  mapTeacherRowsToOptionsWithProfiles,
  readProfileRelation,
  type EntityWithProfileRow,
  type LessonAttendanceRow,
  type LessonOutcomeRow,
  type ScheduleLessonRow,
  type ScheduleOptionLabelRpcRow
} from "@/lib/schedule/mappers";

export type ScheduleRepositoryClient = ReturnType<typeof createAdminClient>;

const SCHEDULE_LESSON_SELECT = "id, student_id, teacher_id, title, starts_at, ends_at, meeting_url, comment, status, created_at, updated_at";
const PROFILE_LABEL_SELECT = "id, profile_id, profiles!inner(id, display_name, first_name, last_name, email)";

export function isSchemaMissing(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("does not exist") || normalized.includes("could not find") || normalized.includes("schema cache");
}

function isScheduleOptionRpcUnavailable(message: string) {
  return isSchemaMissing(message);
}

export function createScheduleRepository(client: ScheduleRepositoryClient = createAdminClient()) {
  return {
    async loadStudentLabelsByIds(studentIds: string[], options?: { preferRpc?: boolean }) {
      if (studentIds.length === 0) return new Map<string, string>();

      if (options?.preferRpc !== false && typeof client.rpc === "function") {
        const rpcResponse = await client.rpc("get_schedule_student_options", {
          p_student_ids: studentIds
        });

        if (!rpcResponse.error) {
          return new Map<string, string>(((rpcResponse.data ?? []) as ScheduleOptionLabelRpcRow[]).map((row) => [row.id, row.label ?? "Ученик"]));
        }

        if (!isScheduleOptionRpcUnavailable(rpcResponse.error.message)) {
          throw new ScheduleHttpError(500, "SCHEDULE_LOOKUP_FAILED", "Failed to load students", rpcResponse.error.message);
        }
      }

      const studentsResponse = await client.from("students").select(PROFILE_LABEL_SELECT).in("id", studentIds);
      if (studentsResponse.error) {
        throw new ScheduleHttpError(500, "SCHEDULE_LOOKUP_FAILED", "Failed to load students", studentsResponse.error.message);
      }

      const studentRows = (studentsResponse.data ?? []) as EntityWithProfileRow[];
      if (studentRows.length === 0) return new Map<string, string>();

      return new Map<string, string>(studentRows.map((row) => [row.id, buildDisplayName(readProfileRelation(row.profiles), "Ученик")]));
    },

    async loadTeacherLabelsByIds(teacherIds: string[]) {
      if (teacherIds.length === 0) return new Map<string, string>();

      if (typeof client.rpc === "function") {
        const rpcResponse = await client.rpc("get_schedule_teacher_options", {
          p_teacher_ids: teacherIds
        });

        if (!rpcResponse.error) {
          return new Map<string, string>(((rpcResponse.data ?? []) as ScheduleOptionLabelRpcRow[]).map((row) => [row.id, row.label ?? "Преподаватель"]));
        }

        if (!isScheduleOptionRpcUnavailable(rpcResponse.error.message)) {
          throw new ScheduleHttpError(500, "SCHEDULE_LOOKUP_FAILED", "Failed to load teachers", rpcResponse.error.message);
        }
      }

      const teachersResponse = await client.from("teachers").select(PROFILE_LABEL_SELECT).in("id", teacherIds);
      if (teachersResponse.error) {
        throw new ScheduleHttpError(500, "SCHEDULE_LOOKUP_FAILED", "Failed to load teachers", teachersResponse.error.message);
      }

      const teacherRows = (teachersResponse.data ?? []) as EntityWithProfileRow[];
      if (teacherRows.length === 0) return new Map<string, string>();

      return new Map<string, string>(teacherRows.map((row) => [row.id, buildDisplayName(readProfileRelation(row.profiles), "Преподаватель")]));
    },

    async loadAttendanceByLessonIds(lessonIds: string[]) {
      const attendanceByLessonId = new Map<string, LessonAttendanceRow>();
      if (lessonIds.length === 0) return attendanceByLessonId;

      const attendanceResponse = await client
        .from("lesson_attendance")
        .select("id, schedule_lesson_id, student_id, teacher_id, status, marked_at, created_at, updated_at")
        .in("schedule_lesson_id", lessonIds);

      if (attendanceResponse.error && !isSchemaMissing(attendanceResponse.error.message)) {
        throw new ScheduleHttpError(500, "SCHEDULE_FETCH_FAILED", "Failed to load lesson attendance", attendanceResponse.error.message);
      }

      for (const attendance of (attendanceResponse.data ?? []) as LessonAttendanceRow[]) {
        attendanceByLessonId.set(attendance.schedule_lesson_id, attendance);
      }

      return attendanceByLessonId;
    },

    async loadOutcomesByLessonIds(lessonIds: string[]) {
      const outcomeByLessonId = new Map<string, LessonOutcomeRow>();
      if (lessonIds.length === 0) return outcomeByLessonId;

      const outcomeResponse = await client
        .from("lesson_outcomes")
        .select("id, schedule_lesson_id, student_id, teacher_id, summary, covered_topics, mistakes_summary, next_steps, visible_to_student, created_at, updated_at")
        .in("schedule_lesson_id", lessonIds);

      if (outcomeResponse.error && !isSchemaMissing(outcomeResponse.error.message)) {
        throw new ScheduleHttpError(500, "SCHEDULE_FETCH_FAILED", "Failed to load lesson outcomes", outcomeResponse.error.message);
      }

      for (const outcome of (outcomeResponse.data ?? []) as LessonOutcomeRow[]) {
        outcomeByLessonId.set(outcome.schedule_lesson_id, outcome);
      }

      return outcomeByLessonId;
    },

    async searchProfileIds(search: string, limit: number) {
      const normalizedSearch = search.trim();
      if (!normalizedSearch) return null;

      const escapedSearch = normalizedSearch.replace(/[%_,]/g, (match) => `\\${match}`);
      const pattern = `%${escapedSearch}%`;
      const profilesResponse = await client
        .from("profiles")
        .select("id")
        .or(`display_name.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern}`)
        .limit(limit);

      if (profilesResponse.error) {
        throw new ScheduleHttpError(500, "SCHEDULE_LOOKUP_FAILED", "Failed to search profiles", profilesResponse.error.message);
      }

      return Array.from(new Set((profilesResponse.data ?? []).map((row) => String(row.id))));
    },

    async loadTeacherOptions(actor: ScheduleActor, teacherIdsOverride?: string[]): Promise<ScheduleTeacherOptionDto[]> {
      let teacherIds: string[] | null = teacherIdsOverride ?? null;
      if (actor.role === "teacher") {
        teacherIds = actor.teacherId ? [actor.teacherId] : [];
      }

      if (typeof client.rpc === "function") {
        const rpcResponse = await client.rpc("get_schedule_teacher_options", {
          p_teacher_ids: teacherIds
        });

        if (!rpcResponse.error) {
          return ((rpcResponse.data ?? []) as ScheduleOptionLabelRpcRow[]).map((row) => ({
            id: row.id,
            label: row.label ?? "Преподаватель"
          }));
        }

        if (!isScheduleOptionRpcUnavailable(rpcResponse.error.message)) {
          throw new ScheduleHttpError(500, "SCHEDULE_LOOKUP_FAILED", "Failed to load teachers", rpcResponse.error.message);
        }
      }

      let query = client.from("teachers").select(PROFILE_LABEL_SELECT).order("created_at", { ascending: true });
      if (teacherIds) {
        if (teacherIds.length === 0) return [];
        query = query.in("id", teacherIds);
      }

      const teachersResponse = await query;
      if (teachersResponse.error) {
        throw new ScheduleHttpError(500, "SCHEDULE_LOOKUP_FAILED", "Failed to load teachers", teachersResponse.error.message);
      }

      const teacherRows = (teachersResponse.data ?? []) as EntityWithProfileRow[];
      if (teacherRows.length === 0) return [];
      return mapTeacherRowsToOptionsWithProfiles(teacherRows);
    },

    async searchStudentOptions(actor: ScheduleActor, search: string | null | undefined, limit: number): Promise<ScheduleStudentOptionDto[]> {
      const effectiveLimit = Math.max(1, Math.min(limit, 100));
      let query = client.from("students").select(PROFILE_LABEL_SELECT).order("created_at", { ascending: true }).limit(effectiveLimit);

      if (actor.role === "student") {
        if (!actor.studentId) return [];
        query = query.eq("id", actor.studentId);
      } else if (actor.role === "teacher") {
        const accessibleIds = actor.accessibleStudentIds ?? [];
        if (accessibleIds.length === 0) return [];
        query = query.in("id", accessibleIds);
      }

      const matchingProfileIds = search ? await this.searchProfileIds(search, effectiveLimit) : null;
      if (matchingProfileIds) {
        if (matchingProfileIds.length === 0) return [];
        query = query.in("profile_id", matchingProfileIds);
      }

      const studentsResponse = await query;
      if (studentsResponse.error) {
        throw new ScheduleHttpError(500, "SCHEDULE_LOOKUP_FAILED", "Failed to search students", studentsResponse.error.message);
      }

      const studentRows = (studentsResponse.data ?? []) as EntityWithProfileRow[];
      if (studentRows.length === 0) return [];
      return mapStudentRowsToOptionsWithProfiles(studentRows);
    },

    async searchTeacherOptions(actor: ScheduleActor, search: string | null | undefined, limit: number): Promise<ScheduleTeacherOptionDto[]> {
      const effectiveLimit = Math.max(1, Math.min(limit, 100));
      let query = client.from("teachers").select(PROFILE_LABEL_SELECT).order("created_at", { ascending: true }).limit(effectiveLimit);

      if (actor.role === "teacher") {
        if (!actor.teacherId) return [];
        query = query.eq("id", actor.teacherId);
      }

      const matchingProfileIds = search ? await this.searchProfileIds(search, effectiveLimit) : null;
      if (matchingProfileIds) {
        if (matchingProfileIds.length === 0) return [];
        query = query.in("profile_id", matchingProfileIds);
      }

      const teachersResponse = await query;
      if (teachersResponse.error) {
        throw new ScheduleHttpError(500, "SCHEDULE_LOOKUP_FAILED", "Failed to search teachers", teachersResponse.error.message);
      }

      const teacherRows = (teachersResponse.data ?? []) as EntityWithProfileRow[];
      if (teacherRows.length === 0) return [];
      return mapTeacherRowsToOptionsWithProfiles(teacherRows);
    },

    async listScheduleLessonRows(args: {
      actor: ScheduleActor;
      filters: StaffScheduleFilters;
      startsAt: string;
      endsAt: string;
      agendaMode: boolean;
    }) {
      const { actor, filters, startsAt, endsAt, agendaMode } = args;
      let query = client.from("student_schedule_lessons").select(SCHEDULE_LESSON_SELECT).order("starts_at", { ascending: true }).limit(120);

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
        } else if (agendaMode) {
          query = query.eq("status", "scheduled");
        } else {
          query = query.neq("status", "canceled");
        }
        query = query.gte("starts_at", startsAt).lte("starts_at", endsAt);
      }

      const response = await query;
      if (response.error) {
        if (isSchemaMissing(response.error.message)) {
          return [];
        }
        throw new ScheduleHttpError(500, "SCHEDULE_FETCH_FAILED", "Failed to load schedule lessons", response.error.message);
      }

      return (response.data ?? []) as ScheduleLessonRow[];
    },

    async loadStudentSchedulePreviewRows(studentId: string, limit: number) {
      const response = await client
        .from("student_schedule_lessons")
        .select(SCHEDULE_LESSON_SELECT)
        .eq("student_id", studentId)
        .eq("status", "scheduled")
        .gt("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(Math.max(1, limit));

      if (response.error) {
        if (isSchemaMissing(response.error.message)) {
          return [];
        }
        throw new ScheduleHttpError(500, "SCHEDULE_FETCH_FAILED", "Failed to load student schedule preview", response.error.message);
      }

      return (response.data ?? []) as ScheduleLessonRow[];
    },

    async createScheduleLessonRow(payload: ScheduleLessonMutationPayload, actor: ScheduleActor) {
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

      const response = await client.from("student_schedule_lessons").insert(insertPayload).select(SCHEDULE_LESSON_SELECT).single();

      if (response.error) {
        throw new ScheduleHttpError(500, "SCHEDULE_CREATE_FAILED", "Failed to create schedule lesson", response.error.message);
      }

      return response.data as ScheduleLessonRow;
    },

    async getScheduleLessonRowById(id: string) {
      const response = await client.from("student_schedule_lessons").select(SCHEDULE_LESSON_SELECT).eq("id", id).maybeSingle();

      if (response.error) {
        throw new ScheduleHttpError(500, "SCHEDULE_FETCH_FAILED", "Failed to load schedule lesson", response.error.message);
      }

      if (!response.data) {
        throw new ScheduleHttpError(404, "SCHEDULE_NOT_FOUND", "Schedule lesson not found");
      }

      return response.data as ScheduleLessonRow;
    },

    async updateScheduleLessonRow(id: string, patch: Record<string, unknown>) {
      const response = await client.from("student_schedule_lessons").update(patch).eq("id", id).select(SCHEDULE_LESSON_SELECT).single();

      if (response.error) {
        throw new ScheduleHttpError(500, "SCHEDULE_UPDATE_FAILED", "Failed to update schedule lesson", response.error.message);
      }

      return response.data as ScheduleLessonRow;
    }
  };
}
