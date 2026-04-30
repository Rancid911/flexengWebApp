import { createStudentPaymentReminderPopup, getPaymentReminderSettings, resolveStudentPaymentReminderForDashboard } from "@/lib/billing/reminders";
import type { StudentPaymentReminderPopup } from "@/lib/billing/types";
import {
  STUDENT_DASHBOARD_CORE_ACCESS_MODE,
  STUDENT_DASHBOARD_CORE_DATA_LOADING,
  STUDENT_DASHBOARD_PAYMENT_REMINDER_ACCESS_MODE,
  STUDENT_DASHBOARD_PAYMENT_REMINDER_DATA_LOADING
} from "@/lib/dashboard/student-dashboard.descriptors";
import {
  buildNextBestAction,
  buildRecentPracticeModuleSummaries,
  buildRecommendationCards,
  buildStudentDashboardFallback,
  buildStudentDashboardSummaryBlocks,
  buildStudentDashboardWordCounts,
  formatDrillCount,
  getPlacementStatusTone,
  getHomeworkTone,
  isPlacementAttempt,
  isSchemaMissing,
  mapPlacementStatus,
  mapDueDate,
  mapHomeworkStatus,
  readRelationRecord,
  safePercent,
  splitPlacementHomeworkAssignments
} from "@/lib/dashboard/student-dashboard.mappers";
import { createStudentDashboardRepository, type DashboardSupabaseClient } from "@/lib/dashboard/student-dashboard.repository";
import type {
  DashboardHomeworkAssignmentRow,
  DashboardRecommendationModuleRow,
  DashboardRecentPracticeActivity,
  DashboardRecentPracticeModuleSummary,
  DashboardStudentWordCountRow,
  StudentDashboardCoreData,
  StudentDashboardData,
  StudentDashboardSecondaryData,
  StudentDashboardWordCounts
} from "@/lib/dashboard/student-dashboard.types";
import { getStudentSchedulePreviewByStudentId } from "@/lib/schedule/queries";
import { measureServerTiming } from "@/lib/server/timing";
import { getCurrentStudentProfile } from "@/lib/students/current-student";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type StudentDashboardRepository = ReturnType<typeof createStudentDashboardRepository>;

export {
  STUDENT_DASHBOARD_CORE_ACCESS_MODE,
  STUDENT_DASHBOARD_CORE_DATA_LOADING,
  STUDENT_DASHBOARD_PAYMENT_REMINDER_ACCESS_MODE,
  STUDENT_DASHBOARD_PAYMENT_REMINDER_DATA_LOADING,
  buildStudentDashboardSummaryBlocks,
  buildStudentDashboardWordCounts
};

export type {
  StudentDashboardCoreData,
  StudentDashboardData,
  StudentDashboardSchedulePreviewLessonDto,
  StudentDashboardSecondaryData,
  StudentDashboardSummaryBlocks
} from "@/lib/dashboard/student-dashboard.types";

function normalizeHomeworkRows(response: { data: unknown; error: { message: string } | null }) {
  if (response.error && !isSchemaMissing(response.error.message)) return [];
  return (response.data ?? []) as DashboardHomeworkAssignmentRow[];
}

async function loadStudentDashboardWordCounts(
  studentId: string,
  repository?: StudentDashboardRepository
): Promise<StudentDashboardWordCounts> {
  const dashboardRepository = repository ?? createStudentDashboardRepository(await createClient());
  const response = await dashboardRepository.loadStudentWordRows(studentId);
  if (response.error && !isSchemaMissing(response.error.message)) {
    return { learningCount: 0, dueReviewCount: 0, masteredCount: 0 };
  }

  return buildStudentDashboardWordCounts((response.data ?? []) as DashboardStudentWordCountRow[]);
}

export async function getCompletedTeacherLessonsCountLast7Days(
  studentId: string,
  supabase: DashboardSupabaseClient,
  referenceDate = new Date()
) {
  const repository = createStudentDashboardRepository(supabase);
  const response = await repository.loadCompletedTeacherLessonsCountLast7Days(studentId, referenceDate);
  if (response.error) return 0;
  return response.count ?? 0;
}

