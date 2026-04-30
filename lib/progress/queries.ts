import { measureServerTiming } from "@/lib/server/timing";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStudentProfile } from "@/lib/students/current-student";
import { defineDataLoadingDescriptor } from "@/lib/data-loading/contracts";

export const PROGRESS_OVERVIEW_DATA_LOADING = defineDataLoadingDescriptor({
  id: "progress-overview",
  owner: "@/lib/progress/queries#getProgressOverview",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "summary",
  issues: [],
  notes: ["Reference implementation for student summary-first loading."]
});

export const PROGRESS_TOPICS_DATA_LOADING = defineDataLoadingDescriptor({
  id: "progress-topics",
  owner: "@/lib/progress/queries#getProgressByTopics",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "summary",
  issues: [],
  notes: ["Reference implementation for student summary-first topic cards."]
});

export const PROGRESS_HISTORY_DATA_LOADING = defineDataLoadingDescriptor({
  id: "progress-history",
  owner: "@/lib/progress/queries#getProgressHistory",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "list",
  issues: []
});

export const PROGRESS_WEAK_POINTS_DATA_LOADING = defineDataLoadingDescriptor({
  id: "progress-weak-points",
  owner: "@/lib/progress/queries#getWeakPoints",
  accessMode: "user_scoped",
  loadLevel: "page",
  shape: "list",
  issues: [],
  notes: ["Future RPC candidate for weak-point aggregates."]
});

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

export async function getProgressOverview() {
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

  const supabase = await createClient();
  const [completedLessonsResponse, attemptsResponse, mistakesResponse] = await Promise.all([
    supabase.from("student_lesson_progress").select("id", { count: "exact", head: true }).eq("student_id", profile.studentId).eq("status", "completed"),
    supabase.from("student_test_attempts").select("score, status, tests(assessment_kind)").eq("student_id", profile.studentId).neq("status", "in_progress"),
    supabase.from("student_mistakes").select("id", { count: "exact", head: true }).eq("student_id", profile.studentId)
  ]);

  const attempts = attemptsResponse.error ? [] : (attemptsResponse.data ?? []).filter((row) => !isPlacementAssessment(row.tests));
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

export async function getProgressHistory() {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_test_attempts")
    .select("id, score, status, created_at, submitted_at, tests(title, assessment_kind)")
    .eq("student_id", profile.studentId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return [];
  return (data ?? [])
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

export async function getProgressByTopics() {
  return measureServerTiming("progress-topics-data", async () => {
    const profile = await getCurrentStudentProfile();
    if (!profile?.studentId) return [];
    const supabase = await createClient();
    const [coursesResponse, modulesResponse] = await Promise.all([
      supabase.from("courses").select("id, title").eq("is_published", true),
      supabase.from("course_modules").select("id, course_id").eq("is_published", true)
    ]);

    const courses = (coursesResponse.data ?? []) as Array<{ id: string | null; title: string | null }>;
    const modules = (modulesResponse.data ?? []) as Array<{ id: string | null; course_id: string | null }>;
    const moduleIds = modules.map((item) => item.id).filter((value): value is string => typeof value === "string" && value.length > 0);

    const [lessonsResponse, testsResponse] = await Promise.all([
      moduleIds.length > 0
        ? supabase.from("lessons").select("id, module_id, lesson_type").in("module_id", moduleIds).eq("is_published", true)
        : Promise.resolve({ data: [], error: null }),
      moduleIds.length > 0
        ? supabase.from("tests").select("id, module_id, cefr_level, assessment_kind").in("module_id", moduleIds).eq("is_published", true)
        : Promise.resolve({ data: [], error: null })
    ]);

    const visibleModuleIds = new Set<string>();
    for (const lesson of (lessonsResponse.data ?? []) as Array<{ module_id: string | null; lesson_type: string | null }>) {
      if (!lesson.module_id) continue;
      if (!["practice", "quiz", "flashcards"].includes(String(lesson.lesson_type ?? ""))) continue;
      visibleModuleIds.add(String(lesson.module_id));
    }
    for (const test of (testsResponse.data ?? []) as Array<{ module_id: string | null; cefr_level?: string | null; assessment_kind?: string | null }>) {
      if (!test.module_id || !isVisibleRegularTestForLevel(test, profile.englishLevel ?? null)) continue;
      visibleModuleIds.add(String(test.module_id));
    }

    const visibleCourseIds = new Set<string>();
    for (const moduleRow of modules) {
      if (!moduleRow.course_id || !moduleRow.id || !visibleModuleIds.has(String(moduleRow.id))) continue;
      visibleCourseIds.add(String(moduleRow.course_id));
    }

    const visibleLessonIds = ((lessonsResponse.data ?? []) as Array<{ id: string | null; module_id: string | null; lesson_type: string | null }>)
      .filter((lesson) => lesson.id && lesson.module_id && visibleModuleIds.has(String(lesson.module_id)) && ["practice", "quiz", "flashcards"].includes(String(lesson.lesson_type ?? "")))
      .map((lesson) => String(lesson.id));

    const progressResponse =
      visibleLessonIds.length > 0
        ? await supabase
            .from("student_lesson_progress")
            .select("progress_percent, lessons(module_id, course_modules(course_id))")
            .eq("student_id", profile.studentId)
            .in("lesson_id", visibleLessonIds)
        : { data: [], error: null };

    const progressByCourse = new Map<string, number[]>();
    for (const item of (progressResponse.data ?? []) as Array<{
      progress_percent: number | null;
      lessons:
        | {
            module_id?: string | null;
            course_modules?: { course_id?: string | null } | Array<{ course_id?: string | null }> | null;
          }
        | Array<{
            module_id?: string | null;
            course_modules?: { course_id?: string | null } | Array<{ course_id?: string | null }> | null;
          }>
        | null;
    }>) {
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
          progressPercent: progressValues.length > 0 ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : 0
        };
      });
  });
}

export async function getWeakPoints() {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_mistakes")
    .select("id, mistake_count, test_id, tests(title)")
    .eq("student_id", profile.studentId)
    .order("mistake_count", { ascending: false })
    .limit(20);

  if (error) return [];
  return (data ?? []).map((item) => ({
    id: String(item.id),
    title: readRelationTitle(item.tests, "Слабое место"),
    count: Number(item.mistake_count ?? 1)
  }));
}
