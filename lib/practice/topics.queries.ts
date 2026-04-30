import { cache } from "react";

import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";
import type { PracticeActivitySummary, PracticeCatalogItem } from "@/lib/practice/catalog.queries";
import {
  createPracticeTopicsRepository,
  type PracticeTopicAttemptRow,
  type PracticeTopicCourseRow,
  type PracticeTopicLessonRow,
  type PracticeTopicModuleRow,
  type PracticeTopicTestRow
} from "@/lib/practice/topics.repository";
import { measureServerTiming } from "@/lib/server/timing";
import { getCurrentStudentProfile } from "@/lib/students/current-student";
import { createClient } from "@/lib/supabase/server";

export type PracticeTopicSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  moduleCount: number;
  progressPercent: number;
};

export type PracticeSubtopicSummary = {
  id: string;
  title: string;
  description: string | null;
  lessonCount: number;
  testCount: number;
  progressPercent: number;
};

export const PRACTICE_TOPICS_DATA_LOADING = defineDataLoadingDescriptor({
  id: "practice-topics",
  owner: "@/lib/practice/queries#getPracticeTopics",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "summary",
  issues: [],
  notes: ["Topic progress summary by course/module is a future RPC candidate."]
});

export const PRACTICE_TOPIC_DETAIL_DATA_LOADING = defineDataLoadingDescriptor({
  id: "practice-topic-detail",
  owner: "@/lib/practice/queries#getPracticeTopicDetail",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "detail",
  issues: []
});

export const PRACTICE_SUBTOPIC_DETAIL_DATA_LOADING = defineDataLoadingDescriptor({
  id: "practice-subtopic-detail",
  owner: "@/lib/practice/queries#getPracticeSubtopicDetail",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "detail",
  issues: []
});

function readRelationRecord<T extends Record<string, unknown>>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
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

function isVisibleRegularPracticeTest(test: Pick<PracticeTopicTestRow, "assessment_kind" | "cefr_level">, studentLevel: string | null) {
  if (normalizeAssessmentKind(test.assessment_kind ?? null) === "placement") return false;
  if (!studentLevel) return true;
  return test.cefr_level === studentLevel;
}

function resolveDrillKind(value: string | null | undefined) {
  return value === "grammar" || value === "vocabulary" || value === "mixed" ? value : null;
}

function toPracticeTestSummary(
  item: PracticeTopicTestRow,
  progressLabel: string,
  assigned = false
): PracticeCatalogItem {
  const activityType = normalizePracticeActivityType(item.activity_type);
  return {
    id: toActivityId("test", String(item.id)),
    kind: activityType,
    activityType,
    title: String(item.title),
    description: item.description ?? null,
    cefrLevel: item.cefr_level ?? null,
    drillTopicKey: item.drill_topic_key ?? null,
    drillKind: resolveDrillKind(item.drill_kind),
    lessonReinforcement: Boolean(item.lesson_reinforcement),
    durationLabel: `${Math.max(Number(item.time_limit_minutes ?? 0), 5)} минут`,
    progressLabel,
    sourceType: "test",
    assigned
  };
}

async function loadPublishedPracticeCourses(repository: ReturnType<typeof createPracticeTopicsRepository>) {
  const response = await repository.loadPublishedCourses();
  return (response.data ?? []) as PracticeTopicCourseRow[];
}

async function loadPracticeModulesForCourses(repository: ReturnType<typeof createPracticeTopicsRepository>, courseIds: string[]) {
  const response = await repository.loadPublishedModulesForCourses(courseIds);
  return (response.data ?? []) as PracticeTopicModuleRow[];
}