export async function getSubmittedTestsCountLast7Days(
  studentId: string,
  supabase: DashboardSupabaseClient,
  referenceDate = new Date()
) {
  const repository = createStudentDashboardRepository(supabase);
  const response = await repository.loadSubmittedTestsCountLast7Days(studentId, referenceDate);
  if (response.error) return 0;
  return response.count ?? 0;
}

async function loadStudentPlacementSummary(
  studentId: string,
  repository?: StudentDashboardRepository
): Promise<StudentDashboardCoreData["placementTest"]> {
  const dashboardRepository = repository ?? createStudentDashboardRepository(await createClient());
  const placementResponse = await dashboardRepository.resolveCanonicalPlacementTest();
  const placementTest = placementResponse.error ? null : (placementResponse.data as { id?: string | null; title?: string | null } | null);
  if (!placementTest?.id) return null;

  const assignmentResponse = await dashboardRepository.loadPlacementAssignment(studentId, String(placementTest.id));
  if (assignmentResponse.error && !isSchemaMissing(assignmentResponse.error.message)) return null;
  const assignment = assignmentResponse.data as DashboardHomeworkAssignmentRow | null;
  if (!assignment) return null;

  const status = assignment.status ?? "not_started";
  const href = `/practice/activity/test_${placementTest.id}`;

  return {
    assigned: true,
    completed: status === "completed",
    title: placementTest.title ?? assignment.title ?? "Placement Test",
    subtitle: mapDueDate(assignment.due_at ?? null),
    href,
    status: mapPlacementStatus(status),
    statusTone: getPlacementStatusTone(status)
  };
}

async function loadRecentPracticeActivities(
  studentId: string,
  repository?: StudentDashboardRepository
): Promise<DashboardRecentPracticeActivity[]> {
  const dashboardRepository = repository ?? createStudentDashboardRepository(await createClient());
  const [lessonResponse, testResponse] = await Promise.all([
    dashboardRepository.loadRecentLessonActivities(studentId),
    dashboardRepository.loadRecentTestActivities(studentId)
  ]);
  const lessonRows = lessonResponse.error ? [] : ((lessonResponse.data ?? []) as Array<Record<string, unknown>>);
  const testRows = testResponse.error ? [] : ((testResponse.data ?? []) as Array<Record<string, unknown>>);

  const lessonActivities = lessonRows.flatMap((row) => {
    const lesson = readRelationRecord(
      row.lessons as { title?: string | null; module_id?: string | null } | Array<{ title?: string | null; module_id?: string | null }> | null | undefined
    );
    if (!lesson?.module_id || !row.updated_at) return [];

    return [
      {
        moduleId: String(lesson.module_id),
        activityTitle: String(lesson.title ?? "Урок"),
        happenedAt: String(row.updated_at)
      }
    ];
  });

  const testActivities = testRows.flatMap((row) => {
    const test = readRelationRecord(
      row.tests as
        | { title?: string | null; module_id?: string | null; assessment_kind?: string | null }
        | Array<{ title?: string | null; module_id?: string | null; assessment_kind?: string | null }>
        | null
        | undefined
    );
    if (!test?.module_id || !row.created_at || test.assessment_kind === "placement") return [];

    return [
      {
        moduleId: String(test.module_id),
        activityTitle: String(test.title ?? "Тренировка"),
        happenedAt: String(row.created_at)
      }
    ];
  });

  return [...lessonActivities, ...testActivities].sort((left, right) => right.happenedAt.localeCompare(left.happenedAt));
}

