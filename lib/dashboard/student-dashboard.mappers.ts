import { formatRuDayMonth } from "@/lib/dates/format-ru-date";
import type {
  DashboardBadgeTone,
  DashboardHomeworkAssignmentRow,
  DashboardRecommendationModuleRow,
  DashboardRecentPracticeActivity,
  DashboardRecentPracticeModuleSummary,
  DashboardStudentWordCountRow,
  StudentDashboardCoreData,
  StudentDashboardSchedulePreviewLessonDto,
  StudentDashboardSummaryBlocks,
  StudentDashboardWordCounts
} from "@/lib/dashboard/student-dashboard.types";

export function safePercent(value: number) {
  return Math.max(0, Math.min(Math.round(value), 100));
}

export function getHomeworkTone(status: string): DashboardBadgeTone {
  if (status === "completed") return "primary";
  if (status === "overdue") return "warning";
  return "muted";
}

export function mapHomeworkStatus(status: string) {
  switch (status) {
    case "completed":
      return "Завершено";
    case "in_progress":
      return "В процессе";
    case "overdue":
      return "Просрочено";
    default:
      return "Не начато";
  }
}

export function mapDueDate(value: string | null) {
  if (!value) return "Без дедлайна";
  const formatted = formatRuDayMonth(value);
  return formatted ? `Срок: ${formatted}` : "Без дедлайна";
}

export function isSchemaMissing(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("does not exist") || normalized.includes("could not find") || normalized.includes("schema cache");
}

function isActiveWordStatus(status: string | null | undefined) {
  return status === "learning" || status === "review" || status === "difficult";
}

export function buildStudentDashboardWordCounts(
  rows: DashboardStudentWordCountRow[],
  referenceDate = new Date()
): StudentDashboardWordCounts {
  const now = referenceDate.getTime();
  let learningCount = 0;
  let dueReviewCount = 0;
  let masteredCount = 0;

  for (const row of rows) {
    if (row.status === "mastered") {
      masteredCount += 1;
      continue;
    }

    if (!isActiveWordStatus(row.status)) continue;
    learningCount += 1;

    if (!row.next_review_at || new Date(row.next_review_at).getTime() <= now) {
      dueReviewCount += 1;
    }
  }

  return { learningCount, dueReviewCount, masteredCount };
}

export function readRelationRecord<T extends Record<string, unknown>>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function isPlacementAttempt(value: { assessment_kind?: unknown } | Array<{ assessment_kind?: unknown }> | null | undefined) {
  return readRelationRecord(value)?.assessment_kind === "placement";
}

function isPlacementAssignment(
  assignment: Pick<DashboardHomeworkAssignmentRow, "homework_items">,
  placementTestId: string | null
) {
  if (!placementTestId) return false;
  return (assignment.homework_items ?? []).some(
    (item) => item.source_type === "test" && String(item.source_id ?? "") === placementTestId
  );
}

export function splitPlacementHomeworkAssignments(
  assignments: DashboardHomeworkAssignmentRow[],
  placementTestId: string | null
) {
  const regularAssignments = assignments.filter((assignment) => !isPlacementAssignment(assignment, placementTestId));
  return {
    regularAssignments
  };
}

export function buildRecentPracticeModuleSummaries(activities: DashboardRecentPracticeActivity[], modules: DashboardRecommendationModuleRow[]) {
  const modulesById = new Map<string, DashboardRecommendationModuleRow>();
  for (const moduleRow of modules) {
    if (!moduleRow.id) continue;
    modulesById.set(String(moduleRow.id), moduleRow);
  }

  const seen = new Set<string>();

  return activities.flatMap((item) => {
    if (seen.has(item.moduleId)) return [];
    seen.add(item.moduleId);

    const moduleRow = modulesById.get(item.moduleId);
    const course = readRelationRecord(
      moduleRow?.courses as { slug?: string | null; title?: string | null } | Array<{ slug?: string | null; title?: string | null }> | null | undefined
    );
    if (!moduleRow?.id || !course?.slug) return [];

    return [
      {
        moduleId: String(moduleRow.id),
        moduleTitle: String(moduleRow.title ?? "Подтема"),
        courseSlug: String(course.slug),
        courseTitle: String(course.title ?? "Практика"),
        lastActivityTitle: item.activityTitle,
        lastActivityAt: item.happenedAt
      }
    ] satisfies DashboardRecentPracticeModuleSummary[];
  });
}

export function buildRecommendationCards(moduleSummaries: DashboardRecentPracticeModuleSummary[]) {
  return moduleSummaries.slice(0, 2).map((item) => ({
    id: `recommendation-module-${item.moduleId}`,
    title: item.moduleTitle,
    subtitle: `Последняя активность: ${item.lastActivityTitle}`,
    href: `/practice/topics/${item.courseSlug}/${item.moduleId}`
  }));
}

