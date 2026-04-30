import type { LessonAttendanceStatus, LessonAttendanceDto, LessonOutcomeDto, StaffScheduleLessonDto } from "@/lib/schedule/types";
import type { StudentBillingSummary } from "@/lib/billing/types";
import type { UserRole } from "@/lib/auth/get-user-role";

export type TeacherStudentListItemDto = {
  studentId: string;
  studentName: string;
  email: string | null;
  phone: string | null;
  englishLevel: string | null;
  targetLevel: string | null;
  nextLessonAt: string | null;
  activeHomeworkCount: number;
};

export type TeacherDashboardData = {
  todayLessons: StaffScheduleLessonDto[];
  weekLessons: StaffScheduleLessonDto[];
  students: TeacherStudentListItemDto[];
};

export type TeacherStudentProfileHeaderSummary = {
  studentId: string;
  studentName: string;
  englishLevel: string | null;
  targetLevel: string | null;
  learningGoal: string | null;
};

export type TeacherStudentMistakeDto = {
  id: string;
  count: number;
  lastMistakeAt: string | null;
  testTitle: string | null;
  moduleTitle: string | null;
};

export type TeacherStudentNoteDto = {
  id: string;
  studentId: string;
  teacherId: string;
  body: string;
  visibility: "private" | "manager_visible";
  createdByProfileId: string | null;
  createdByName: string | null;
  createdByRole: UserRole | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type TeacherStudentHomeworkDto = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string | null;
  linkedLessonId: string | null;
  requiredCount: number;
  completedRequiredCount: number;
  items: TeacherStudentHomeworkItemDto[];
};

export type TeacherStudentHomeworkItemDto = {
  id: string;
  sourceType: string;
  sourceId: string;
  title: string;
  activityType: "trainer" | "test" | null;
  assessmentKind: "regular" | "placement";
  status: string;
  required: boolean;
  lastScore: number | null;
  lastSubmittedAt: string | null;
  recommendedLevel: string | null;
  recommendedBandLabel: string | null;
  placementSummary: {
    recommendedLevel: string | null;
    recommendedBandLabel: string | null;
    sectionScores: Array<{
      key: string;
      label: string;
      correctAnswers: number;
      totalQuestions: number;
    }>;
  } | null;
};

export type TeacherStudentPlacementSummaryDto = {
  assignmentId: string | null;
  status: "not_assigned" | "not_started" | "in_progress" | "overdue" | "completed";
  testId: string | null;
  title: string | null;
  attemptId: string | null;
  score: number | null;
  recommendedLevel: string | null;
  recommendedBandLabel: string | null;
  submittedAt: string | null;
};

export type TeacherStudentStandaloneHomeworkSummaryDto = {
  assignments: TeacherStudentHomeworkDto[];
};

export type TeacherStudentProfileData = {
  studentId: TeacherStudentProfileHeaderSummary["studentId"];
  studentName: TeacherStudentProfileHeaderSummary["studentName"];
  englishLevel: TeacherStudentProfileHeaderSummary["englishLevel"];
  targetLevel: TeacherStudentProfileHeaderSummary["targetLevel"];
  learningGoal: TeacherStudentProfileHeaderSummary["learningGoal"];
  notes: TeacherStudentNoteDto[];
  recentLessons: StaffScheduleLessonDto[];
  upcomingLessons: StaffScheduleLessonDto[];
  recentHomework: TeacherStudentHomeworkDto[];
  standaloneHomework: TeacherStudentHomeworkDto[];
  placementSummary: TeacherStudentPlacementSummaryDto | null;
  recentMistakes: TeacherStudentMistakeDto[];
  billingSummary: StudentBillingSummary | null;
  billingSummaryDeferred?: boolean;
};

export type TeacherLessonFollowupDto = {
  attendance: LessonAttendanceDto | null;
  outcome: LessonOutcomeDto | null;
  homeworkAssignment: {
    id: string;
    title: string;
    description: string | null;
    dueAt: string | null;
    status: string;
    completedAt: string | null;
    requiredCount: number;
    completedRequiredCount: number;
    testIds: string[];
    items: TeacherStudentHomeworkItemDto[];
  } | null;
};

export type TeacherAssignableTestOptionDto = {
  id: string;
  title: string;
  activityType: "trainer" | "test";
  assessmentKind: "regular" | "placement";
  cefrLevel: string | null;
  drillTopicKey: string | null;
  drillKind: "grammar" | "vocabulary" | "mixed" | null;
  lessonReinforcement: boolean;
};

export type TeacherLessonFollowupPayload = {
  attendanceStatus: LessonAttendanceStatus;
  summary: string;
  coveredTopics?: string | null;
  mistakesSummary?: string | null;
  nextSteps?: string | null;
  visibleToStudent?: boolean;
  homeworkTitle?: string | null;
  homeworkDescription?: string | null;
  homeworkDueAt?: string | null;
  homeworkTestIds?: string[];
};

export type TeacherNoteMutationPayload = {
  body: string;
  visibility?: "private" | "manager_visible";
};

export type TeacherStandaloneHomeworkCreatePayload = {
  title?: string | null;
  description?: string | null;
  dueAt?: string | null;
  activityIds: string[];
};
