import { extractAssignedTestIdsFromHomeworkRows } from "@/lib/homework/assignments.mappers";
import { createHomeworkAssignmentsRepository, type HomeworkAssignmentsRepositoryClient } from "@/lib/homework/assignments.repository";
import {
  createPracticeCatalogRepository,
  type PracticeCatalogAttemptRow,
  type PracticeCatalogRepositoryClient,
  type PracticeCatalogTestRow
} from "@/lib/practice/catalog.repository";
import { getCurrentStudentProfile } from "@/lib/students/current-student";
import { createClient } from "@/lib/supabase/server";

export type PracticeActivitySummary = {
  id: string;
  kind: "trainer" | "test";
  title: string;
  description: string | null;
  activityType: "trainer" | "test";
  cefrLevel: string | null;
  drillTopicKey: string | null;
  drillKind: "grammar" | "vocabulary" | "mixed" | null;
  lessonReinforcement: boolean;
  durationLabel: string;
  progressLabel: string;
  sourceType: "lesson" | "test";
};

export type PracticeCatalogFilter = "all" | "trainers" | "tests" | "assigned";

export type PracticeCatalogItem = PracticeActivitySummary & {
  assigned: boolean;
};

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

function resolveDrillKind(value: string | null | undefined) {
  return value === "grammar" || value === "vocabulary" || value === "mixed" ? value : null;
}

function toPracticeTestSummary(
  item: PracticeCatalogTestRow,
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

async function loadAssignedTestIds(studentId: string, client: PracticeCatalogRepositoryClient) {
  const repository = createHomeworkAssignmentsRepository(client as HomeworkAssignmentsRepositoryClient);
  const response = await repository.listActiveAssignedTestItems(studentId);

  if (response.error) return new Set<string>();

  return extractAssignedTestIdsFromHomeworkRows(response.data ?? []);
}

function buildAttemptsByTest(rows: PracticeCatalogAttemptRow[], keepFirstAttempt: boolean) {
  const attemptsByTest = new Map<string, { status: string; score: number }>();
  for (const row of rows) {
    if (!row.test_id || (keepFirstAttempt && attemptsByTest.has(String(row.test_id)))) continue;
    attemptsByTest.set(String(row.test_id), { status: String(row.status ?? "not_started"), score: Number(row.score ?? 0) });
  }
  return attemptsByTest;
}

function formatAttemptProgress(attempt: { status: string; score: number } | undefined, fallback: string) {
  return attempt ? (attempt.status === "passed" ? `Результат: ${Math.round(attempt.score)}%` : `Статус: ${attempt.status}`) : fallback;
}

export async function getPracticeActivityCatalog(filter: PracticeCatalogFilter = "all") {
  const profile = await getPracticeStudentProfile();
  if (!profile?.studentId) return [];

  const supabase = await createClient();
  const repository = createPracticeCatalogRepository(supabase);
  const assignedTestIds = await loadAssignedTestIds(profile.studentId, supabase);

  if (filter === "assigned") {
    const assignedIds = Array.from(assignedTestIds);
    if (assignedIds.length === 0) return [];

    const [attemptsResponse, testsResponse] = await Promise.all([
      repository.loadStudentAttempts(profile.studentId, assignedIds),
      repository.loadAssignedCatalogTests(assignedIds)
    ]);

    if (testsResponse.error) return [];

    const attemptsByTest = buildAttemptsByTest((attemptsResponse.data ?? []) as PracticeCatalogAttemptRow[], false);
    return ((testsResponse.data ?? []) as PracticeCatalogTestRow[]).map((item) =>
      toPracticeTestSummary(item, formatAttemptProgress(attemptsByTest.get(String(item.id)), "Назначено преподавателем"), true)
    );
  }

  const [testsResponse, attemptsResponse] = await Promise.all([
    repository.loadPublishedCatalogTests({ filter, englishLevel: profile.englishLevel ?? null }),
    repository.loadStudentAttempts(profile.studentId)
  ]);

  if (testsResponse.error) return [];

  const attemptsByTest = buildAttemptsByTest((attemptsResponse.data ?? []) as PracticeCatalogAttemptRow[], true);
  return ((testsResponse.data ?? []) as PracticeCatalogTestRow[]).map((item) =>
    toPracticeTestSummary(
      item,
      formatAttemptProgress(attemptsByTest.get(String(item.id)), "Ещё не начато"),
      assignedTestIds.has(String(item.id))
    )
  );
}
