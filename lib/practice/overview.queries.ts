import { cache } from "react";

import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";
import { extractAssignedTestIdsFromHomeworkRows } from "@/lib/homework/assignments.mappers";
import { createHomeworkAssignmentsRepository, type HomeworkAssignmentsRepositoryClient } from "@/lib/homework/assignments.repository";
import {
  createPracticeOverviewRepository,
  type PracticeFavoriteRow,
  type PracticeOverviewAttemptRow,
  type PracticeOverviewCourseRow,
  type PracticeOverviewLessonRow,
  type PracticeOverviewMistakeRow,
  type PracticeOverviewModuleRow,
  type PracticeOverviewProgressRow,
  type PracticeOverviewRepositoryClient,
  type PracticeOverviewTestRow
} from "@/lib/practice/overview.repository";
import { measureServerTiming } from "@/lib/server/timing";
import { getCurrentStudentProfile } from "@/lib/students/current-student";
import { createClient } from "@/lib/supabase/server";

export type PracticeOverviewSummary = {
  doNowId: string | null;
  continueTopicSlug: string | null;
  weakSpotId: string | null;
};

export const PRACTICE_OVERVIEW_DATA_LOADING = defineDataLoadingDescriptor({
  id: "practice-overview",
  owner: "@/lib/practice/queries#getPracticeOverviewSummary",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "summary",
  issues: ["mixed_responsibilities"],
  transitional: true,
  notes: ["Overview should stay limited to do-now, continue-topic and weak-spot summaries."]
});

export const PRACTICE_RECOMMENDATIONS_DATA_LOADING = defineDataLoadingDescriptor({
  id: "practice-recommendations",
  owner: "@/lib/practice/queries#getPracticeRecommended",
  accessMode: "user_scoped",
  loadLevel: "section",
  shape: "list",
  issues: [],
  notes: ["Future RPC candidate for recommendation feed computation."]
});

export const PRACTICE_MISTAKES_DATA_LOADING = defineDataLoadingDescriptor({
  id: "practice-mistakes",
  owner: "@/lib/practice/queries#getPracticeMistakes",
  accessMode: "user_scoped",
  loadLevel: "section",
  shape: "list",
  issues: [],
  notes: ["Secondary student detail surface, not part of the global overview payload."]
});

export const PRACTICE_FAVORITES_DATA_LOADING = defineDataLoadingDescriptor({
  id: "practice-favorites",
  owner: "@/lib/practice/queries#getPracticeFavorites",
  accessMode: "user_scoped",
  loadLevel: "section",
  shape: "list",
  issues: [],
  notes: ["Secondary student detail surface, not part of the global overview payload."]
});

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

function readRelationTitle(
  value: { title?: unknown } | Array<{ title?: unknown }> | null | undefined,
  fallback: string
) {
  const record = readRelationRecord(value);
  return typeof record?.title === "string" ? record.title : fallback;
}

export function buildPracticeOverviewSummary(
  recommended: Array<{ id: string }>,
  topics: Array<{ slug: string; progressPercent: number }>
): PracticeOverviewSummary {
  const doNow = recommended[0] ?? null;
  const continueTopic = topics.find((topic) => topic.progressPercent > 0 && topic.progressPercent < 100) ?? topics[0] ?? null;
  const weakSpot = recommended[1] ?? recommended[0] ?? null;

  return {
    doNowId: doNow?.id ?? null,
    continueTopicSlug: continueTopic?.slug ?? null,
    weakSpotId: weakSpot?.id ?? null
  };
}

