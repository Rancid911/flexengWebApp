import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchSearchDocumentCandidates } from "@/lib/search/sources/search-documents";
import type { SearchContext } from "@/lib/search/types";

const rpcMock = vi.hoisted(() => vi.fn());
const createAdminClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: rpcMock
  })
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock
}));

const baseContext: SearchContext = {
  userId: "user-1",
  role: "teacher",
  capabilities: ["teacher"],
  studentId: null,
  teacherId: "teacher-1",
  accessibleStudentIds: ["student-1", "student-2"],
  isAuthenticated: true
};

const row = {
  id: "doc-1",
  entity_type: "homework",
  entity_id: "entity-1",
  title: "Search row",
  subtitle: null,
  body: "body",
  href: "/homework/entity-1",
  section: "homework",
  icon: "book-open",
  badge: null,
  role_scope: ["teacher"],
  visibility: "student_owned",
  owner_student_id: "student-1",
  course_id: null,
  is_published: true,
  meta: {},
  updated_at: "2026-03-26T00:00:00.000Z",
  rank: 10
};

describe("fetchSearchDocumentCandidates", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    createAdminClientMock.mockReset();
  });

  it("calls the actor-scoped search RPC with actor context", async () => {
    rpcMock.mockResolvedValueOnce({ data: [row], error: null });

    const candidates = await fetchSearchDocumentCandidates({
      query: "homework",
      limit: 8,
      section: "all",
      context: baseContext
    });

    expect(rpcMock).toHaveBeenCalledWith("search_documents_query_for_actor", {
      p_query: "homework",
      p_limit: 48,
      p_section: "all",
      p_is_authenticated: true,
      p_role: "teacher",
      p_capabilities: ["teacher"],
      p_student_id: null,
      p_teacher_id: "teacher-1",
      p_accessible_student_ids: ["student-1", "student-2"]
    });
    expect(createAdminClientMock).not.toHaveBeenCalled();
    expect(candidates).toEqual([
      expect.objectContaining({
        id: "doc-1",
        entityType: "homework",
        entityId: "entity-1",
        ownerStudentId: "student-1",
        rank: 10
      })
    ]);
  });

  it("derives staff candidate expansion from RBAC permissions instead of raw staff_admin capability", async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });

    await fetchSearchDocumentCandidates({
      query: "students",
      limit: 8,
      section: "all",
      context: {
        userId: "manager-1",
        role: "manager",
        capabilities: ["staff_admin"],
        rbacPermissions: ["search.ui"],
        rbacPermissionScopes: { "search.ui": ["all"] },
        studentId: null,
        teacherId: null,
        accessibleStudentIds: null,
        isAuthenticated: true
      }
    });

    expect(rpcMock).toHaveBeenCalledWith(
      "search_documents_query_for_actor",
      expect.objectContaining({
        p_capabilities: []
      })
    );

    rpcMock.mockResolvedValueOnce({ data: [], error: null });

    await fetchSearchDocumentCandidates({
      query: "students",
      limit: 8,
      section: "all",
      context: {
        userId: "manager-1",
        role: "manager",
        capabilities: ["staff_admin"],
        rbacPermissions: ["students.view"],
        rbacPermissionScopes: { "students.view": ["all"] },
        studentId: null,
        teacherId: null,
        accessibleStudentIds: null,
        isAuthenticated: true
      }
    });

    expect(rpcMock).toHaveBeenLastCalledWith(
      "search_documents_query_for_actor",
      expect.objectContaining({
        p_capabilities: ["staff_admin"]
      })
    );
  });

  it("does not use raw staff_admin capability for RPC expansion when RBAC metadata is absent", async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });

    await fetchSearchDocumentCandidates({
      query: "students",
      limit: 8,
      section: "all",
      context: {
        userId: "admin-1",
        role: "admin",
        capabilities: ["staff_admin"],
        studentId: null,
        teacherId: null,
        accessibleStudentIds: null,
        isAuthenticated: true
      }
    });

    expect(rpcMock).toHaveBeenCalledWith(
      "search_documents_query_for_actor",
      expect.objectContaining({
        p_capabilities: []
      })
    );
  });

  it("fails closed when the actor-scoped RPC is missing", async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: "Could not find the function public.search_documents_query_for_actor in the schema cache" }
    });

    const candidates = await fetchSearchDocumentCandidates({
      query: "homework",
      limit: 8,
      section: "homework",
      context: baseContext
    });

    expect(rpcMock).toHaveBeenNthCalledWith(1, "search_documents_query_for_actor", expect.any(Object));
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(createAdminClientMock).not.toHaveBeenCalled();
    expect(candidates).toEqual([]);
  });
});
