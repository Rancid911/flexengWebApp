import { createClient } from "@/lib/supabase/server";
import { getCurrentStudentProfile } from "@/lib/students/current-student";

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

export type PracticeActivitySummary = {
  id: string;
  kind: "trainer" | "test";
  title: string;
  description: string | null;
  durationLabel: string;
  progressLabel: string;
  sourceType: "lesson" | "test";
};

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

function readRelationTitle(value: { title: unknown } | Array<{ title: unknown }> | null | undefined, fallback: string) {
  const record = readRelationRecord(value);
  return typeof record?.title === "string" ? record.title : fallback;
}

function toActivityId(sourceType: "lesson" | "test", id: string) {
  return `${sourceType}_${id}`;
}

export async function getPracticeTopics() {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];

  const supabase = await createClient();
  const { data: enrollments, error } = await supabase
    .from("student_course_enrollments")
    .select("course_id, courses(id, slug, title, description)")
    .eq("student_id", profile.studentId)
    .eq("status", "active");

  if (error) return [];

  const courseIds = (enrollments ?? []).map((row) => row.course_id).filter(Boolean);
  const [{ data: modules }, { data: progressRows }] = await Promise.all([
    courseIds.length
      ? supabase.from("course_modules").select("id, course_id").in("course_id", courseIds).eq("is_published", true)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("student_lesson_progress")
      .select("progress_percent, lessons(module_id, course_modules(course_id))")
      .eq("student_id", profile.studentId)
  ]);

  const modulesByCourse = new Map<string, number>();
  for (const moduleRow of modules ?? []) {
    modulesByCourse.set(String(moduleRow.course_id), (modulesByCourse.get(String(moduleRow.course_id)) ?? 0) + 1);
  }

  const progressByCourse = new Map<string, number[]>();
  for (const row of progressRows ?? []) {
    const lesson = readRelationRecord(row.lessons);
    const courseModule = readRelationRecord(lesson?.course_modules as { course_id: unknown } | Array<{ course_id: unknown }> | null | undefined);
    const courseId = courseModule?.course_id;
    if (!courseId) continue;
    const bucket = progressByCourse.get(String(courseId)) ?? [];
    bucket.push(Number(row.progress_percent ?? 0));
    progressByCourse.set(String(courseId), bucket);
  }

  return (enrollments ?? []).map((row): PracticeTopicSummary => {
    const course = readRelationRecord(row.courses);
    const progressValues = progressByCourse.get(String(course?.id ?? "")) ?? [];
    const progressPercent = progressValues.length > 0 ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : 0;
    return {
      id: String(course?.id ?? row.course_id),
      slug: String(course?.slug ?? row.course_id),
      title: String(course?.title ?? "Тема"),
      description: typeof course?.description === "string" ? course.description : null,
      moduleCount: modulesByCourse.get(String(course?.id ?? row.course_id)) ?? 0,
      progressPercent
    };
  });
}

export async function getPracticeTopicDetail(topicSlug: string) {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return null;

  const supabase = await createClient();
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, slug, title, description")
    .eq("slug", topicSlug)
    .maybeSingle();

  if (courseError || !course) return null;

  const [{ data: modules }, { data: progressRows }] = await Promise.all([
    supabase
      .from("course_modules")
      .select("id, title, description")
      .eq("course_id", course.id)
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("student_lesson_progress")
      .select("progress_percent, lessons(module_id)")
      .eq("student_id", profile.studentId)
  ]);

  const progressByModule = new Map<string, number[]>();
  for (const row of progressRows ?? []) {
    const lesson = readRelationRecord(row.lessons);
    const moduleId = lesson?.module_id;
    if (!moduleId) continue;
    const bucket = progressByModule.get(String(moduleId)) ?? [];
    bucket.push(Number(row.progress_percent ?? 0));
    progressByModule.set(String(moduleId), bucket);
  }

  const moduleIds = (modules ?? []).map((item) => item.id);
  const [{ data: lessonRows }, { data: testRows }] = await Promise.all([
    moduleIds.length
      ? supabase.from("lessons").select("id, module_id").in("module_id", moduleIds).eq("is_published", true)
      : Promise.resolve({ data: [], error: null }),
    moduleIds.length
      ? supabase.from("tests").select("id, module_id").in("module_id", moduleIds).eq("is_published", true)
      : Promise.resolve({ data: [], error: null })
  ]);

  const lessonCountByModule = new Map<string, number>();
  for (const lesson of lessonRows ?? []) {
    lessonCountByModule.set(String(lesson.module_id), (lessonCountByModule.get(String(lesson.module_id)) ?? 0) + 1);
  }
  const testCountByModule = new Map<string, number>();
  for (const test of testRows ?? []) {
    testCountByModule.set(String(test.module_id), (testCountByModule.get(String(test.module_id)) ?? 0) + 1);
  }

  const subtopics: PracticeSubtopicSummary[] = (modules ?? []).map((item) => {
    const progressValues = progressByModule.get(String(item.id)) ?? [];
    return {
      id: String(item.id),
      title: String(item.title),
      description: item.description ?? null,
      lessonCount: lessonCountByModule.get(String(item.id)) ?? 0,
      testCount: testCountByModule.get(String(item.id)) ?? 0,
      progressPercent: progressValues.length > 0 ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : 0
    };
  });

  return {
    topic: {
      id: String(course.id),
      slug: String(course.slug),
      title: String(course.title),
      description: course.description ?? null
    },
    subtopics
  };
}