const loadPracticeTopicsSource = cache(async (studentId: string, studentLevel: string | null) =>
  measureServerTiming("practice-topics-source", async () => {
    void studentLevel;
    const supabase = await createClient();
    const repository = createPracticeTopicsRepository(supabase);
    const courses = await loadPublishedPracticeCourses(repository);
    const courseIds = courses.map((row) => row.id).filter(Boolean);
    const modules = await loadPracticeModulesForCourses(repository, courseIds);
    const moduleIds = modules.map((item) => item.id);
    const [lessonResponse, testResponse, progressRows] = await Promise.all([
      repository.loadTopicLessons(moduleIds),
      repository.loadTopicTests(moduleIds),
      repository.loadPracticeProgressRowsForModules(studentId, moduleIds)
    ]);

    return {
      courses,
      modules,
      lessonRows: (lessonResponse.data ?? []) as PracticeTopicLessonRow[],
      testRows: (testResponse.data ?? []) as PracticeTopicTestRow[],
      progressRows
    };
  })
);

const loadPracticeTopicSource = cache(async (studentId: string, topicSlug: string) =>
  measureServerTiming("practice-topic-data", async () => {
    const supabase = await createClient();
    const repository = createPracticeTopicsRepository(supabase);
    const courseResponse = await repository.loadTopicCourse(topicSlug);

    if (courseResponse.error || !courseResponse.data) {
      return null;
    }

    const course = courseResponse.data as PracticeTopicCourseRow;
    const modulesResponse = await repository.loadPublishedModulesForCourse(course.id);
    const modules = (modulesResponse.data ?? []) as PracticeTopicModuleRow[];
    const moduleIds = modules.map((item) => item.id);
    const [lessonResponse, testResponse] = await Promise.all([
      repository.loadTopicLessons(moduleIds),
      repository.loadTopicTests(moduleIds)
    ]);

    const lessonRows = (lessonResponse.data ?? []) as PracticeTopicLessonRow[];
    const testRows = (testResponse.data ?? []) as PracticeTopicTestRow[];
    const lessonIds = lessonRows.filter((item) => isVisiblePracticeLessonType(item.lesson_type)).map((item) => item.id);
    const progressResponse = await repository.loadTopicLessonProgress(studentId, lessonIds);

    return {
      course,
      modules,
      lessonRows,
      testRows,
      progressRows: (progressResponse.data ?? []) as Array<{ lesson_id: string | null; progress_percent: number | null }>
    };
  })
);

const loadPracticeSubtopicSource = cache(async (studentId: string, topicSlug: string, subtopicId: string) =>
  measureServerTiming("practice-subtopic-data", async () => {
    const supabase = await createClient();
    const repository = createPracticeTopicsRepository(supabase);
    const [courseResponse, moduleResponse] = await Promise.all([
      repository.loadTopicCourse(topicSlug),
      repository.loadSubtopicModule(subtopicId)
    ]);

    if (courseResponse.error || !courseResponse.data || moduleResponse.error || !moduleResponse.data) {
      return null;
    }

    const course = courseResponse.data as PracticeTopicCourseRow;
    const moduleRow = moduleResponse.data as PracticeTopicModuleRow;
    if (moduleRow.course_id !== course.id) {
      return null;
    }

    const [lessonResponse, testResponse] = await Promise.all([
      repository.loadSubtopicLessons(subtopicId),
      repository.loadSubtopicTests(subtopicId)
    ]);

    const lessonRows = (lessonResponse.data ?? []) as PracticeTopicLessonRow[];
    const testRows = (testResponse.data ?? []) as PracticeTopicTestRow[];
    const lessonIds = lessonRows.map((item) => item.id);
    const testIds = testRows.map((item) => item.id);
    const [progressResponse, attemptsResponse] = await Promise.all([
      repository.loadSubtopicLessonProgress(studentId, lessonIds),
      repository.loadSubtopicAttempts(studentId, testIds)
    ]);

    return {
      course,
      module: moduleRow,
      lessonRows,
      testRows,
      progressRows: (progressResponse.data ?? []) as Array<{ lesson_id: string | null; status: string | null; progress_percent: number | null }>,
      attemptRows: (attemptsResponse.data ?? []) as PracticeTopicAttemptRow[]
    };
  })
);

