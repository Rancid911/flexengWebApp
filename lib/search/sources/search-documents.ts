import { AdminHttpError } from "@/lib/admin/http";
import type { AccessMode } from "@/lib/supabase/access";
import { canUseStaffSearchCandidateExpansion } from "@/lib/search/access";
import type { SearchContext, SearchDocumentCandidate, SearchSection } from "@/lib/search/types";
import { createClient } from "@/lib/supabase/server";

export const SEARCH_DOCUMENT_ACCESS_MODE: AccessMode = "user_scoped";

function isSchemaMissing(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("does not exist") || normalized.includes("schema cache") || normalized.includes("could not find");
}

type SearchDocumentRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  href: string;
  section: string;
  icon: string | null;
  badge: string | null;
  role_scope: string[] | null;
  visibility: "public" | "role" | "student_owned" | "enrollment";
  owner_student_id: string | null;
  course_id: string | null;
  is_published: boolean;
  meta: Record<string, unknown> | null;
  updated_at: string;
  rank: number | string | null;
};

function mapSearchDocumentRows(rows: SearchDocumentRow[] | null | undefined): SearchDocumentCandidate[] {
  return ((rows ?? []) as SearchDocumentRow[]).map((row) => ({
    id: String(row.id),
    entityType: String(row.entity_type),
    entityId: String(row.entity_id),
    title: String(row.title ?? ""),
    subtitle: row.subtitle ?? null,
    body: row.body ?? null,
    href: String(row.href ?? "/"),
    section: (["practice", "homework", "words", "blog", "admin"].includes(String(row.section)) ? row.section : "other") as
      | "practice"
      | "homework"
      | "words"
      | "blog"
      | "admin"
      | "other",
    icon: row.icon ?? null,
    badge: row.badge ?? null,
    roleScope: Array.isArray(row.role_scope) ? row.role_scope.map(String) : ["all"],
    visibility: row.visibility,
    ownerStudentId: row.owner_student_id ?? null,
    courseId: row.course_id ?? null,
    isPublished: Boolean(row.is_published),
    meta: row.meta ?? {},
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    rank: typeof row.rank === "number" ? row.rank : Number(row.rank ?? 0)
  }));
}

function getRpcSearchCapabilities(context: SearchContext) {
  const capabilities = context.capabilities.filter((capability) => capability !== "staff_admin") as SearchContext["capabilities"];

  // The current RPC still uses this capability for broad candidate expansion.
  // Only derive it from explicit RBAC grants; TypeScript filtering remains the final defense-in-depth check.
  if (canUseStaffSearchCandidateExpansion(context)) {
    capabilities.push("staff_admin");
  }

  return capabilities;
}

export async function fetchSearchDocumentCandidates(params: {
  query: string;
  limit: number;
  section: SearchSection;
  context: SearchContext;
}): Promise<SearchDocumentCandidate[]> {
  try {
    void SEARCH_DOCUMENT_ACCESS_MODE;
    const supabase = await createClient();
    const fetchLimit = Math.min(Math.max(params.limit * 6, 24), 100);
    const scopedParams = {
      p_query: params.query,
      p_limit: fetchLimit,
      p_section: params.section,
      p_is_authenticated: params.context.isAuthenticated,
      p_role: params.context.role,
      p_capabilities: getRpcSearchCapabilities(params.context),
      p_student_id: params.context.studentId,
      p_teacher_id: params.context.teacherId,
      p_accessible_student_ids: params.context.accessibleStudentIds ?? []
    };

    const { data, error } = await supabase.rpc("search_documents_query_for_actor", scopedParams);

    if (error) {
      if (isSchemaMissing(error.message)) {
        return [];
      }
      throw new AdminHttpError(500, "SEARCH_FETCH_FAILED", "Failed to search documents", error.message);
    }

    return mapSearchDocumentRows(data as SearchDocumentRow[] | null);
  } catch (error) {
    if (error instanceof AdminHttpError) throw error;
    throw new AdminHttpError(500, "SEARCH_FETCH_FAILED", "Failed to search documents");
  }
}