export async function getPracticeSubtopicDetail(topicSlug: string, subtopicId: string) {
  const supabase = await createClient();
  const topicDetail = await getPracticeTopicDetail(topicSlug);
  if (!topicDetail) return null;

  const subtopic = topicDetail.subtopics.find((item) => item.id === subtopicId) ?? null;
  if (!subtopic) return null;

  const [{ data: lessonRows }, { data: testRows }, { data: attemptRows }, { data: progressRows }] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, title, description, duration_minutes, lesson_type")
      .eq("module_id", subtopicId)
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("tests")
      .select("id, title, description, time_limit_minutes, activity_type")
      .eq("module_id", subtopicId)
      .eq("is_published", true)
      .order("created_at", { ascending: true }),
    getCurrentStudentProfile().then(async (profile) =>
      profile?.studentId
        ? supabase.from("student_test_attempts").select("test_id, status, score").eq("student_id", profile.studentId)
        : { data: [], error: null }
    ),
    getCurrentStudentProfile().then(async (profile) =>
      profile?.studentId
        ? supabase.from("student_lesson_progress").select("lesson_id, status, progress_percent").eq("student_id", profile.studentId)
        : { data: [], error: null }
    )
  ]);

  const attemptRowsData = attemptRows ?? [];
  const progressRowsData = progressRows ?? [];
  const progressByLesson = new Map<string, { status: string; progressPercent: number }>();
  for (const row of progressRowsData) {
    progressByLesson.set(String(row.lesson_id), {
      status: String(row.status ?? "not_started"),
      progressPercent: Number(row.progress_percent ?? 0)
    });
  }

  const attemptsByTest = new Map<string, { status: string; score: number }>();
  for (const row of attemptRowsData) {
    attemptsByTest.set(String(row.test_id), {
      status: String(row.status ?? "not_started"),
      score: Number(row.score ?? 0)
    });
  }

  const activities: PracticeActivitySummary[] = [
    ...(lessonRows ?? [])
      .filter((item) => ["practice", "quiz", "flashcards"].includes(String(item.lesson_type)))
      .map((item) => {
        const progress = progressByLesson.get(String(item.id));
        return {
          id: toActivityId("lesson", String(item.id)),
          kind: "trainer" as const,
          title: String(item.title),
          description: item.description ?? null,
          durationLabel: `${Math.max(Number(item.duration_minutes ?? 0), 5)} минут`,
          progressLabel: progress ? `${Math.round(progress.progressPercent)}% пройдено` : "Ещё не начато",
          sourceType: "lesson" as const
        };
      }),
    ...(testRows ?? []).map((item) => {
      const attempt = attemptsByTest.get(String(item.id));
      const kind: PracticeActivitySummary["kind"] = item.activity_type === "trainer" ? "trainer" : "test";
      return {
        id: toActivityId("test", String(item.id)),
        kind,
        title: String(item.title),
        description: item.description ?? null,
        durationLabel: `${Math.max(Number(item.time_limit_minutes ?? 0), 5)} минут`,
        progressLabel: attempt ? (attempt.status === "passed" ? `Результат: ${Math.round(attempt.score)}%` : `Статус: ${attempt.status}`) : "Ещё не начато",
        sourceType: "test" as const
      };
    })
  ];

  return {
    topic: topicDetail.topic,
    subtopic,
    activities
  };
}

