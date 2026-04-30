import { AdminHttpError } from "@/lib/admin/http";
import { extractAssignedTestIdsFromHomeworkRows } from "@/lib/homework/assignments.mappers";
import { createHomeworkAssignmentsRepository, type HomeworkAssignmentsRepositoryClient } from "@/lib/homework/assignments.repository";
import { createClient } from "@/lib/supabase/server";
import type { AccessMode } from "@/lib/supabase/access";
import { fetchSearchDocumentCandidates } from "@/lib/search/sources/search-documents";
import { getSearchContext } from "@/lib/search/sources/search-context";
import type { SearchContext, SearchDocumentCandidate, SearchGroupDto, SearchResultDto, SearchSection } from "@/lib/search/types";

export const SEARCH_ENROLLMENT_ACCESS_MODE: AccessMode = "user_scoped";

const GROUP_LABELS: Record<Exclude<SearchSection, "all">, string> = {
  practice: "Практика",
  homework: "Домашнее задание",
  words: "Слова",
  blog: "Блог",
  admin: "Администрирование"
};

function isSearchResultSection(section: SearchDocumentCandidate["section"]): section is SearchResultDto["section"] {
  return ["practice", "homework", "words", "blog", "admin"].includes(section);
}

function isSchemaMissing(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("does not exist") || normalized.includes("schema cache") || normalized.includes("could not find");
}

type StudentPracticeSearchAccess = {
  englishLevel: string | null;
  assignedTestIds: Set<string>;
  testsById: Map<string, { assessmentKind: string | null; cefrLevel: string | null }>;
};