function buildPracticeOverviewSummaryFromSource(input: {
  attempts: PracticeOverviewAttemptRow[];
  mistakes: PracticeOverviewMistakeRow[];
  progressRows: PracticeOverviewProgressRow[];
  courses: PracticeOverviewCourseRow[];
}) {
  const doNowAttempt = input.attempts.find((row) => Number(row.score ?? 100) < 70 && row.test_id);
  const doNowMistake = input.mistakes.find((row) => row.module_id || row.test_id);
  const doNowProgress = input.progressRows.find((row) => Number(row.progress_percent ?? 0) > 0 && String(row.status ?? "") !== "completed");

  const doNowId = doNowAttempt?.test_id
    ? toActivityId("test", String(doNowAttempt.test_id))
    : doNowProgress?.lesson_id
      ? toActivityId("lesson", String(doNowProgress.lesson_id))
      : doNowMistake?.module_id
        ? `module_${String(doNowMistake.module_id)}`
        : null;

  const weakSpotId = doNowMistake?.module_id
    ? `module_${String(doNowMistake.module_id)}`
    : doNowAttempt?.test_id
      ? toActivityId("test", String(doNowAttempt.test_id))
      : doNowId;

  const courseProgress = new Map<string, { completed: number; total: number }>();
  for (const row of input.progressRows) {
    const lesson = readRelationRecord(row.lessons);
    const courseModule = readRelationRecord(
      lesson?.course_modules as { course_id?: string | null } | Array<{ course_id?: string | null }> | null | undefined
    );
    const courseId = courseModule?.course_id;
    if (!courseId) continue;
    const bucket = courseProgress.get(String(courseId)) ?? { completed: 0, total: 0 };
    bucket.total += 1;
    if (Number(row.progress_percent ?? 0) > 0) {
      bucket.completed += 1;
    }
    courseProgress.set(String(courseId), bucket);
  }

  const continueTopicCourse = input.courses.find((course) => {
    const courseId = String(course.id ?? "");
    const progress = courseProgress.get(courseId);
    return progress && progress.completed > 0 && progress.completed < progress.total;
  }) ?? input.courses[0] ?? null;

  return {
    doNowId,
    continueTopicSlug: typeof continueTopicCourse?.slug === "string" ? continueTopicCourse.slug : null,
    weakSpotId
  } satisfies PracticeOverviewSummary;
}

function toActivityId(sourceType: "lesson" | "test", id: string) {
  return `${sourceType}_${id}`;
}

async function getPracticeStudentProfile() {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) {
    return null;
  }

  return profile;
}

function normalizePracticeActivityType(value: string | null | undefined): "trainer" | "test" {
  return value === "trainer" ? "trainer" : "test";
}

function normalizeAssessmentKind(value: string | null | undefined): "regular" | "placement" {
  return value === "placement" ? "placement" : "regular";
}

function isVisiblePracticeLessonType(value: string | null | undefined) {
  return ["practice", "quiz", "flashcards"].includes(String(value ?? ""));
}

function isVisibleRegularPracticeTest(test: Pick<PracticeOverviewTestRow, "assessment_kind" | "cefr_level">, studentLevel: string | null) {
  if (normalizeAssessmentKind(test.assessment_kind ?? null) === "placement") return false;
  if (!studentLevel) return true;
  return test.cefr_level === studentLevel;
}

async function loadAssignedTestIds(studentId: string, client: PracticeOverviewRepositoryClient) {
  const repository = createHomeworkAssignmentsRepository(client as HomeworkAssignmentsRepositoryClient);
  const response = await repository.listActiveAssignedTestItems(studentId);

  if (response.error) return new Set<string>();

  return extractAssignedTestIdsFromHomeworkRows(response.data ?? []);
}

