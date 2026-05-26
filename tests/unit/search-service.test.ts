import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchSite } from "@/lib/search/search-service";
import type { SearchContext, SearchDocumentCandidate } from "@/lib/search/types";

const createClientMock = vi.fn();
const fetchCandidatesMock = vi.fn();
const getSearchContextMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock()
}));

vi.mock("@/lib/search/sources/search-documents", () => ({
  fetchSearchDocumentCandidates: (...args: unknown[]) => fetchCandidatesMock(...args)
}));

vi.mock("@/lib/search/sources/search-context", () => ({
  getSearchContext: () => getSearchContextMock()
}));

function makeQueryResult(data: unknown) {
  const result = { data, error: null };
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(() => builder),
    in: vi.fn(() => builder),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
    catch: (reject: (reason: unknown) => unknown) => Promise.resolve(result).catch(reject),
    finally: (callback: () => void) => Promise.resolve(result).finally(callback)
  };
  return builder;
}

const studentContext: SearchContext = {
  userId: "user-1",
  role: "student",
  capabilities: ["student"],
  studentId: "student-1",
  teacherId: null,
  accessibleStudentIds: null,
  isAuthenticated: true
};

function makeCandidate(overrides: Partial<SearchDocumentCandidate> = {}): SearchDocumentCandidate {
  return {
    id: "candidate-1",
    entityType: "post",
    entityId: "candidate-1",
    title: "Candidate",
    subtitle: null,
    body: "body",
    href: "/articles/candidate-1",
    section: "blog",
    icon: "file-text",
    badge: null,
    roleScope: ["all"],
    visibility: "public",
    ownerStudentId: null,
    courseId: null,
    isPublished: true,
    meta: {},
    updatedAt: "2026-03-26T00:00:00.000Z",
    rank: 10,
    ...overrides
  };
}