export function formatDrillCount(value: number) {
  const absValue = Math.abs(value);
  const mod10 = absValue % 10;
  const mod100 = absValue % 100;

  if (mod10 === 1 && mod100 !== 11) return `${value} дрилл`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${value} дрилла`;
  return `${value} дриллов`;
}

export function buildNextBestAction(input: {
  homeworkRows: Array<{
    id: string | null;
    title: string | null;
    status: string | null;
    due_at: string | null;
  }>;
  placementTest: StudentDashboardCoreData["placementTest"];
  recommendationCards: StudentDashboardCoreData["recommendationCards"];
  nextScheduledLesson: StudentDashboardSchedulePreviewLessonDto | null;
}) {
  if (input.placementTest && !input.placementTest.completed && input.placementTest.href) {
    return {
      label: "Важно",
      title: "Пройдите тест на уровень",
      description: "Преподаватель назначил диагностический тест. Он поможет точнее определить ваш текущий уровень и подобрать следующий шаг.",
      primaryLabel: "Пройти тест на уровень",
      primaryHref: input.placementTest.href
    };
  }

  const overdueHomework = input.homeworkRows.find((item) => item.status === "overdue");
  if (overdueHomework) {
    return {
      label: "Срочно",
      title: "Закройте просроченное домашнее задание",
      description: `${overdueHomework.title ?? "Домашнее задание"} требует внимания. Лучше завершить его до следующего урока.`,
      primaryLabel: "Сделать домашнее задание",
      primaryHref: "/homework",
      secondaryLabel: "Открыть практику",
      secondaryHref: "/practice"
    };
  }

  const activeHomework = input.homeworkRows.find((item) => item.status === "in_progress" || item.status === "not_started");
  if (activeHomework) {
    return {
      label: "Важно",
      title: "Сделайте домашнее задание",
      description: `${activeHomework.title ?? "Домашнее задание"} уже ждёт вас. Начните с него, чтобы не копить хвосты.`,
      primaryLabel: "Сделать домашнее задание",
      primaryHref: "/homework",
      secondaryLabel: "Открыть практику",
      secondaryHref: "/practice"
    };
  }

  const recommendation = input.recommendationCards[0];
  if (recommendation) {
    return {
      label: "Рекомендуем",
      title: recommendation.title.length > 44 ? "Продолжите практику" : recommendation.title,
      description: recommendation.subtitle,
      primaryLabel: "Открыть практику",
      primaryHref: "/practice/recommended",
      secondaryLabel: "Открыть прогресс",
      secondaryHref: "/progress/weak-points"
    };
  }

  if (input.nextScheduledLesson) {
    return {
      label: "На сегодня",
      title: "Подготовьтесь к следующему уроку",
      description: `Скоро занятие "${input.nextScheduledLesson.title}". Освежите тему и повторите слова перед уроком.`,
      primaryLabel: "Открыть практику",
      primaryHref: "/practice",
      secondaryLabel: "Открыть расписание",
      secondaryHref: "/schedule"
    };
  }

  return {
    label: "Старт",
    title: "Продолжите обучение",
    description: "Выберите тему, начните тренироваться и постепенно собирайте свой прогресс между уроками.",
    primaryLabel: "Открыть практику",
    primaryHref: "/practice",
    secondaryLabel: "Открыть слова",
    secondaryHref: "/words/review"
  };
}

export function buildStudentDashboardFallback(): StudentDashboardCoreData {
  return {
    lessonOfTheDay: {
      title: "Практика",
      description: "Когда появится активный прогресс по темам, здесь будет показано последнее место, где вы остановились.",
      duration: "5 минут",
      progress: 0,
      sectionsCount: 0
    },
    progress: {
      value: 0,
      label: "Пока нет завершённых активностей"
    },
    heroStats: [
      { label: "Точность", value: "0%" },
      { label: "Попыток", value: "0" },
      { label: "В изучении", value: "0" }
    ],
    homeworkCards: [],
    activeHomeworkCount: 0,
    placementTest: null,
    recommendationCards: [],
    nextBestAction: {
      label: "Старт",
      title: "Продолжите обучение",
      description: "Выберите тему, начните тренироваться и постепенно собирайте свой прогресс между уроками.",
      primaryLabel: "Открыть практику",
      primaryHref: "/practice",
      secondaryLabel: "Сделать домашнее задание",
      secondaryHref: "/homework"
    },
    summaryStats: [
      { label: "Онлайн-уроки", value: "0", chip: "за 7 дней", icon: "book", href: "/schedule" },
      { label: "Сделано тестов", value: "0", chip: "за 7 дней", icon: "clipboardCheck", href: "/practice" },
      { label: "Слов в повторении", value: "0", chip: "карточки", icon: "brain", href: "/words/review" }
    ],
    nextScheduledLesson: null,
    upcomingScheduleLessons: []
  };
}

export function getPlacementStatusTone(status: string): DashboardBadgeTone {
  if (status === "completed") return "primary";
  if (status === "in_progress" || status === "overdue") return "warning";
  return "muted";
}

export function mapPlacementStatus(status: string) {
  switch (status) {
    case "completed":
      return "Завершён";
    case "in_progress":
      return "В работе";
    case "overdue":
      return "Просрочен";
    default:
      return "Назначен";
  }
}

export function buildStudentDashboardSummaryBlocks(core: StudentDashboardCoreData): StudentDashboardSummaryBlocks {
  return {
    lessonOfTheDay: core.lessonOfTheDay,
    progress: core.progress,
    heroStats: core.heroStats,
    homeworkSummaryPreview: {
      homeworkCards: core.homeworkCards,
      activeHomeworkCount: core.activeHomeworkCount
    },
    recommendationsSummary: core.recommendationCards,
    nextBestAction: core.nextBestAction,
    schedulePreview: {
      nextScheduledLesson: core.nextScheduledLesson,
      upcomingScheduleLessons: core.upcomingScheduleLessons
    }
  };
}
