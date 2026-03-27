import { createClient } from "@/lib/supabase/server";
import { getStudentSchedulePreviewByStudentId } from "@/lib/schedule/queries";
import type { StudentScheduleLessonDto } from "@/lib/schedule/types";
import { getCurrentStudentProfile } from "@/lib/students/current-student";

type DashboardBadgeTone = "primary" | "warning" | "muted";

export type StudentDashboardData = {
  lessonOfTheDay: {
    title: string;
    description: string;
    duration: string;
    progress: number;
    sectionsCount: number;
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
  recommendationCards: Array<{
    id: string;
    title: string;
    subtitle: string;
  }>;
  summaryStats: Array<{
    label: string;
    value: string;
    chip: string;
    icon: "sparkles" | "book" | "brain";
  }>;
  nextScheduledLesson: StudentScheduleLessonDto | null;
  upcomingScheduleLessons: StudentScheduleLessonDto[];
};

function safePercent(value: number) {
  return Math.max(0, Math.min(Math.round(value), 100));
}

function getHomeworkTone(status: string): DashboardBadgeTone {
  if (status === "completed") return "primary";
  if (status === "overdue") return "warning";
  return "muted";
}

function mapHomeworkStatus(status: string) {
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

function mapDueDate(value: string | null) {
  if (!value) return "Без дедлайна";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Без дедлайна";
  return `Срок: ${new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long" }).format(date)}`;
}

function isSchemaMissing(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("does not exist") || normalized.includes("could not find") || normalized.includes("schema cache");
}

function readRelationRecord<T extends Record<string, unknown>>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function buildRecommendationCards(
  rows: Array<{
    mistake_count: number | null;
    module_id: string | null;
    test_id: string | null;
  }>
) {
  const seen = new Set<string>();

  return rows.flatMap((item, index) => {
    const sourceId = item.module_id ?? item.test_id;
    const sourceType = item.module_id ? "module" : item.test_id ? "test" : "fallback";
    const dedupeKey = `${sourceType}:${sourceId ?? index}`;

    if (seen.has(dedupeKey)) {
      return [];
    }

    seen.add(dedupeKey);

    return [
      {
        id: `recommendation-${dedupeKey}-${index}`,
        title: `Повторить тему ${index + 1}`,
        subtitle: `Найдено ошибок: ${Number(item.mistake_count ?? 1)}`
      }
    ];
  });
}

export async function getStudentDashboardData(): Promise<StudentDashboardData> {
  const profile = await getCurrentStudentProfile();
  const fallback: StudentDashboardData = {
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
      { label: "Слов", value: "0" }
    ],
    homeworkCards: [],
    recommendationCards: [],
    summaryStats: [
      { label: "Сегодня", value: "0 мин", chip: "старт", icon: "sparkles" },
      { label: "Сделано тестов", value: "0", chip: "за месяц", icon: "book" },
      { label: "Слов в повторении", value: "0", chip: "карточки", icon: "brain" }
    ],
    nextScheduledLesson: null,
    upcomingScheduleLessons: []
  };

  if (!profile?.studentId) return fallback;

  const supabase = await createClient();

  const [progressResponse, attemptsResponse, enrollmentsResponse, homeworkResponse, mistakesResponse, wordsResponse, schedulePreview] = await Promise.all([
    supabase
      .from("student_lesson_progress")
      .select("status, progress_percent, updated_at, lesson_id, lessons(title, duration_minutes, module_id)")
      .eq("student_id", profile.studentId)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("student_test_attempts")
      .select("status, score, created_at, submitted_at")
      .eq("student_id", profile.studentId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("student_course_enrollments")
      .select("status, courses(title)")
      .eq("student_id", profile.studentId)
      .eq("status", "active")
      .limit(4),
    supabase
      .from("homework_assignments")
      .select("id, title, status, due_at")
      .eq("student_id", profile.studentId)
      .in("status", ["not_started", "in_progress", "overdue"])
      .order("due_at", { ascending: true })
      .limit(3),
    supabase
      .from("student_mistakes")
      .select("mistake_count, module_id, test_id")
      .eq("student_id", profile.studentId)
      .order("last_mistake_at", { ascending: false })
      .limit(3),
    supabase
      .from("student_words")
      .select("id, status")
      .eq("student_id", profile.studentId),
    getStudentSchedulePreviewByStudentId(profile.studentId, 3).catch(() => ({
      nextLesson: null,
      upcomingLessons: []
    }))
  ]);

  const lessonRows = progressResponse.error ? [] : progressResponse.data ?? [];
  const latestProgress = lessonRows.find((row) => row.status === "in_progress") ?? lessonRows[0] ?? null;
  const progressValues = lessonRows.map((row) => Number(row.progress_percent ?? 0));
  const averageProgress = progressValues.length > 0 ? safePercent(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : 0;

  const attempts = attemptsResponse.error ? [] : attemptsResponse.data ?? [];
  const submittedAttempts = attempts.filter((row) => row.status !== "in_progress");
  const averageScore =
    submittedAttempts.length > 0
      ? safePercent(
          submittedAttempts.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / submittedAttempts.length
        )
      : 0;

  const activeCourses = enrollmentsResponse.error ? [] : enrollmentsResponse.data ?? [];
  const homeworkRows =
    homeworkResponse.error && !isSchemaMissing(homeworkResponse.error.message) ? [] : homeworkResponse.data ?? [];
  const mistakeRows =
    mistakesResponse.error && !isSchemaMissing(mistakesResponse.error.message) ? [] : mistakesResponse.data ?? [];
  const wordRows = wordsResponse.error && !isSchemaMissing(wordsResponse.error.message) ? [] : wordsResponse.data ?? [];
  const latestLesson = readRelationRecord(latestProgress?.lessons);
  const activeCourse = readRelationRecord(activeCourses[0]?.courses);

  const lessonTitle =
    typeof latestLesson?.title === "string"
      ? latestLesson.title
      : typeof activeCourse?.title === "string"
        ? activeCourse.title
        : "Практика";
  const lessonDuration = Number(
    typeof latestLesson?.duration_minutes === "number" ? latestLesson.duration_minutes : 0
  );

  return {
    lessonOfTheDay: {
      title: lessonTitle,
      description:
        latestProgress != null
          ? "Вы уже начали эту тему. Можно продолжить с того места, на котором остановились."
          : "Подберите тему в практике и начните заниматься между уроками с преподавателем.",
      duration: `${Math.max(lessonDuration, 5)} минут`,
      progress: Number(latestProgress?.progress_percent ?? 0),
      sectionsCount: activeCourses.length
    },
    progress: {
      value: averageProgress,
      label:
        latestProgress != null
          ? "Прогресс собран по последним активностям и завершённым урокам"
          : "Как только появятся попытки и пройденные активности, здесь появится прогресс"
    },
    heroStats: [
      { label: "Точность", value: `${averageScore}%` },
      { label: "Попыток", value: String(submittedAttempts.length) },
      { label: "Слов", value: String(wordRows.length) }
    ],
    homeworkCards: homeworkRows.map((item) => ({
      id: String(item.id),
      title: item.title ?? "Домашнее задание",
      subtitle: mapDueDate(item.due_at ?? null),
      status: mapHomeworkStatus(item.status ?? "not_started"),
      statusTone: getHomeworkTone(item.status ?? "not_started")
    })),
    recommendationCards: buildRecommendationCards(mistakeRows),
    summaryStats: [
      { label: "Сегодня", value: `${Math.round(progressValues.reduce((sum, value) => sum + value, 0) / 20) || 0} мин`, chip: "активность", icon: "sparkles" },
      { label: "Сделано тестов", value: String(submittedAttempts.length), chip: "за всё время", icon: "book" },
      { label: "Слов в повторении", value: String(wordRows.filter((row) => row.status !== "mastered").length), chip: "карточки", icon: "brain" }
    ],
    nextScheduledLesson: schedulePreview.nextLesson,
    upcomingScheduleLessons: schedulePreview.upcomingLessons
  };
}
