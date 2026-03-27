import { AdminHttpError } from "@/lib/admin/http";
import { createClient } from "@/lib/supabase/server";
import { fetchSearchDocumentCandidates } from "@/lib/search/sources/search-documents";
import { getSearchContext } from "@/lib/search/sources/search-context";
import type { SearchContext, SearchDocumentCandidate, SearchGroupDto, SearchResultDto, SearchSection } from "@/lib/search/types";

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

async function getStudentEnrollmentCourseIds(studentId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_course_enrollments")
    .select("course_id")
    .eq("student_id", studentId)
    .eq("status", "active");

  if (error) {
    if (isSchemaMissing(error.message)) return new Set();
    throw new AdminHttpError(500, "SEARCH_ENROLLMENTS_FETCH_FAILED", "Failed to fetch enrollments", error.message);
  }

  return new Set((data ?? []).map((row) => String(row.course_id ?? "")).filter(Boolean));
}

function canAccessRoleScopedDocument(candidate: SearchDocumentCandidate, context: SearchContext) {
  if (!context.isAuthenticated || !context.role) return false;
  if (context.role === "admin") return true;
  return candidate.roleScope.includes("all") || candidate.roleScope.includes(context.role);
}

function canSeeCandidate(candidate: SearchDocumentCandidate, context: SearchContext, enrolledCourseIds: Set<string>) {
  if (context.role === "admin") {
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

    if (context.role === "student") {
      return Boolean(context.studentId && candidate.courseId && enrolledCourseIds.has(candidate.courseId));
    }

    if (context.role === "teacher" || context.role === "manager") {
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
  const enrolledCourseIds = context.studentId ? await getStudentEnrollmentCourseIds(context.studentId) : new Set<string>();
  const dedupe = new Set<string>();
  const items: SearchResultDto[] = [];

  for (const candidate of candidates) {
    if (!canSeeCandidate(candidate, context, enrolledCourseIds)) continue;
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
