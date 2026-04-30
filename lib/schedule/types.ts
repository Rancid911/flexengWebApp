import type { UserRole } from "@/lib/auth/get-user-role";

export const scheduleLessonStatuses = ["scheduled", "canceled", "completed"] as const;
export const lessonAttendanceStatuses = ["scheduled", "completed", "missed_by_student", "missed_by_teacher", "canceled"] as const;

export type ScheduleLessonStatus = (typeof scheduleLessonStatuses)[number];
export type LessonAttendanceStatus = (typeof lessonAttendanceStatuses)[number];

export type ScheduleStudentOptionDto = {
  id: string;
  label: string;
};

export type ScheduleTeacherOptionDto = {
  id: string;
  label: string;
};

export type BaseScheduleLessonDto = {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  title: string;
  startsAt: string;
  endsAt: string;
  meetingUrl: string | null;
  comment: string | null;
  status: ScheduleLessonStatus;
  createdAt: string | null;
  updatedAt: string | null;
  attendanceStatus: LessonAttendanceStatus | null;
  hasOutcome: boolean;
  studentVisibleOutcome: {
    summary: string;
    nextSteps: string | null;
  } | null;
};

export type StudentScheduleLessonDto = BaseScheduleLessonDto;

export type StaffScheduleLessonDto = BaseScheduleLessonDto;

export type ScheduleLessonMutationPayload = {
  studentId: string;
  teacherId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  meetingUrl?: string | null;
  comment?: string | null;
  status?: ScheduleLessonStatus;
};

export type StaffScheduleFilters = {
  studentId?: string | null;
  teacherId?: string | null;
  status?: ScheduleLessonStatus | "all" | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

export type StudentSchedulePageData = {
  role: "student";
  nextLesson: StudentScheduleLessonDto | null;
  lessons: StudentScheduleLessonDto[];
};

export type StaffSchedulePageData = {
  role: Extract<UserRole, "teacher" | "manager" | "admin">;
  lessons: StaffScheduleLessonDto[];
  students: ScheduleStudentOptionDto[];
  teachers: ScheduleTeacherOptionDto[];
  filterCatalogDeferred?: boolean;
  filters: {
    studentId: string;
    teacherId: string;
    status: "all" | ScheduleLessonStatus;
    dateFrom: string;
    dateTo: string;
  };
  teacherLocked: boolean;
};

export type SchedulePageData = StudentSchedulePageData | StaffSchedulePageData;

export type StudentSchedulePreview = {
  nextLesson: StudentScheduleLessonDto | null;
  upcomingLessons: StudentScheduleLessonDto[];
};

export type ScheduleApiListResponse = {
  role: SchedulePageData["role"];
  lessons: Array<StudentScheduleLessonDto | StaffScheduleLessonDto>;
  students?: ScheduleStudentOptionDto[];
  teachers?: ScheduleTeacherOptionDto[];
  filterCatalogDeferred?: boolean;
};

export type ScheduleFilterCatalogResponse = {
  students: ScheduleStudentOptionDto[];
  teachers: ScheduleTeacherOptionDto[];
};

export type ScheduleFilterCatalogEntity = "students" | "teachers" | "all";

export type LessonOutcomeDto = {
  id: string;
  scheduleLessonId: string;
  studentId: string;
  teacherId: string;
  summary: string;
  coveredTopics: string | null;
  mistakesSummary: string | null;
  nextSteps: string | null;
  visibleToStudent: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type LessonAttendanceDto = {
  id: string;
  scheduleLessonId: string;
  studentId: string;
  teacherId: string;
  status: LessonAttendanceStatus;
  markedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
