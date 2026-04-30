import type {
  LessonAttendanceStatus,
  ScheduleStudentOptionDto,
  ScheduleTeacherOptionDto,
  StaffScheduleFilters,
  StaffScheduleLessonDto,
  StaffSchedulePageData,
  StudentScheduleLessonDto,
  ScheduleLessonStatus
} from "@/lib/schedule/types";
import type { ScheduleActor } from "@/lib/schedule/server";

export type ScheduleLessonRow = {
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

export type LessonAttendanceRow = {
  id: string;
  schedule_lesson_id: string;
  student_id: string;
  teacher_id: string;
  status: LessonAttendanceStatus;
  marked_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type LessonOutcomeRow = {
  id: string;
  schedule_lesson_id: string;
  student_id: string;
  teacher_id: string;
  summary: string;
  covered_topics: string | null;
  mistakes_summary: string | null;
  next_steps: string | null;
  visible_to_student: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type ProfileLabelRow = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

export type EntityWithProfileRow = {
  id: string;
  profile_id: string;
  profiles: ProfileLabelRow | ProfileLabelRow[] | null;
};

export type ScheduleOptionLabelRpcRow = {
  id: string;
  label: string | null;
};

export type ScheduleLessonEnrichmentOptions = {
  studentOptions?: ScheduleStudentOptionDto[];
  teacherOptions?: ScheduleTeacherOptionDto[];
  studentLabelsById?: Map<string, string>;
  teacherLabelsById?: Map<string, string>;
  attendanceByLessonId?: Map<string, LessonAttendanceRow>;
  outcomeByLessonId?: Map<string, LessonOutcomeRow>;
};

export function buildDisplayName(
  profile: Pick<ProfileLabelRow, "display_name" | "first_name" | "last_name" | "email"> | undefined,
  fallback: string
) {
  if (!profile) return fallback;
  return profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email || fallback;
}

export function readProfileRelation(value: ProfileLabelRow | ProfileLabelRow[] | null | undefined): ProfileLabelRow | undefined {
  if (Array.isArray(value)) {
    return value[0] ?? undefined;
  }

  return value ?? undefined;
}

export function mapStudentRowsToOptionsWithProfiles(studentRows: EntityWithProfileRow[]): ScheduleStudentOptionDto[] {
  return studentRows.map((row) => ({
    id: row.id,
    label: buildDisplayName(readProfileRelation(row.profiles), "Ученик")
  }));
}

export function mapTeacherRowsToOptionsWithProfiles(teacherRows: EntityWithProfileRow[]): ScheduleTeacherOptionDto[] {
  return teacherRows.map((row) => ({
    id: row.id,
    label: buildDisplayName(readProfileRelation(row.profiles), "Преподаватель")
  }));
}

export function buildOptionsFromLessons(
  lessons: StaffScheduleLessonDto[],
  filters: StaffScheduleFilters,
  actor: ScheduleActor
): Pick<StaffSchedulePageData, "students" | "teachers"> {
  const studentsById = new Map<string, ScheduleStudentOptionDto>();
  const teachersById = new Map<string, ScheduleTeacherOptionDto>();

  for (const lesson of lessons) {
    if (lesson.studentId && !studentsById.has(lesson.studentId)) {
      studentsById.set(lesson.studentId, {
        id: lesson.studentId,
        label: lesson.studentName
      });
    }
    if (lesson.teacherId && !teachersById.has(lesson.teacherId)) {
      teachersById.set(lesson.teacherId, {
        id: lesson.teacherId,
        label: lesson.teacherName
      });
    }
  }

  if (filters.studentId && !studentsById.has(filters.studentId)) {
    studentsById.set(filters.studentId, {
      id: filters.studentId,
      label: "Ученик"
    });
  }

  if (actor.role === "teacher" && actor.teacherId && !teachersById.has(actor.teacherId)) {
    teachersById.set(actor.teacherId, {
      id: actor.teacherId,
      label: "Вы"
    });
  } else if (filters.teacherId && !teachersById.has(filters.teacherId)) {
    teachersById.set(filters.teacherId, {
      id: filters.teacherId,
      label: "Преподаватель"
    });
  }

  return {
    students: Array.from(studentsById.values()),
    teachers: Array.from(teachersById.values())
  };
}

export function mapScheduleLessonRows(
  rows: ScheduleLessonRow[],
  options: Required<Pick<ScheduleLessonEnrichmentOptions, "studentLabelsById" | "teacherLabelsById" | "attendanceByLessonId" | "outcomeByLessonId">>
): Array<StaffScheduleLessonDto | StudentScheduleLessonDto> {
  const { studentLabelsById, teacherLabelsById, attendanceByLessonId, outcomeByLessonId } = options;

  return rows.map((row) => {
    const attendance = attendanceByLessonId.get(row.id) ?? null;
    const outcome = outcomeByLessonId.get(row.id) ?? null;

    return {
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
      attendanceStatus: attendance?.status ?? null,
      hasOutcome: Boolean(outcome),
      studentVisibleOutcome: outcome?.visible_to_student
        ? {
            summary: outcome.summary,
            nextSteps: outcome.next_steps ?? null
          }
        : null
    };
  });
}

export function mapStudentPreviewRows(rows: ScheduleLessonRow[], teacherLabelsById: Map<string, string>): StudentScheduleLessonDto[] {
  return rows.map((row) => ({
    id: row.id,
    studentId: row.student_id,
    studentName: "Вы",
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
    attendanceStatus: null,
    hasOutcome: false,
    studentVisibleOutcome: null
  }));
}