async function loadRecentPracticeModuleSummaries(
  studentId: string,
  repository?: StudentDashboardRepository
): Promise<DashboardRecentPracticeModuleSummary[]> {
  const dashboardRepository = repository ?? createStudentDashboardRepository(await createClient());
  const activities = await loadRecentPracticeActivities(studentId, dashboardRepository);
  const moduleIds = [...new Set(activities.map((item) => item.moduleId))].slice(0, 6);
  if (moduleIds.length === 0) return [];

  const modulesResponse = await dashboardRepository.loadRecommendationModules(moduleIds);
  const modules = modulesResponse.error ? [] : ((modulesResponse.data ?? []) as DashboardRecommendationModuleRow[]);
  return buildRecentPracticeModuleSummaries(activities, modules);
}

async function loadRecentPracticeRecommendationCards(
  studentId: string,
  repository?: StudentDashboardRepository
): Promise<StudentDashboardCoreData["recommendationCards"]> {
  const moduleSummaries = await loadRecentPracticeModuleSummaries(studentId, repository);
  return buildRecommendationCards(moduleSummaries);
}

async function loadRecentPracticeHero(
  studentId: string,
  repository?: StudentDashboardRepository
): Promise<{
  module: DashboardRecentPracticeModuleSummary;
  totalDrills: number;
  completedDrills: number;
  progressPercent: number;
} | null> {
  const dashboardRepository = repository ?? createStudentDashboardRepository(await createClient());
  const moduleSummary = (await loadRecentPracticeModuleSummaries(studentId, dashboardRepository))[0] ?? null;
  if (!moduleSummary) return null;

  const drillsResponse = await dashboardRepository.loadPublishedTrainerDrills(moduleSummary.moduleId);
  if (drillsResponse.error) {
    return {
      module: moduleSummary,
      totalDrills: 0,
      completedDrills: 0,
      progressPercent: 0
    };
  }

  const drillIds = ((drillsResponse.data ?? []) as Array<{ id?: string | null }>).flatMap((row) => (row.id ? [String(row.id)] : []));
  if (drillIds.length === 0) {
    return {
      module: moduleSummary,
      totalDrills: 0,
      completedDrills: 0,
      progressPercent: 0
    };
  }

  const attemptsResponse = await dashboardRepository.loadCompletedDrillAttempts(studentId, drillIds);
  const completedDrillIds = new Set(
    (attemptsResponse.error ? [] : ((attemptsResponse.data ?? []) as Array<{ test_id?: string | null }>)).flatMap((row) =>
      row.test_id ? [String(row.test_id)] : []
    )
  );

  return {
    module: moduleSummary,
    totalDrills: drillIds.length,
    completedDrills: completedDrillIds.size,
    progressPercent: safePercent((completedDrillIds.size / drillIds.length) * 100)
  };
}

function buildSummaryStats(input: {
  completedTeacherLessons7d: number;
  submittedTests7d: number;
  dueReviewCount: number;
}): StudentDashboardCoreData["summaryStats"] {
  return [
    { label: "Онлайн-уроки", value: String(input.completedTeacherLessons7d), chip: "за 7 дней", icon: "book", href: "/schedule" },
    { label: "Сделано тестов", value: String(input.submittedTests7d), chip: "за 7 дней", icon: "clipboardCheck", href: "/practice" },
    { label: "Слов в повторении", value: String(input.dueReviewCount), chip: "карточки", icon: "brain", href: "/words/review" }
  ];
}