export async function getPracticeRecommended() {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];

  const supabase = await createClient();
  const [attemptsResponse, mistakesResponse, progressResponse] = await Promise.all([
    supabase
      .from("student_test_attempts")
      .select("test_id, score, status, tests(title, module_id)")
      .eq("student_id", profile.studentId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("student_mistakes")
      .select("mistake_count, module_id")
      .eq("student_id", profile.studentId)
      .order("last_mistake_at", { ascending: false })
      .limit(5),
    supabase
      .from("student_lesson_progress")
      .select("progress_percent, lessons(id, title)")
      .eq("student_id", profile.studentId)
      .in("status", ["in_progress", "not_started"])
      .order("updated_at", { ascending: false })
      .limit(5)
  ]);

  const recommendations: Array<{
    id: string;
    title: string;
    reason: string;
  }> = [];
  for (const row of attemptsResponse.data ?? []) {
    if (Number(row.score ?? 100) >= 70) continue;
    const test = readRelationRecord(row.tests);
    recommendations.push({
      id: toActivityId("test", String(row.test_id)),
      title: readRelationTitle(test, "Тест"),
      reason: `Низкий результат: ${Math.round(Number(row.score ?? 0))}%`
    });
  }
  for (const row of mistakesResponse.error && isSchemaMissing(mistakesResponse.error.message) ? [] : mistakesResponse.data ?? []) {
    recommendations.push({
      id: `module_${String(row.module_id ?? crypto.randomUUID())}`,
      title: "Повторить сложную тему",
      reason: `Ошибок по теме: ${Number(row.mistake_count ?? 1)}`
    });
  }
  for (const row of progressResponse.data ?? []) {
    if (Number(row.progress_percent ?? 0) <= 0) continue;
    const lesson = readRelationRecord(row.lessons);
    recommendations.push({
      id: toActivityId("lesson", String(lesson?.id ?? "")),
      title: readRelationTitle(lesson, "Практика"),
      reason: `Можно продолжить с ${Math.round(Number(row.progress_percent ?? 0))}%`
    });
  }

  const seen = new Set<string>();
  return recommendations.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  }).slice(0, 6);
}

export async function getPracticeMistakes() {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_mistakes")
    .select("id, mistake_count, last_mistake_at, test_id, tests(title)")
    .eq("student_id", profile.studentId)
    .order("last_mistake_at", { ascending: false })
    .limit(20);

  if (error) {
    if (isSchemaMissing(error.message)) return [];
    return [];
  }

  return (data ?? []).map((item) => ({
    id: String(item.id),
    title: readRelationTitle(item.tests, "Сложная тема"),
    description: `Ошибок: ${Number(item.mistake_count ?? 1)}`
  }));
}

export async function getPracticeFavorites() {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_favorites")
    .select("id, entity_type, entity_id, created_at")
    .eq("student_id", profile.studentId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    if (isSchemaMissing(error.message)) return [];
    return [];
  }

  return (data ?? []).map((item) => ({
    id: String(item.id),
    entityType: String(item.entity_type),
    entityId: String(item.entity_id)
  }));
}

export async function getPracticeActivityDetail(activityId: string) {
  const [sourceType, rawId] = activityId.split("_");
  if (!rawId || (sourceType !== "lesson" && sourceType !== "test")) return null;

  const supabase = await createClient();

  if (sourceType === "lesson") {
    const { data, error } = await supabase
      .from("lessons")
      .select("id, title, description, content, duration_minutes, lesson_type")
      .eq("id", rawId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: activityId,
      sourceType: "lesson" as const,
      title: String(data.title),
      description: data.description ?? null,
      meta: `${Math.max(Number(data.duration_minutes ?? 0), 5)} минут`,
      content: data.content
    };
  }

  const { data, error } = await supabase
    .from("tests")
    .select("id, title, description, passing_score, time_limit_minutes, test_questions(id, prompt, explanation, question_type, test_question_options(id, option_text, sort_order))")
    .eq("id", rawId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: activityId,
    sourceType: "test" as const,
    title: String(data.title),
    description: data.description ?? null,
    meta: `Проходной балл ${Number(data.passing_score ?? 70)}%, ${Math.max(Number(data.time_limit_minutes ?? 0), 5)} минут`,
    content: data.test_questions ?? []
  };
}
