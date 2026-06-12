import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";
import {
  createUserScopedProgressRepository,
  type ProgressCourseRow,
  type ProgressHistoryRow,
  type ProgressLessonProgressRow,
  type ProgressLessonRow,
  type ProgressModuleRow,
  type ProgressOverviewAttemptRow,
  type ProgressTestRow,
  type ProgressWeakPointRow
} from "@/lib/progress/progress.repository";
import type {
  ProgressHistoryItem,
  ProgressOverview,
  ProgressTopic,
  ProgressWeakPoint
} from "@/lib/progress/progress.types";
import { measureServerTiming } from "@/lib/server/timing";
import { getCurrentStudentProfile } from "@/lib/students/current-student";

export const PROGRESS_OVERVIEW_DATA_LOADING = defineDataLoadingDescriptor({
  id: "progress-overview",
  owner: "@/lib/progress/progress.service#getProgressOverview",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "summary",
  issues: [],
  notes: ["Reference implementation for student summary-first loading."]
});

export const PROGRESS_TOPICS_DATA_LOADING = defineDataLoadingDescriptor({
  id: "progress-topics",
  owner: "@/lib/progress/progress.service#getProgressByTopics",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "summary",
  issues: [],
  notes: ["Reference implementation for student summary-first topic cards."]
});

export const PROGRESS_HISTORY_DATA_LOADING = defineDataLoadingDescriptor({
  id: "progress-history",
  owner: "@/lib/progress/progress.service#getProgressHistory",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "list",
  issues: []
});

export const PROGRESS_WEAK_POINTS_DATA_LOADING = defineDataLoadingDescriptor({
  id: "progress-weak-points",
  owner: "@/lib/progress/progress.service#getWeakPoints",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "list",
  issues: [],
  notes: ["Future RPC candidate for weak-point aggregates."]
});

const PROGRESS_LESSON_TYPES = new Set(["practice", "quiz", "flashcards"]);

function readRelationTitle(value: { title?: unknown } | Array<{ title?: unknown }> | null | undefined, fallback: string) {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first?.title === "string" ? first.title : fallback;
  }

  return typeof value?.title === "string" ? value.title : fallback;
}

function readRelationRecord<T extends Record<string, unknown>>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function isPlacementAssessment(value: { assessment_kind?: unknown } | Array<{ assessment_kind?: unknown }> | null | undefined) {
  const record = readRelationRecord(value);
  return record?.assessment_kind === "placement";
}

function isVisibleRegularTestForLevel(
  test: { assessment_kind?: unknown; cefr_level?: unknown } | null | undefined,
  studentLevel: string | null
) {
  if (test?.assessment_kind === "placement") return false;
  if (!studentLevel) return true;
  return test?.cefr_level === studentLevel;
}

export async function getProgressOverview(): Promise<ProgressOverview> {
  return measureServerTiming("progress-overview-data", async () => {
    const profile = await getCurrentStudentProfile();
    if (!profile?.studentId) {
      return {
        completedLessons: 0,
        totalAttempts: 0,
        averageScore: 0,
        weakPoints: 0
      };
    }

    const repository = await createUserScopedProgressRepository();
    const [completedLessonsResponse, attemptsResponse, mistakesResponse] = await Promise.all([
      repository.loadCompletedLessonsCount(profile.studentId),
      repository.loadCompletedAttempts(profile.studentId),
      repository.loadMistakesCount(profile.studentId)
    ]);

    const attempts = attemptsResponse.error
      ? []
      : ((attemptsResponse.data ?? []) as ProgressOverviewAttemptRow[]).filter((row) => !isPlacementAssessment(row.tests));
    const averageScore =
      attempts.length > 0
        ? Math.round(attempts.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / attempts.length)
        : 0;

    return {
      completedLessons: completedLessonsResponse.count ?? 0,
      totalAttempts: attempts.length,
      averageScore,
      weakPoints: mistakesResponse.count ?? 0
    };
  });
}