export async function getPracticeTopics() {
  const profile = await getPracticeStudentProfile();
  if (!profile) return [];

  const { courses, modules, lessonRows, testRows, progressRows } = await loadPracticeTopicsSource(
    profile.studentId ?? "",
    profile.englishLevel ?? null
  );
  const visibleModulesByCourse = new Map<string, number>();
  const visibleModuleIds = new Set<string>();

  for (const lesson of lessonRows) {
    if (!lesson.module_id || !isVisiblePracticeLessonType(lesson.lesson_type)) continue;
    visibleModuleIds.add(String(lesson.module_id));
  }

  for (const test of testRows) {
    if (!test.module_id || !isVisibleRegularPracticeTest(test, profile.englishLevel ?? null)) continue;
    visibleModuleIds.add(String(test.module_id));
  }

  for (const moduleRow of modules) {
    if (!moduleRow.course_id || !visibleModuleIds.has(String(moduleRow.id))) continue;
    visibleModulesByCourse.set(String(moduleRow.course_id), (visibleModulesByCourse.get(String(moduleRow.course_id)) ?? 0) + 1);
  }

  const progressByCourse = new Map<string, number[]>();
  for (const row of progressRows) {
    const lesson = readRelationRecord(row.lessons);
    const courseModule = readRelationRecord(lesson?.course_modules as { course_id?: string | null } | Array<{ course_id?: string | null }> | null | undefined);
    const courseId = courseModule?.course_id;
    if (!courseId) continue;
    const bucket = progressByCourse.get(String(courseId)) ?? [];
    bucket.push(Number(row.progress_percent ?? 0));
    progressByCourse.set(String(courseId), bucket);
  }

  return courses
    .filter((course) => (visibleModulesByCourse.get(String(course.id)) ?? 0) > 0)
    .map((course): PracticeTopicSummary => {
    const courseId = String(course.id ?? "");
    const progressValues = progressByCourse.get(courseId) ?? [];

    return {
      id: courseId,
      slug: String(course.slug ?? course.id ?? ""),
      title: String(course.title ?? "Тема"),
      description: typeof course.description === "string" ? course.description : null,
      moduleCount: visibleModulesByCourse.get(courseId) ?? 0,
      progressPercent: progressValues.length > 0 ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : 0
    };
  });
}

export async function getPracticeTopicDetail(topicSlug: string) {
  const profile = await getPracticeStudentProfile();
  if (!profile) return null;
  const level = profile.englishLevel;

  const source = await loadPracticeTopicSource(profile.studentId ?? "", topicSlug);
  if (!source) return null;

  const progressByLessonId = new Map<string, number>();
  for (const row of source.progressRows) {
    if (!row.lesson_id) continue;
    progressByLessonId.set(String(row.lesson_id), Number(row.progress_percent ?? 0));
  }

  const lessonCountByModule = new Map<string, number>();
  for (const lesson of source.lessonRows) {
    if (!lesson.module_id || !isVisiblePracticeLessonType(lesson.lesson_type)) continue;
    lessonCountByModule.set(String(lesson.module_id), (lessonCountByModule.get(String(lesson.module_id)) ?? 0) + 1);
  }

  const testCountByModule = new Map<string, number>();
  for (const test of source.testRows) {
    if (!isVisibleRegularPracticeTest(test, level ?? null)) continue;
    if (!test.module_id) continue;
    testCountByModule.set(String(test.module_id), (testCountByModule.get(String(test.module_id)) ?? 0) + 1);
  }

  const progressByModule = new Map<string, number[]>();
  for (const lesson of source.lessonRows) {
    if (!lesson.module_id || !isVisiblePracticeLessonType(lesson.lesson_type)) continue;
    const lessonProgress = progressByLessonId.get(String(lesson.id));
    if (lessonProgress == null) continue;
    const bucket = progressByModule.get(String(lesson.module_id)) ?? [];
    bucket.push(lessonProgress);
    progressByModule.set(String(lesson.module_id), bucket);
  }

  return {
    topic: {
      id: String(source.course.id),
      slug: String(source.course.slug),
      title: String(source.course.title),
      description: source.course.description ?? null
    },
    subtopics: source.modules
      .filter((item) => (lessonCountByModule.get(String(item.id)) ?? 0) > 0 || (testCountByModule.get(String(item.id)) ?? 0) > 0)
      .map((item): PracticeSubtopicSummary => {
      const progressValues = progressByModule.get(String(item.id)) ?? [];

      return {
        id: String(item.id),
        title: String(item.title),
        description: item.description ?? null,
        lessonCount: lessonCountByModule.get(String(item.id)) ?? 0,
        testCount: testCountByModule.get(String(item.id)) ?? 0,
        progressPercent: progressValues.length > 0 ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : 0
      };
    })
  };
}

