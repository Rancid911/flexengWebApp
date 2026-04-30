import type {
  TeacherDashboardData,
  TeacherStudentMistakeDto,
  TeacherStudentProfileData,
  TeacherStudentProfileHeaderSummary,
  TeacherStudentHomeworkDto,
  TeacherStudentListItemDto,
  TeacherStudentNoteDto
} from "@/lib/teacher-workspace/types";
import type { StaffScheduleLessonDto } from "@/lib/schedule/types";
import type { StudentBillingSummary } from "@/lib/billing/types";

export type TeacherDashboardCriticalSections = {
  todayAgenda: StaffScheduleLessonDto[];
  weekAttentionQueue: StaffScheduleLessonDto[];
};

export type TeacherDashboardSecondarySections = {
  weekAgenda: StaffScheduleLessonDto[];
  studentRosterSummary: TeacherStudentListItemDto[];
};

export type TeacherStudentProfileSections = {
  header: TeacherStudentProfileHeaderSummary;
  notes: TeacherStudentNoteDto[];
  upcomingLessons: StaffScheduleLessonDto[];
  recentLessons: StaffScheduleLessonDto[];
  recentHomework: TeacherStudentHomeworkDto[];
  standaloneHomework: TeacherStudentHomeworkDto[];
  placementSummary: TeacherStudentProfileData["placementSummary"];
  recentMistakes: TeacherStudentMistakeDto[];
  billingSnapshot: StudentBillingSummary | null;
  billingSummaryDeferred: boolean;
};

export function composeTeacherDashboardData(args: {
  todayLessons: StaffScheduleLessonDto[];
  weekLessons: StaffScheduleLessonDto[];
  students: TeacherStudentListItemDto[];
}): TeacherDashboardData {
  return {
    todayLessons: args.todayLessons,
    weekLessons: args.weekLessons,
    students: args.students
  };
}

export function composeTeacherStudentProfileData(args: TeacherStudentProfileSections): TeacherStudentProfileData {
  return {
    studentId: args.header.studentId,
    studentName: args.header.studentName,
    englishLevel: args.header.englishLevel,
    targetLevel: args.header.targetLevel,
    learningGoal: args.header.learningGoal,
    notes: args.notes,
    recentLessons: args.recentLessons,
    upcomingLessons: args.upcomingLessons,
    recentHomework: args.recentHomework,
    standaloneHomework: args.standaloneHomework,
    placementSummary: args.placementSummary,
    recentMistakes: args.recentMistakes,
    billingSummary: args.billingSnapshot,
    billingSummaryDeferred: args.billingSummaryDeferred
  };
}

export function buildTeacherDashboardCriticalSections(data: TeacherDashboardData): TeacherDashboardCriticalSections {
  const weekAttentionQueue = [...data.todayLessons, ...data.weekLessons].filter(
    (lesson, index, lessons) =>
      lesson.status === "completed" &&
      !lesson.hasOutcome &&
      lessons.findIndex((candidate) => candidate.id === lesson.id) === index
  );

  return {
    todayAgenda: data.todayLessons,
    weekAttentionQueue
  };
}

export function buildTeacherDashboardSecondarySections(data: TeacherDashboardData): TeacherDashboardSecondarySections {
  return {
    weekAgenda: data.weekLessons,
    studentRosterSummary: data.students
  };
}

export function buildTeacherStudentProfileSections(data: TeacherStudentProfileData): TeacherStudentProfileSections {
  return {
    header: {
      studentId: data.studentId,
      studentName: data.studentName,
      englishLevel: data.englishLevel,
      targetLevel: data.targetLevel,
      learningGoal: data.learningGoal
    },
    notes: data.notes,
    upcomingLessons: data.upcomingLessons,
    recentLessons: data.recentLessons,
    recentHomework: data.recentHomework,
    standaloneHomework: data.standaloneHomework,
    placementSummary: data.placementSummary,
    recentMistakes: data.recentMistakes,
    billingSnapshot: data.billingSummary,
    billingSummaryDeferred: data.billingSummaryDeferred ?? false
  };
}