async function getStudentPracticeSearchAccess(
  studentId: string,
  candidates: SearchDocumentCandidate[]
): Promise<StudentPracticeSearchAccess> {
  void SEARCH_ENROLLMENT_ACCESS_MODE;
  const supabase = await createClient();
  const homeworkRepository = createHomeworkAssignmentsRepository(supabase as HomeworkAssignmentsRepositoryClient);
  const practiceTestIds = candidates
    .filter((candidate) => candidate.section === "practice" && candidate.entityType === "test")
    .map((candidate) => candidate.entityId);

  const [studentResponse, assignmentsResponse, testsResponse] = await Promise.all([
    supabase.from("students").select("english_level").eq("id", studentId).maybeSingle(),
    homeworkRepository.listSearchAssignedHomeworkItems(studentId),
    practiceTestIds.length > 0
      ? supabase.from("tests").select("id, assessment_kind, cefr_level").in("id", practiceTestIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (studentResponse.error && !isSchemaMissing(studentResponse.error.message)) {
    throw new AdminHttpError(500, "SEARCH_STUDENT_LEVEL_FETCH_FAILED", "Failed to fetch student level", studentResponse.error.message);
  }

  if (assignmentsResponse.error && !isSchemaMissing(assignmentsResponse.error.message)) {
    throw new AdminHttpError(500, "SEARCH_ASSIGNMENTS_FETCH_FAILED", "Failed to fetch assigned tests", assignmentsResponse.error.message);
  }

  if (testsResponse.error && !isSchemaMissing(testsResponse.error.message)) {
    throw new AdminHttpError(500, "SEARCH_TESTS_FETCH_FAILED", "Failed to fetch practice tests", testsResponse.error.message);
  }

  const assignedTestIds = extractAssignedTestIdsFromHomeworkRows(assignmentsResponse.data ?? []);

  const testsById = new Map<string, { assessmentKind: string | null; cefrLevel: string | null }>();
  for (const row of (testsResponse.data ?? []) as Array<{ id: string | null; assessment_kind: string | null; cefr_level: string | null }>) {
    if (!row.id) continue;
    testsById.set(String(row.id), {
      assessmentKind: row.assessment_kind ?? null,
      cefrLevel: row.cefr_level ?? null
    });
  }

  return {
    englishLevel: studentResponse.data?.english_level ?? null,
    assignedTestIds,
    testsById
  };
}

function canAccessRoleScopedDocument(candidate: SearchDocumentCandidate, context: SearchContext) {
  if (!context.isAuthenticated || !context.role) return false;
  if (context.capabilities.includes("staff_admin")) return true;

  const accessibleRoles = new Set<string>([context.role]);
  if (context.capabilities.includes("student")) accessibleRoles.add("student");
  if (context.capabilities.includes("teacher")) accessibleRoles.add("teacher");

  return candidate.roleScope.includes("all") || candidate.roleScope.some((role) => accessibleRoles.has(role));
}

function canSeeCandidate(candidate: SearchDocumentCandidate, context: SearchContext, practiceAccess: StudentPracticeSearchAccess | null) {
  if (context.capabilities.includes("staff_admin")) {
    return true;
  }

  if (candidate.visibility === "public") {
    return candidate.isPublished;
  }

  if (candidate.visibility === "role") {
    return canAccessRoleScopedDocument(candidate, context);
  }

  if (candidate.visibility === "student_owned") {
    return Boolean(context.studentId && candidate.ownerStudentId === context.studentId);
  }

  if (candidate.visibility === "enrollment") {
    if (!candidate.isPublished) return false;

    if (context.capabilities.includes("student") && context.studentId) {
      if (candidate.section === "practice") {
        if (!practiceAccess) return false;
        if (candidate.entityType !== "test") return true;

        const test = practiceAccess.testsById.get(candidate.entityId);
        if (!test) return false;
        if (test.assessmentKind === "placement") {
          return practiceAccess.assignedTestIds.has(candidate.entityId);
        }
        if (practiceAccess.assignedTestIds.has(candidate.entityId)) return true;
        if (!practiceAccess.englishLevel) return true;
        return test.cefrLevel === practiceAccess.englishLevel;
      }

      return false;
    }

    if (context.capabilities.includes("teacher")) {
      return true;
    }

    return false;
  }

  return false;
}

function toSnippet(value: string | null) {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 140) return normalized;
  return `${normalized.slice(0, 137)}...`;
}

function toResult(candidate: SearchDocumentCandidate): SearchResultDto | null {
  if (!isSearchResultSection(candidate.section)) {
    return null;
  }

  return {
    id: candidate.id,
    entityType: candidate.entityType,
    entityId: candidate.entityId,
    title: candidate.title,
    subtitle: candidate.subtitle,
    href: candidate.href,
    section: candidate.section,
    icon: candidate.icon,
    badge: candidate.badge,
    snippet: toSnippet(candidate.body),
    rank: candidate.rank
  };
}

export async function searchSite(params: {
  query: string;
  limit?: number;
  section?: SearchSection;
}): Promise<{
  query: string;
  items: SearchResultDto[];
  groups: SearchGroupDto[];
}> {
  const query = params.query.trim();
  const limit = Math.min(Math.max(params.limit ?? 8, 1), 25);
  const section = params.section ?? "all";

  if (query.length < 2) {
    return { query, items: [], groups: [] };
  }

  const context = await getSearchContext();
  const candidates = await fetchSearchDocumentCandidates({ query, limit, section });
  const practiceAccess = context.studentId ? await getStudentPracticeSearchAccess(context.studentId, candidates) : null;
  const dedupe = new Set<string>();
  const items: SearchResultDto[] = [];

  for (const candidate of candidates) {
    if (!canSeeCandidate(candidate, context, practiceAccess)) continue;
    const result = toResult(candidate);
    if (!result) continue;

    const dedupeKey = `${result.entityType}:${result.entityId}`;
    if (dedupe.has(dedupeKey)) continue;
    dedupe.add(dedupeKey);

    items.push(result);
    if (items.length >= limit) break;
  }

  const groups = Object.entries(
    items.reduce<Record<string, number>>((acc, item) => {
      acc[item.section] = (acc[item.section] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([key, count]) => ({
      key: key as Exclude<SearchSection, "all">,
      label: GROUP_LABELS[key as Exclude<SearchSection, "all">],
      count
    }))
    .sort((left, right) => right.count - left.count);

  return { query, items, groups };
}
