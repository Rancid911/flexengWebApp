import { createClient } from "@/lib/supabase/server";
import { getCurrentStudentProfile } from "@/lib/students/current-student";

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

export async function getProgressOverview() {
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
  const [lessonsResponse, attemptsResponse, mistakesResponse] = await Promise.all([
    supabase.from("student_lesson_progress").select("status").eq("student_id", profile.studentId),
    supabase.from("student_test_attempts").select("score, status, created_at, test_id").eq("student_id", profile.studentId).order("created_at", { ascending: false }),
    supabase.from("student_mistakes").select("id").eq("student_id", profile.studentId)
  ]);

  const lessonRows = lessonsResponse.error ? [] : lessonsResponse.data ?? [];
  const attempts = attemptsResponse.error ? [] : attemptsResponse.data ?? [];
  const completedLessons = lessonRows.filter((row) => row.status === "completed").length;
  const submittedAttempts = attempts.filter((row) => row.status !== "in_progress");
  const averageScore =
    submittedAttempts.length > 0
      ? Math.round(submittedAttempts.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / submittedAttempts.length)
      : 0;

  return {
    completedLessons,
    totalAttempts: submittedAttempts.length,
    averageScore,
    weakPoints: mistakesResponse.error ? 0 : (mistakesResponse.data ?? []).length
  };
}

export async function getProgressHistory() {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_test_attempts")
    .select("id, score, status, created_at, submitted_at, tests(title)")
    .eq("student_id", profile.studentId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return [];
  return (data ?? []).map((item) => ({
    id: String(item.id),
    score: Number(item.score ?? 0),
    status: String(item.status ?? ""),
    created_at: typeof item.created_at === "string" ? item.created_at : null,
    submitted_at: typeof item.submitted_at === "string" ? item.submitted_at : null,
    title: readRelationTitle(item.tests, "Тест")
  }));
}

export async function getProgressByTopics() {
  const profile = await getCurrentStudentProfile();
  if (!profile?.studentId) return [];
  const supabase = await createClient();
  const { data: enrollments } = await supabase
    .from("student_course_enrollments")
    .select("course_id, courses(title)")
    .eq("student_id", profile.studentId)
    .eq("status", "active");

  const lessonProgress = await supabase
    .from("student_lesson_progress")
    .select("progress_percent, lessons(module_id, course_modules(course_id))")
    .eq("student_id", profile.studentId);

  const progressByCourse = new Map<string, number[]>();
  for (const row of lessonProgress.data ?? []) {
    const lesson = readRelationRecord(row.lessons);
    const courseModule = readRelationRecord(lesson?.course_modules as { course_id?: unknown } | Array<{ course_id?: unknown }> | null | undefined);
    const courseId = courseModule?.course_id;
    if (!courseId) continue;
    const bucket = progressByCourse.get(String(courseId)) ?? [];
    bucket.push(Number(row.progress_percent ?? 0));
    progressByCourse.set(String(courseId), bucket);
  }

  return (enrollments ?? []).map((item) => {
    const scores = progressByCourse.get(String(item.course_id)) ?? [];
    return {
      id: String(item.course_id),
      title: readRelationTitle(item.courses, "Тема"),
      progressPercent: scores.length > 0 ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 0
    };
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