function buildCoreDashboardPayload(input: {
  progressRows: Array<Record<string, unknown>>;
  attemptRows: Array<Record<string, unknown>>;
  activeCourses: Array<Record<string, unknown>>;
  homeworkRows: DashboardHomeworkAssignmentRow[];
  recommendationCards: StudentDashboardCoreData["recommendationCards"];
  wordCounts: { learningCount: number; dueReviewCount: number };
  completedTeacherLessons7d: number;
  submittedTests7d: number;
  schedulePreview: Pick<StudentDashboardCoreData, "nextScheduledLesson" | "upcomingScheduleLessons">;
  placementTest: StudentDashboardCoreData["placementTest"];
  recentPracticeHero: Awaited<ReturnType<typeof loadRecentPracticeHero>>;
}): StudentDashboardCoreData {
  const latestProgress = input.progressRows.find((row) => row.status === "in_progress") ?? input.progressRows[0] ?? null;
  const progressValues = input.progressRows.map((row) => Number(row.progress_percent ?? 0));
  const averageProgress = progressValues.length > 0 ? safePercent(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : 0;

  const submittedAttempts = input.attemptRows.filter(
    (row) =>
      row.status !== "in_progress" &&
      !isPlacementAttempt(
        row.tests as { assessment_kind?: unknown } | Array<{ assessment_kind?: unknown }> | null | undefined
      )
  );
  const averageScore =
    submittedAttempts.length > 0
      ? safePercent(submittedAttempts.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / submittedAttempts.length)
      : 0;

  const { regularAssignments: homeworkRows } = splitPlacementHomeworkAssignments(
    input.homeworkRows,
    input.placementTest?.href ? input.placementTest.href.replace("/practice/activity/test_", "") : null
  );
  const latestLesson = readRelationRecord(
    latestProgress?.lessons as
      | { title?: string | null; duration_minutes?: number | null }
      | Array<{ title?: string | null; duration_minutes?: number | null }>
      | null
      | undefined
  );
  const activeCourse = readRelationRecord(
    input.activeCourses[0]?.courses as { title?: string | null } | Array<{ title?: string | null }> | null | undefined
  );
  const nextBestAction = buildNextBestAction({
    homeworkRows,
    placementTest: input.placementTest,
    recommendationCards: input.recommendationCards,
    nextScheduledLesson: input.schedulePreview.nextScheduledLesson
  });

  const lessonTitle =
    input.recentPracticeHero?.module.moduleTitle
      ? input.recentPracticeHero.module.moduleTitle
      : typeof latestLesson?.title === "string"
      ? latestLesson.title
      : typeof activeCourse?.title === "string"
        ? activeCourse.title
        : "Практика";
  const lessonDuration = Number(typeof latestLesson?.duration_minutes === "number" ? latestLesson.duration_minutes : 0);
  const heroProgressValue = input.recentPracticeHero?.progressPercent ?? averageProgress;
  const heroSectionsCount = input.recentPracticeHero?.totalDrills ?? input.activeCourses.length;

  return {
    lessonOfTheDay: {
      title: lessonTitle,
      description:
        input.recentPracticeHero != null
          ? `Последняя активность: ${input.recentPracticeHero.module.lastActivityTitle}. Вернитесь к этой подтеме и продолжите практику.`
          : latestProgress != null
          ? "Вы уже начали эту тему. Можно продолжить с того места, на котором остановились."
          : "Подберите тему в практике и начните заниматься между уроками с преподавателем.",
      duration: `${Math.max(input.recentPracticeHero?.totalDrills ? input.recentPracticeHero.totalDrills * 5 : lessonDuration, 5)} минут`,
      progress: heroProgressValue,
      sectionsCount: heroSectionsCount,
      sectionsLabel: input.recentPracticeHero ? `${formatDrillCount(heroSectionsCount)} в теме` : undefined
    },
    progress: {
      value: heroProgressValue,
      label:
        input.recentPracticeHero != null
          ? input.recentPracticeHero.totalDrills > 0
            ? `Пройдено ${input.recentPracticeHero.completedDrills} из ${input.recentPracticeHero.totalDrills} дриллов`
            : "В этой подтеме пока нет опубликованных дриллов"
          : latestProgress != null
          ? "Прогресс собран по последним активностям и завершённым урокам"
          : "Как только появятся попытки и пройденные активности, здесь появится прогресс"
    },
    heroStats: [
      { label: "Точность", value: `${averageScore}%` },
      { label: "Попыток", value: String(submittedAttempts.length) },
      { label: "В изучении", value: String(input.wordCounts.learningCount) }
    ],
    homeworkCards: homeworkRows.slice(0, 2).map((item) => ({
      id: String(item.id),
      title: item.title ?? "Домашнее задание",
      subtitle: mapDueDate(item.due_at ?? null),
      status: mapHomeworkStatus(item.status ?? "not_started"),
      statusTone: getHomeworkTone(item.status ?? "not_started")
    })),
    activeHomeworkCount: homeworkRows.length,
    placementTest: input.placementTest,
    recommendationCards: input.recommendationCards,
    nextBestAction,
    summaryStats: buildSummaryStats({
      completedTeacherLessons7d: input.completedTeacherLessons7d,
      submittedTests7d: input.submittedTests7d,
      dueReviewCount: input.wordCounts.dueReviewCount
    }),
    nextScheduledLesson: input.schedulePreview.nextScheduledLesson,
    upcomingScheduleLessons: input.schedulePreview.upcomingScheduleLessons
  };
}

async function loadSchedulePreview(studentId: string) {
  return measureServerTiming("student-dashboard-preview", () =>
    getStudentSchedulePreviewByStudentId(studentId, 3).catch(() => ({
      nextLesson: null,
      upcomingLessons: []
    }))
  );
}

async function loadInitialDashboardCore(studentId: string, supabase: DashboardSupabaseClient): Promise<StudentDashboardCoreData> {
  const repository = createStudentDashboardRepository(supabase);
  const [progressResponse, attemptsResponse, enrollmentsResponse, homeworkResponse, wordCounts, placementTest, recentPracticeHero] = await Promise.all([
    repository.loadLessonProgress(studentId),
    repository.loadTestAttempts(studentId),
    repository.loadActiveCourseEnrollments(studentId),
    repository.loadActiveHomework(studentId),
    loadStudentDashboardWordCounts(studentId, repository),
    loadStudentPlacementSummary(studentId, repository),
    loadRecentPracticeHero(studentId, repository)
  ]);

  return buildCoreDashboardPayload({
    progressRows: progressResponse.error ? [] : (progressResponse.data ?? []),
    attemptRows: attemptsResponse.error ? [] : (attemptsResponse.data ?? []).filter((row) => !isPlacementAttempt(row.tests)),
    activeCourses: enrollmentsResponse.error ? [] : (enrollmentsResponse.data ?? []),
    homeworkRows: normalizeHomeworkRows(homeworkResponse),
    recommendationCards: [],
    wordCounts,
    completedTeacherLessons7d: 0,
    submittedTests7d: 0,
    schedulePreview: { nextScheduledLesson: null, upcomingScheduleLessons: [] },
    placementTest,
    recentPracticeHero
  });
}

export async function getStudentDashboardInitialData(): Promise<StudentDashboardCoreData> {
  return measureServerTiming("student-dashboard-core", async () => {
    void STUDENT_DASHBOARD_CORE_ACCESS_MODE;
    const profile = await getCurrentStudentProfile();
    const fallback = buildStudentDashboardFallback();

    if (!profile?.studentId) return fallback;
    const supabase = await createClient();
    return loadInitialDashboardCore(profile.studentId, supabase);
  });
}

export async function getStudentDashboardSecondaryData(): Promise<StudentDashboardSecondaryData> {
  return measureServerTiming("student-dashboard-secondary", async () => {
    void STUDENT_DASHBOARD_CORE_ACCESS_MODE;
    const profile = await getCurrentStudentProfile();

    if (!profile?.studentId) {
      return {
        recommendationCards: [],
        summaryStats: buildStudentDashboardFallback().summaryStats,
        nextScheduledLesson: null,
        upcomingScheduleLessons: []
      };
    }

    const studentId = profile.studentId;
    const supabase = await createClient();
    const repository = createStudentDashboardRepository(supabase);
    const [recommendationCards, wordCounts, completedTeacherLessons7d, submittedTests7d, schedulePreview] = await Promise.all([
      loadRecentPracticeRecommendationCards(studentId, repository),
      loadStudentDashboardWordCounts(studentId, repository),
      getCompletedTeacherLessonsCountLast7Days(studentId, supabase),
      getSubmittedTestsCountLast7Days(studentId, supabase),
      loadSchedulePreview(studentId)
    ]);

    return {
      recommendationCards,
      summaryStats: buildSummaryStats({ completedTeacherLessons7d, submittedTests7d, dueReviewCount: wordCounts.dueReviewCount }),
      nextScheduledLesson: schedulePreview.nextLesson,
      upcomingScheduleLessons: schedulePreview.upcomingLessons
    };
  });
}

export async function getStudentDashboardCoreData(): Promise<StudentDashboardCoreData> {
  return measureServerTiming("student-dashboard-core", async () => {
    void STUDENT_DASHBOARD_CORE_ACCESS_MODE;
    const profile = await getCurrentStudentProfile();
    const fallback = buildStudentDashboardFallback();

    if (!profile?.studentId) return fallback;
    const studentId = profile.studentId;

    const supabase = await createClient();
    const repository = createStudentDashboardRepository(supabase);
    const [progressResponse, attemptsResponse, enrollmentsResponse, homeworkResponse, recommendationCards, wordCounts, completedTeacherLessons7d, submittedTests7d, schedulePreview, placementTest, recentPracticeHero] = await Promise.all([
      repository.loadLessonProgress(studentId),
      repository.loadTestAttempts(studentId),
      repository.loadActiveCourseEnrollments(studentId),
      repository.loadActiveHomework(studentId),
      loadRecentPracticeRecommendationCards(studentId, repository),
      loadStudentDashboardWordCounts(studentId, repository),
      getCompletedTeacherLessonsCountLast7Days(studentId, supabase),
      getSubmittedTestsCountLast7Days(studentId, supabase),
      loadSchedulePreview(studentId),
      loadStudentPlacementSummary(studentId, repository),
      loadRecentPracticeHero(studentId, repository)
    ]);

    return buildCoreDashboardPayload({
      progressRows: progressResponse.error ? [] : (progressResponse.data ?? []),
      attemptRows: attemptsResponse.error ? [] : (attemptsResponse.data ?? []),
      activeCourses: enrollmentsResponse.error ? [] : (enrollmentsResponse.data ?? []),
      homeworkRows: normalizeHomeworkRows(homeworkResponse),
      recommendationCards,
      wordCounts,
      completedTeacherLessons7d,
      submittedTests7d,
      schedulePreview: {
        nextScheduledLesson: schedulePreview.nextLesson,
        upcomingScheduleLessons: schedulePreview.upcomingLessons
      },
      placementTest,
      recentPracticeHero
    });
  });
}

export async function getStudentDashboardPaymentReminder(): Promise<StudentPaymentReminderPopup | null> {
  return measureServerTiming("student-dashboard-payment-reminder", async () => {
    void STUDENT_DASHBOARD_PAYMENT_REMINDER_ACCESS_MODE;
    const profile = await getCurrentStudentProfile();
    if (!profile?.studentId) return null;
    const studentId = profile.studentId;

    try {
      const adminClient = createAdminClient();
      const reminderSettings = await getPaymentReminderSettings(adminClient);
      if (!reminderSettings.enabled) return null;

      const resolution = await resolveStudentPaymentReminderForDashboard(adminClient, studentId, reminderSettings.thresholdLessons);

      if (!resolution.shouldShowPopup) {
        return null;
      }

      const popup = createStudentPaymentReminderPopup(resolution);
      if (!popup) return null;

      return popup;
    } catch {
      return null;
    }
  });
}

export async function getStudentDashboardData(): Promise<StudentDashboardData> {
  return measureServerTiming("student-dashboard-data", async () => {
    const [core, paymentReminderPopup] = await Promise.all([getStudentDashboardCoreData(), getStudentDashboardPaymentReminder()]);

    return {
      ...core,
      paymentReminderPopup
    };
  });
}