const loadPracticeOverviewSource = cache(async (studentId: string, studentLevel: string | null) =>
  measureServerTiming("practice-page-data", async () => {
    const supabase = await createClient();
    const repository = createPracticeOverviewRepository(supabase);
    const [coursesResponse, attemptsResponse, mistakesResponse] = await Promise.all([
      repository.loadPublishedCourses(),
      repository.loadRecentAttempts(studentId),
      repository.loadRecentMistakes(studentId)
    ]);

    if (coursesResponse.error) {
      return {
        courses: [] as PracticeOverviewCourseRow[],
        modules: [] as PracticeOverviewModuleRow[],
        lessonRows: [] as PracticeOverviewLessonRow[],
        testRows: [] as PracticeOverviewTestRow[],
        progressRows: [] as PracticeOverviewProgressRow[],
        attempts: [] as PracticeOverviewAttemptRow[],
        mistakes: [] as PracticeOverviewMistakeRow[]
      };
    }

    const courses = (coursesResponse.data ?? []) as PracticeOverviewCourseRow[];
    const courseIds = courses.map((row) => row.id).filter(Boolean);
    const modulesResponse = await repository.loadPublishedModulesForCourses(courseIds);
    const modules = (modulesResponse.data ?? []) as PracticeOverviewModuleRow[];
    const moduleIds = modules.map((item) => item.id);

    const [lessonsResponse, testsResponse] = await Promise.all([
      repository.loadPublishedLessonsForModules(moduleIds),
      repository.loadPublishedTestsForModules(moduleIds)
    ]);

    const lessonRows = ((lessonsResponse.data ?? []) as PracticeOverviewLessonRow[]).filter((item) =>
      isVisiblePracticeLessonType(item.lesson_type)
    );
    const testRows = ((testsResponse.data ?? []) as PracticeOverviewTestRow[]).filter((item) => isVisibleRegularPracticeTest(item, studentLevel));
    const lessonIds = lessonRows.map((item) => item.id);
    const progressResponse = await repository.loadLessonProgress(studentId, lessonIds);

    return {
      courses,
      modules,
      lessonRows,
      testRows,
      progressRows: (progressResponse.data ?? []) as PracticeOverviewProgressRow[],
      attempts: (attemptsResponse.data ?? []) as PracticeOverviewAttemptRow[],
      mistakes:
        mistakesResponse.error && isSchemaMissing(mistakesResponse.error.message) ? ([] as PracticeOverviewMistakeRow[]) : ((mistakesResponse.data ?? []) as PracticeOverviewMistakeRow[])
    };
  })
);

const loadPracticeOverviewSummarySource = cache(async (studentId: string, studentLevel: string | null) =>
  measureServerTiming("practice-overview-source", async () => {
    const supabase = await createClient();
    const repository = createPracticeOverviewRepository(supabase);
    const [taxonomy, attemptsResponse, mistakesResponse] = await Promise.all([
      loadPracticeOverviewSource(studentId, studentLevel),
      repository.loadRecentAttempts(studentId),
      repository.loadRecentMistakes(studentId)
    ]);

    return {
      courses: taxonomy.courses,
      progressRows: taxonomy.progressRows,
      attempts: (attemptsResponse.data ?? []) as PracticeOverviewAttemptRow[],
      mistakes:
        mistakesResponse.error && isSchemaMissing(mistakesResponse.error.message) ? ([] as PracticeOverviewMistakeRow[]) : ((mistakesResponse.data ?? []) as PracticeOverviewMistakeRow[])
    };
  })
);

const loadPracticeRecommendationsSource = cache(async (studentId: string, studentLevel: string | null) =>
  measureServerTiming("practice-recommendations-source", async () => {
    const supabase = await createClient();
    const repository = createPracticeOverviewRepository(supabase);
    const [attemptsResponse, mistakesResponse, taxonomy] = await Promise.all([
      repository.loadRecentAttempts(studentId),
      repository.loadRecentMistakes(studentId),
      loadPracticeOverviewSource(studentId, studentLevel)
    ]);

    return {
      attempts: (attemptsResponse.data ?? []) as PracticeOverviewAttemptRow[],
      progressRows: taxonomy.progressRows,
      mistakes:
        mistakesResponse.error && isSchemaMissing(mistakesResponse.error.message) ? ([] as PracticeOverviewMistakeRow[]) : ((mistakesResponse.data ?? []) as PracticeOverviewMistakeRow[])
    };
  })
);

export async function getPracticeOverviewSummary(): Promise<PracticeOverviewSummary> {
  const profile = await getPracticeStudentProfile();
  if (!profile) {
    return {
      doNowId: null,
      continueTopicSlug: null,
      weakSpotId: null
    };
  }

  const source = await loadPracticeOverviewSummarySource(profile.studentId ?? "", profile.englishLevel ?? null);
  return buildPracticeOverviewSummaryFromSource(source);
}