describe("searchSite", () => {
  beforeEach(() => {
    fetchCandidatesMock.mockReset();
    getSearchContextMock.mockReset();
    createClientMock.mockReset();
    getSearchContextMock.mockResolvedValue(studentContext);
    createClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        switch (table) {
          case "students":
            return makeQueryResult({ english_level: "A1" });
          case "homework_assignments":
            return makeQueryResult([]);
          case "tests":
            return makeQueryResult([
              { id: "module-1", assessment_kind: "regular", cefr_level: "A1" }
            ]);
          default:
            return makeQueryResult([]);
        }
      })
    });
  });

  it("returns only published public results for guest search", async () => {
    const guestContext: SearchContext = {
      userId: null,
      role: null,
      capabilities: [],
      studentId: null,
      teacherId: null,
      accessibleStudentIds: null,
      isAuthenticated: false
    };
    getSearchContextMock.mockResolvedValue(guestContext);

    fetchCandidatesMock.mockResolvedValue([
      {
        id: "1",
        entityType: "post",
        entityId: "public-post",
        title: "Public post",
        subtitle: null,
        body: "body",
        href: "/articles/public-post",
        section: "blog",
        icon: "file-text",
        badge: null,
        roleScope: ["all"],
        visibility: "public",
        ownerStudentId: null,
        courseId: null,
        isPublished: true,
        meta: {},
        updatedAt: "2026-03-26T00:00:00.000Z",
        rank: 10
      },
      {
        id: "2",
        entityType: "post",
        entityId: "draft-post",
        title: "Draft post",
        subtitle: null,
        body: "body",
        href: "/articles/draft-post",
        section: "blog",
        icon: "file-text",
        badge: null,
        roleScope: ["all"],
        visibility: "public",
        ownerStudentId: null,
        courseId: null,
        isPublished: false,
        meta: {},
        updatedAt: "2026-03-26T00:00:00.000Z",
        rank: 9
      },
      {
        id: "3",
        entityType: "module",
        entityId: "private-practice",
        title: "Private practice",
        subtitle: null,
        body: "body",
        href: "/practice/topics/private",
        section: "practice",
        icon: "graduation-cap",
        badge: "урок",
        roleScope: ["student"],
        visibility: "role",
        ownerStudentId: null,
        courseId: null,
        isPublished: true,
        meta: {},
        updatedAt: "2026-03-26T00:00:00.000Z",
        rank: 8
      },
      {
        id: "4",
        entityType: "test",
        entityId: "assigned-test",
        title: "Assigned test",
        subtitle: null,
        body: "body",
        href: "/practice/activity/test_assigned-test",
        section: "practice",
        icon: "brain",
        badge: "Тренажёр",
        roleScope: ["student"],
        visibility: "enrollment",
        ownerStudentId: null,
        courseId: null,
        isPublished: true,
        meta: {},
        updatedAt: "2026-03-26T00:00:00.000Z",
        rank: 7
      },
      {
        id: "5",
        entityType: "homework",
        entityId: "student-homework",
        title: "Owned homework",
        subtitle: null,
        body: "body",
        href: "/homework/student-homework",
        section: "homework",
        icon: "book-open",
        badge: null,
        roleScope: ["student"],
        visibility: "student_owned",
        ownerStudentId: "student-1",
        courseId: null,
        isPublished: true,
        meta: {},
        updatedAt: "2026-03-26T00:00:00.000Z",
        rank: 6
      }
    ] satisfies SearchDocumentCandidate[]);

    const result = await searchSite({ query: "public", limit: 10 });

    expect(result.items).toEqual([
      expect.objectContaining({
        entityId: "public-post",
        section: "blog",
        href: "/articles/public-post"
      })
    ]);
    expect(result.groups).toEqual([{ key: "blog", label: "Блог", count: 1 }]);
    expect(fetchCandidatesMock).toHaveBeenCalledWith(expect.objectContaining({ context: guestContext }));
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("passes actor search context to the search document candidate source", async () => {
    fetchCandidatesMock.mockResolvedValue([]);

    await searchSite({ query: "public", limit: 10 });

    expect(fetchCandidatesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "public",
        limit: 10,
        section: "all",
        context: studentContext
      })
    );
  });

  it("does not require search.ui to return actor-scoped private results", async () => {
    getSearchContextMock.mockResolvedValue({
      ...studentContext,
      rbacPermissions: ["homework.view"],
      rbacPermissionScopes: { "homework.view": ["own"] }
    });
    fetchCandidatesMock.mockResolvedValue([
      makeCandidate({
        id: "public",
        entityId: "public-post",
        title: "Public post",
        href: "/articles/public-post",
        section: "blog",
        roleScope: ["all"],
        visibility: "public",
        rank: 10
      }),
      makeCandidate({
        id: "owned",
        entityType: "homework",
        entityId: "owned-homework",
        title: "Owned homework",
        href: "/homework/owned-homework",
        section: "homework",
        roleScope: ["student"],
        visibility: "student_owned",
        ownerStudentId: "student-1",
        rank: 9
      }),
      makeCandidate({
        id: "other",
        entityType: "homework",
        entityId: "other-homework",
        title: "Other homework",
        href: "/homework/other-homework",
        section: "homework",
        roleScope: ["student"],
        visibility: "student_owned",
        ownerStudentId: "student-2",
        rank: 8
      })
    ]);

    const result = await searchSite({ query: "homework", limit: 10 });

    expect(result.items.map((item) => item.entityId)).toEqual(["public-post", "owned-homework"]);
    expect(fetchCandidatesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          rbacPermissions: ["homework.view"]
        })
      })
    );
  });

  it("returns empty result for short query", async () => {
    const result = await searchSite({ query: "a" });

    expect(result).toEqual({ query: "a", items: [], groups: [] });
    expect(fetchCandidatesMock).not.toHaveBeenCalled();
  });

  it("does not load student practice access when candidates do not require practice enrollment filtering", async () => {
    fetchCandidatesMock.mockResolvedValue([
      {
        id: "1",
        entityType: "post",
        entityId: "public-post",
        title: "Public post",
        subtitle: null,
        body: "body",
        href: "/articles/public-post",
        section: "blog",
        icon: "file-text",
        badge: null,
        roleScope: ["all"],
        visibility: "public",
        ownerStudentId: null,
        courseId: null,
        isPublished: true,
        meta: {},
        updatedAt: "2026-03-26T00:00:00.000Z",
        rank: 10
      },
      {
        id: "2",
        entityType: "module",
        entityId: "role-practice",
        title: "Role practice",
        subtitle: null,
        body: "body",
        href: "/practice/topics/role-practice",
        section: "practice",
        icon: "graduation-cap",
        badge: "урок",
        roleScope: ["student"],
        visibility: "role",
        ownerStudentId: null,
        courseId: null,
        isPublished: true,
        meta: {},
        updatedAt: "2026-03-26T00:00:00.000Z",
        rank: 9
      },
      {
        id: "3",
        entityType: "homework",
        entityId: "owned-homework",
        title: "Owned homework",
        subtitle: null,
        body: "body",
        href: "/homework/owned-homework",
        section: "homework",
        icon: "book-open",
        badge: null,
        roleScope: ["student"],
        visibility: "student_owned",
        ownerStudentId: "student-1",
        courseId: null,
        isPublished: true,
        meta: {},
        updatedAt: "2026-03-26T00:00:00.000Z",
        rank: 8
      },
      {
        id: "4",
        entityType: "homework",
        entityId: "enrollment-homework",
        title: "Enrollment homework",
        subtitle: null,
        body: "body",
        href: "/homework/enrollment-homework",
        section: "homework",
        icon: "book-open",
        badge: null,
        roleScope: ["student"],
        visibility: "enrollment",
        ownerStudentId: null,
        courseId: null,
        isPublished: true,
        meta: {},
        updatedAt: "2026-03-26T00:00:00.000Z",
        rank: 7
      }
    ] satisfies SearchDocumentCandidate[]);

    const result = await searchSite({ query: "homework", limit: 10 });

    expect(createClientMock).not.toHaveBeenCalled();
    expect(result.items.map((item) => item.entityId)).toEqual(["public-post", "role-practice", "owned-homework"]);
  });

  it("filters invisible documents, dedupes results and groups by section", async () => {
    const candidates: SearchDocumentCandidate[] = [
      {
        id: "1",
        entityType: "module",
        entityId: "module-1",
        title: "Speaking 1",
        subtitle: "Speaking",
        body: "A".repeat(160),
        href: "/practice/topics/speaking",
        section: "practice",
        icon: "graduation-cap",
        badge: "урок",
        roleScope: ["student"],
        visibility: "enrollment",
        ownerStudentId: null,
        courseId: "course-1",
        isPublished: true,
        meta: {},
        updatedAt: "2026-03-26T00:00:00.000Z",
        rank: 10
      },
      {
        id: "2",
        entityType: "module",
        entityId: "module-1",
        title: "Speaking 1 duplicate",
        subtitle: "Speaking",
        body: "duplicate",
        href: "/practice/topics/speaking",
        section: "practice",
        icon: "graduation-cap",
        badge: "урок",
        roleScope: ["student"],
        visibility: "enrollment",
        ownerStudentId: null,
        courseId: "course-1",
        isPublished: true,
        meta: {},
        updatedAt: "2026-03-26T00:00:00.000Z",
        rank: 9
      },
      {
        id: "3",
        entityType: "post",
        entityId: "post-1",
        title: "Public post",
        subtitle: null,
        body: "body",
        href: "/articles/post-1",
        section: "blog",
        icon: "file-text",
        badge: null,
        roleScope: ["all"],
        visibility: "public",
        ownerStudentId: null,
        courseId: null,
        isPublished: true,
        meta: {},
        updatedAt: "2026-03-26T00:00:00.000Z",
        rank: 8
      },
      {
        id: "4",
        entityType: "admin-page",
        entityId: "admin-1",
        title: "Admin only",
        subtitle: null,
        body: "body",
        href: "/admin",
        section: "admin",
        icon: "folder",
        badge: null,
        roleScope: ["admin"],
        visibility: "role",
        ownerStudentId: null,
        courseId: null,
        isPublished: true,
        meta: {},
        updatedAt: "2026-03-26T00:00:00.000Z",
        rank: 7
      }
    ];

    fetchCandidatesMock.mockResolvedValue(candidates);

    const result = await searchSite({ query: "speaking", limit: 10 });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].entityId).toBe("module-1");
    expect(result.items[0].snippet?.endsWith("...")).toBe(true);
    expect(result.items.find((item) => item.section === "admin")).toBeUndefined();
    expect(result.groups).toEqual([
      { key: "practice", label: "Практика", count: 1 },
      { key: "blog", label: "Блог", count: 1 }
    ]);
  });

  it("filters practice test search results by student level while still allowing assigned placement", async () => {
    createClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        switch (table) {
          case "students":
            return makeQueryResult({ english_level: "A1" });
          case "homework_assignments":
            return makeQueryResult([
              {
                homework_items: [{ source_type: "test", source_id: "placement-test-1" }]
              }
            ]);
          case "tests":
            return makeQueryResult([
              { id: "test-a1", assessment_kind: "regular", cefr_level: "A1" },
              { id: "test-b2", assessment_kind: "regular", cefr_level: "B2" },
              { id: "placement-test-1", assessment_kind: "placement", cefr_level: null }
            ]);
          default:
            return makeQueryResult([]);
        }
      })
    });

    fetchCandidatesMock.mockResolvedValue([
      {
        id: "1",
        entityType: "test",
        entityId: "test-a1",
        title: "A1 drill",
        subtitle: null,
        body: "body",
        href: "/practice/activity/test_test-a1",
        section: "practice",
        icon: "brain",
        badge: "Тренажёр",
        roleScope: ["student"],
        visibility: "enrollment",
        ownerStudentId: null,
        courseId: "course-1",
        isPublished: true,
        meta: {},
        updatedAt: "2026-03-26T00:00:00.000Z",
        rank: 10
      },
      {
        id: "2",
        entityType: "test",
        entityId: "test-b2",
        title: "B2 drill",
        subtitle: null,
        body: "body",
        href: "/practice/activity/test_test-b2",
        section: "practice",
        icon: "brain",
        badge: "Тренажёр",
        roleScope: ["student"],
        visibility: "enrollment",
        ownerStudentId: null,
        courseId: "course-1",
        isPublished: true,
        meta: {},
        updatedAt: "2026-03-26T00:00:00.000Z",
        rank: 9
      },
      {
        id: "3",
        entityType: "test",
        entityId: "placement-test-1",
        title: "Placement",
        subtitle: null,
        body: "body",
        href: "/practice/activity/test_placement-test-1",
        section: "practice",
        icon: "clipboard-list",
        badge: "Тест",
        roleScope: ["student"],
        visibility: "enrollment",
        ownerStudentId: null,
        courseId: "course-1",
        isPublished: true,
        meta: {},
        updatedAt: "2026-03-26T00:00:00.000Z",
        rank: 8
      }
    ] satisfies SearchDocumentCandidate[]);

    const result = await searchSite({ query: "test", limit: 10 });

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(result.items.map((item) => item.entityId)).toEqual(["test-a1", "placement-test-1"]);
  });

  it("allows staff with explicit student visibility RBAC permission to see student-owned results", async () => {
    const staffContext: SearchContext = {
      userId: "manager-1",
      role: "manager",
      capabilities: ["staff_admin"],
      rbacPermissions: ["students.view"],
      rbacPermissionScopes: { "students.view": ["all"] },
      studentId: null,
      teacherId: null,
      accessibleStudentIds: null,
      isAuthenticated: true
    };
    getSearchContextMock.mockResolvedValue(staffContext);
    fetchCandidatesMock.mockResolvedValue([
      makeCandidate({
        entityType: "homework",
        entityId: "student-homework",
        title: "Student homework",
        href: "/homework/student-homework",
        section: "homework",
        roleScope: ["student"],
        visibility: "student_owned",
        ownerStudentId: "student-1"
      })
    ]);

    const result = await searchSite({ query: "homework", limit: 10 });

    expect(result.items.map((item) => item.entityId)).toEqual(["student-homework"]);
  });

  it("does not allow staff_admin alone to see student-owned results when RBAC permission is missing", async () => {
    const staffContext: SearchContext = {
      userId: "manager-1",
      role: "manager",
      capabilities: ["staff_admin"],
      rbacPermissions: ["search.ui"],
      rbacPermissionScopes: { "search.ui": ["all"] },
      studentId: null,
      teacherId: null,
      accessibleStudentIds: null,
      isAuthenticated: true
    };
    getSearchContextMock.mockResolvedValue(staffContext);
    fetchCandidatesMock.mockResolvedValue([
      makeCandidate({
        entityType: "homework",
        entityId: "student-homework",
        title: "Student homework",
        href: "/homework/student-homework",
        section: "homework",
        roleScope: ["student"],
        visibility: "student_owned",
        ownerStudentId: "student-1"
      })
    ]);

    const result = await searchSite({ query: "homework", limit: 10 });

    expect(result.items).toEqual([]);
  });

  it("allows assigned teacher student-owned results but denies unassigned student-owned results", async () => {
    const teacherContext: SearchContext = {
      userId: "teacher-user-1",
      role: "teacher",
      capabilities: ["teacher"],
      studentId: null,
      teacherId: "teacher-1",
      accessibleStudentIds: ["student-1"],
      isAuthenticated: true
    };
    getSearchContextMock.mockResolvedValue(teacherContext);
    fetchCandidatesMock.mockResolvedValue([
      makeCandidate({
        id: "assigned",
        entityType: "homework",
        entityId: "assigned-homework",
        title: "Assigned homework",
        href: "/homework/assigned-homework",
        section: "homework",
        roleScope: ["student"],
        visibility: "student_owned",
        ownerStudentId: "student-1",
        rank: 10
      }),
      makeCandidate({
        id: "unassigned",
        entityType: "homework",
        entityId: "unassigned-homework",
        title: "Unassigned homework",
        href: "/homework/unassigned-homework",
        section: "homework",
        roleScope: ["student"],
        visibility: "student_owned",
        ownerStudentId: "student-2",
        rank: 9
      })
    ]);

    const result = await searchSite({ query: "homework", limit: 10 });

    expect(result.items.map((item) => item.entityId)).toEqual(["assigned-homework"]);
  });

  it("requires explicit content RBAC permission for admin content role documents", async () => {
    const staffContext: SearchContext = {
      userId: "manager-1",
      role: "manager",
      capabilities: ["staff_admin"],
      rbacPermissions: ["students.view"],
      rbacPermissionScopes: { "students.view": ["all"] },
      studentId: null,
      teacherId: null,
      accessibleStudentIds: null,
      isAuthenticated: true
    };
    getSearchContextMock.mockResolvedValue(staffContext);
    fetchCandidatesMock.mockResolvedValue([
      makeCandidate({
        entityType: "test",
        entityId: "admin-test",
        title: "Admin test",
        href: "/admin/tests/admin-test",
        section: "admin",
        roleScope: ["admin"],
        visibility: "role"
      })
    ]);

    const denied = await searchSite({ query: "test", limit: 10 });
    expect(denied.items).toEqual([]);

    getSearchContextMock.mockResolvedValue({
      ...staffContext,
      rbacPermissions: ["content.manage"],
      rbacPermissionScopes: { "content.manage": ["all"] }
    });

    const allowed = await searchSite({ query: "test", limit: 10 });
    expect(allowed.items.map((item) => item.entityId)).toEqual(["admin-test"]);
  });
});