export async function getPracticeSubtopicDetail(topicSlug: string, subtopicId: string) {
  const profile = await getPracticeStudentProfile();
  if (!profile) return null;

  const source = await loadPracticeSubtopicSource(profile.studentId ?? "", topicSlug, subtopicId);
  if (!source) return null;
  const level = profile.englishLevel;

  const progressByLesson = new Map<string, { status: string; progressPercent: number }>();
  for (const row of source.progressRows) {
    if (!row.lesson_id) continue;
    progressByLesson.set(String(row.lesson_id), {
      status: String(row.status ?? "not_started"),
      progressPercent: Number(row.progress_percent ?? 0)
    });
  }

  const attemptsByTest = new Map<string, { status: string; score: number }>();
  for (const row of source.attemptRows) {
    if (!row.test_id) continue;
    attemptsByTest.set(String(row.test_id), {
      status: String(row.status ?? "not_started"),
      score: Number(row.score ?? 0)
    });
  }

  const lessonProgressValues = Array.from(progressByLesson.values()).map((item) => item.progressPercent);
  const visibleLessonRows = source.lessonRows.filter((item) => isVisiblePracticeLessonType(item.lesson_type));
  const visibleTestRows = source.testRows.filter((item) => isVisibleRegularPracticeTest(item, level ?? null));
  const subtopic: PracticeSubtopicSummary = {
    id: String(source.module.id),
    title: String(source.module.title),
    description: source.module.description ?? null,
    lessonCount: visibleLessonRows.length,
    testCount: visibleTestRows.length,
    progressPercent:
      lessonProgressValues.length > 0
        ? Math.round(lessonProgressValues.reduce((sum, value) => sum + value, 0) / lessonProgressValues.length)
        : 0
  };

  const activities: PracticeActivitySummary[] = [
    ...visibleLessonRows
      .map((item) => {
        const progress = progressByLesson.get(String(item.id));
        return {
          id: toActivityId("lesson", String(item.id)),
          kind: "trainer" as const,
          activityType: "trainer" as const,
          title: String(item.title),
          description: item.description ?? null,
          cefrLevel: profile.englishLevel ?? null,
          drillTopicKey: null,
          drillKind: null,
          lessonReinforcement: false,
          durationLabel: `${Math.max(Number(item.duration_minutes ?? 0), 5)} минут`,
          progressLabel: progress ? `${Math.round(progress.progressPercent)}% пройдено` : "Ещё не начато",
          sourceType: "lesson" as const
        };
      }),
    ...visibleTestRows
      .map((item) => {
      const attempt = attemptsByTest.get(String(item.id));
      return toPracticeTestSummary(
        item,
        attempt ? (attempt.status === "passed" ? `Результат: ${Math.round(attempt.score)}%` : `Статус: ${attempt.status}`) : "Ещё не начато"
      );
    })
  ];

  return {
    topic: {
      id: String(source.course.id),
      slug: String(source.course.slug),
      title: String(source.course.title),
      description: source.course.description ?? null
    },
    subtopic,
    activities
  };
}