export async function getPracticeRecommended() {
  const profile = await getPracticeStudentProfile();
  if (!profile) return [];

  const supabase = await createClient();
  const { attempts, mistakes, progressRows } = await loadPracticeRecommendationsSource(profile.studentId ?? "", profile.englishLevel ?? null);
  const assignedTestIds = await loadAssignedTestIds(profile.studentId ?? "", supabase);
  const studentLevel = profile.englishLevel;
  const recommendations: Array<{
    id: string;
    title: string;
    reason: string;
    activityType?: "trainer" | "test";
    cefrLevel?: string | null;
    drillTopicKey?: string | null;
    drillKind?: "grammar" | "vocabulary" | "mixed" | null;
  }> = [];

  for (const row of attempts) {
    const test = readRelationRecord(row.tests as Record<string, unknown> | Array<Record<string, unknown>> | null | undefined);
    if (typeof test?.assessment_kind === "string" && test.assessment_kind === "placement") continue;
    const cefrLevel = typeof test?.cefr_level === "string" ? test.cefr_level : null;
    const allowedByLevel = !studentLevel || cefrLevel === studentLevel;
    const allowedByAssignment = row.test_id ? assignedTestIds.has(String(row.test_id)) : false;
    if (!allowedByLevel && !allowedByAssignment) continue;
    if (Number(row.score ?? 100) >= 70) continue;
    recommendations.push({
      id: toActivityId("test", String(row.test_id)),
      title: readRelationTitle(row.tests, "Тест"),
      reason: `Низкий результат: ${Math.round(Number(row.score ?? 0))}%`,
      activityType: normalizePracticeActivityType(typeof test?.activity_type === "string" ? test.activity_type : null),
      cefrLevel,
      drillTopicKey: typeof test?.drill_topic_key === "string" ? test.drill_topic_key : null,
      drillKind: test?.drill_kind === "grammar" || test?.drill_kind === "vocabulary" || test?.drill_kind === "mixed" ? test.drill_kind : null
    });
  }

  for (const row of mistakes) {
    recommendations.push({
      id: `module_${String(row.module_id ?? crypto.randomUUID())}`,
      title: "Повторить сложную тему",
      reason: `Ошибок по теме: ${Number(row.mistake_count ?? 1)}`
    });
  }

  for (const row of progressRows) {
    if (Number(row.progress_percent ?? 0) <= 0 || String(row.status ?? "") === "completed") continue;
    const lesson = readRelationRecord(row.lessons);
    recommendations.push({
      id: toActivityId("lesson", String(lesson?.id ?? row.lesson_id ?? "")),
      title: readRelationTitle(lesson, "Практика"),
      reason: `Можно продолжить с ${Math.round(Number(row.progress_percent ?? 0))}%`
    });
  }

  const seen = new Set<string>();
  return recommendations
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .slice(0, 6);
}

export async function getPracticeMistakes() {
  const profile = await getPracticeStudentProfile();
  if (!profile) return [];

  const { mistakes } = await loadPracticeOverviewSource(profile.studentId ?? "", profile.englishLevel ?? null);
  return mistakes.slice(0, 20).map((item) => ({
    id: String(item.id ?? crypto.randomUUID()),
    title: readRelationTitle(item.tests, "Сложная тема"),
    description: `Ошибок: ${Number(item.mistake_count ?? 1)}`
  }));
}

export async function getPracticeFavorites() {
  const profile = await getPracticeStudentProfile();
  if (!profile) return [];

  const supabase = await createClient();
  const repository = createPracticeOverviewRepository(supabase);
  const { data, error } = await repository.loadFavorites(profile.studentId ?? "");

  if (error) {
    if (isSchemaMissing(error.message)) return [];
    return [];
  }

  return ((data ?? []) as PracticeFavoriteRow[]).map((item) => ({
    id: String(item.id),
    entityType: String(item.entity_type),
    entityId: String(item.entity_id)
  }));
}
