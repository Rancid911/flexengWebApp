import type {
  ScheduleLessonStatus,
  StudentScheduleLessonDto,
  StudentSchedulePreview
} from "@/lib/schedule/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function safeDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getScheduleStatusLabel(status: ScheduleLessonStatus) {
  switch (status) {
    case "completed":
      return "Проведён";
    case "canceled":
      return "Отменён";
    default:
      return "Запланирован";
  }
}

export function getScheduleStatusTone(status: ScheduleLessonStatus) {
  switch (status) {
    case "completed":
      return "emerald";
    case "canceled":
      return "rose";
    default:
      return "sky";
  }
}

export function isFutureScheduledLesson(
  lesson: Pick<StudentScheduleLessonDto, "status" | "startsAt">,
  referenceDate = new Date()
) {
  const startsAt = safeDate(lesson.startsAt);
  if (!startsAt) return false;
  return lesson.status === "scheduled" && startsAt.getTime() > referenceDate.getTime();
}

export function buildStudentSchedulePreview(
  lessons: StudentScheduleLessonDto[],
  referenceDate = new Date(),
  limit = 3
): StudentSchedulePreview {
  const upcomingLessons = getStudentVisibleLessons(lessons, referenceDate)
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
    .slice(0, limit);

  return {
    nextLesson: upcomingLessons[0] ?? null,
    upcomingLessons
  };
}

export function getStudentVisibleLessons(lessons: StudentScheduleLessonDto[], referenceDate = new Date()) {
  return lessons.filter((lesson) => isFutureScheduledLesson(lesson, referenceDate));
}

export function formatScheduleDateLabel(value: string, referenceDate = new Date()) {
  const date = safeDate(value);
  if (!date) return "Дата уточняется";

  const currentDay = new Date(referenceDate);
  currentDay.setHours(0, 0, 0, 0);

  const targetDay = new Date(date);
  targetDay.setHours(0, 0, 0, 0);

  const dayDiff = Math.round((targetDay.getTime() - currentDay.getTime()) / DAY_MS);
  if (dayDiff === 0) return "Сегодня";
  if (dayDiff === 1) return "Завтра";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    weekday: "long"
  }).format(date);
}

export function formatScheduleTimeRange(startsAt: string, endsAt: string) {
  const startDate = safeDate(startsAt);
  const endDate = safeDate(endsAt);
  if (!startDate || !endDate) return "Время уточняется";

  const formatter = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

export function groupLessonsByDate<T extends { startsAt: string }>(lessons: T[], referenceDate = new Date()) {
  const groups = new Map<string, { key: string; label: string; lessons: T[] }>();

  for (const lesson of lessons) {
    const key = lesson.startsAt.slice(0, 10);
    const current = groups.get(key);
    if (current) {
      current.lessons.push(lesson);
      continue;
    }

    groups.set(key, {
      key,
      label: formatScheduleDateLabel(lesson.startsAt, referenceDate),
      lessons: [lesson]
    });
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => value);
}
