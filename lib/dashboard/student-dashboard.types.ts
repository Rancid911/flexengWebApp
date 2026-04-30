import type { StudentScheduleLessonDto } from "@/lib/schedule/types";
import type { StudentPaymentReminderPopup } from "@/lib/billing/types";

export type DashboardBadgeTone = "primary" | "warning" | "muted";

export type DashboardHomeworkAssignmentRow = {
  id: string | null;
  title: string | null;
  status: string | null;
  due_at: string | null;
  homework_items?: Array<{
    id: string;
    source_type: string | null;
    source_id: string | null;
  }> | null;
};

export type DashboardStudentWordCountRow = {
  status: string | null;
  next_review_at: string | null;
};

export type StudentDashboardWordCounts = {
  learningCount: number;
  dueReviewCount: number;
  masteredCount: number;
};

export type StudentDashboardSchedulePreviewLessonDto = Pick<
  StudentScheduleLessonDto,
  | "id"
  | "studentId"
  | "studentName"
  | "teacherId"
  | "teacherName"
  | "title"
  | "startsAt"
  | "endsAt"
  | "meetingUrl"
  | "comment"
  | "status"
  | "createdAt"
  | "updatedAt"
  | "attendanceStatus"
  | "hasOutcome"
  | "studentVisibleOutcome"
>;

export type StudentDashboardCoreData = {
  lessonOfTheDay: {
    title: string;
    description: string;
    duration: string;
    progress: number;
    sectionsCount: number;
    sectionsLabel?: string;
  };
  progress: {
    value: number;
    label: string;
  };
  heroStats: Array<{
    label: string;
    value: string;
  }>;
  homeworkCards: Array<{
    id: string;
    title: string;
    subtitle: string;
    status: string;
    statusTone: DashboardBadgeTone;
  }>;
  activeHomeworkCount: number;
  placementTest: {
    assigned: boolean;
    completed: boolean;
    title: string;
    subtitle: string;
    href: string | null;
    status: string;
    statusTone: DashboardBadgeTone;
  } | null;
  recommendationCards: Array<{
    id: string;
    title: string;
    subtitle: string;
    href: string;
  }>;
  nextBestAction: {
    label: string;
    title: string;
    description: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel?: string;
    secondaryHref?: string;
  };
  summaryStats: Array<{
    label: string;
    value: string;
    chip: string;
    icon: "sparkles" | "book" | "brain" | "clipboardCheck";
    href?: string;
  }>;
  nextScheduledLesson: StudentDashboardSchedulePreviewLessonDto | null;
  upcomingScheduleLessons: StudentDashboardSchedulePreviewLessonDto[];
};

export type StudentDashboardData = StudentDashboardCoreData & {
  paymentReminderPopup: StudentPaymentReminderPopup | null;
};

export type StudentDashboardSummaryBlocks = {
  lessonOfTheDay: StudentDashboardCoreData["lessonOfTheDay"];
  progress: StudentDashboardCoreData["progress"];
  heroStats: StudentDashboardCoreData["heroStats"];
  homeworkSummaryPreview: Pick<StudentDashboardCoreData, "homeworkCards" | "activeHomeworkCount">;
  recommendationsSummary: StudentDashboardCoreData["recommendationCards"];
  nextBestAction: StudentDashboardCoreData["nextBestAction"];
  schedulePreview: Pick<StudentDashboardCoreData, "nextScheduledLesson" | "upcomingScheduleLessons">;
};

export type StudentDashboardSecondaryData = Pick<
  StudentDashboardCoreData,
  "recommendationCards" | "summaryStats" | "nextScheduledLesson" | "upcomingScheduleLessons"
>;

export type DashboardRecentPracticeActivity = {
  moduleId: string;
  activityTitle: string;
  happenedAt: string;
};

export type DashboardRecentPracticeModuleSummary = {
  moduleId: string;
  moduleTitle: string;
  courseSlug: string;
  courseTitle: string;
  lastActivityTitle: string;
  lastActivityAt: string;
};

export type DashboardRecommendationModuleRow = {
  id: string | null;
  title: string | null;
  course_id: string | null;
  courses?: { slug?: string | null; title?: string | null } | Array<{ slug?: string | null; title?: string | null }> | null;
};
