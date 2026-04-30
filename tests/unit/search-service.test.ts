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
  isAuthenticated: true
};

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
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns empty result for short query", async () => {
    const result = await searchSite({ query: "a" });

    expect(result).toEqual({ query: "a", items: [], groups: [] });
    expect(fetchCandidatesMock).not.toHaveBeenCalled();
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

    expect(result.items.map((item) => item.entityId)).toEqual(["test-a1", "placement-test-1"]);
  });
});