export async function getProgressHistory(): Promise<ProgressHistoryItem[]> {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];

  const repository = await createUserScopedProgressRepository();
  const { data, error } = await repository.loadHistory(profile.studentId);

  if (error) return [];
  return ((data ?? []) as ProgressHistoryRow[])
    .filter((item) => !isPlacementAssessment(item.tests))
    .map((item) => ({
      id: String(item.id),
      score: Number(item.score ?? 0),
      status: String(item.status ?? ""),
      created_at: typeof item.created_at === "string" ? item.created_at : null,
      submitted_at: typeof item.submitted_at === "string" ? item.submitted_at : null,
      title: readRelationTitle(item.tests, "Тест")
    }));
}

export async function getProgressByTopics(): Promise<ProgressTopic[]> {
  return measureServerTiming("progress-topics-data", async () => {
    const profile = await getCurrentStudentProfile();
    if (!profile?.studentId) return [];

    const repository = await createUserScopedProgressRepository();
    const [coursesResponse, modulesResponse] = await Promise.all([
      repository.loadPublishedCourses(),
      repository.loadPublishedModules()
    ]);

    const courses = (coursesResponse.data ?? []) as ProgressCourseRow[];
    const modules = (modulesResponse.data ?? []) as ProgressModuleRow[];
    const moduleIds = modules.map((item) => item.id).filter((value): value is string => typeof value === "string" && value.length > 0);

    const [lessonsResponse, testsResponse] =
      moduleIds.length > 0
        ? await Promise.all([repository.loadPublishedLessons(moduleIds), repository.loadPublishedTests(moduleIds)])
        : [{ data: [], error: null }, { data: [], error: null }];

    const lessons = (lessonsResponse.data ?? []) as ProgressLessonRow[];
    const tests = (testsResponse.data ?? []) as ProgressTestRow[];
    const visibleModuleIds = new Set<string>();

    for (const lesson of lessons) {
      if (!lesson.module_id || !PROGRESS_LESSON_TYPES.has(String(lesson.lesson_type ?? ""))) continue;
      visibleModuleIds.add(String(lesson.module_id));
    }
    for (const test of tests) {
      if (!test.module_id || !isVisibleRegularTestForLevel(test, profile.englishLevel ?? null)) continue;
      visibleModuleIds.add(String(test.module_id));
    }

    const visibleCourseIds = new Set<string>();
    for (const moduleRow of modules) {
      if (!moduleRow.course_id || !moduleRow.id || !visibleModuleIds.has(String(moduleRow.id))) continue;
      visibleCourseIds.add(String(moduleRow.course_id));
    }

    const visibleLessonIds = lessons
      .filter(
        (lesson) =>
          lesson.id &&
          lesson.module_id &&
          visibleModuleIds.has(String(lesson.module_id)) &&
          PROGRESS_LESSON_TYPES.has(String(lesson.lesson_type ?? ""))
      )
      .map((lesson) => String(lesson.id));

    const progressResponse =
      visibleLessonIds.length > 0
        ? await repository.loadLessonProgress(profile.studentId, visibleLessonIds)
        : { data: [], error: null };

    const progressByCourse = new Map<string, number[]>();
    for (const item of (progressResponse.data ?? []) as ProgressLessonProgressRow[]) {
      const lesson = readRelationRecord(item.lessons);
      const courseModule = readRelationRecord(
        lesson?.course_modules as { course_id?: string | null } | Array<{ course_id?: string | null }> | null | undefined
      );
      const courseId = courseModule?.course_id;
      if (!courseId) continue;
      const bucket = progressByCourse.get(String(courseId)) ?? [];
      bucket.push(Number(item.progress_percent ?? 0));
      progressByCourse.set(String(courseId), bucket);
    }

    return courses
      .filter((item) => item.id && visibleCourseIds.has(String(item.id)))
      .map((item) => {
        const progressValues = progressByCourse.get(String(item.id)) ?? [];
        return {
          id: String(item.id),
          title: typeof item.title === "string" ? item.title : "Тема",
          progressPercent:
            progressValues.length > 0
              ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
              : 0
        };
      });
  });
}

export async function getWeakPoints(): Promise<ProgressWeakPoint[]> {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];

  const repository = await createUserScopedProgressRepository();
  const { data, error } = await repository.loadWeakPoints(profile.studentId);

  if (error) return [];
  return ((data ?? []) as ProgressWeakPointRow[]).map((item) => ({
    id: String(item.id),
    title: readRelationTitle(item.tests, "Слабое место"),
    count: Number(item.mistake_count ?? 1)
  }));
}
