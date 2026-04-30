import { AdminHttpError } from "@/lib/admin/http";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AccessMode } from "@/lib/supabase/access";
import type { SearchDocumentCandidate, SearchSection } from "@/lib/search/types";

export const SEARCH_DOCUMENT_ACCESS_MODE: AccessMode = "aggregate";

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

export async function fetchSearchDocumentCandidates(params: {
  query: string;
  limit: number;
  section: SearchSection;
}): Promise<SearchDocumentCandidate[]> {
  try {
    void SEARCH_DOCUMENT_ACCESS_MODE;
    const supabase = createAdminClient();
    const fetchLimit = Math.min(Math.max(params.limit * 6, 24), 100);
    const { data, error } = await supabase.rpc("search_documents_query", {
      p_query: params.query,
      p_limit: fetchLimit,
      p_section: params.section
    });

    if (error) {
      if (isSchemaMissing(error.message)) return [];
      throw new AdminHttpError(500, "SEARCH_FETCH_FAILED", "Failed to search documents", error.message);
    }

    return ((data ?? []) as SearchDocumentRow[]).map((row) => ({
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
  } catch (error) {
    if (error instanceof AdminHttpError) throw error;
    throw new AdminHttpError(500, "SEARCH_FETCH_FAILED", "Failed to search documents");
  }
}
