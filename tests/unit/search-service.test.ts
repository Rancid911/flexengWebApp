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
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
    catch: (reject: (reason: unknown) => unknown) => Promise.resolve(result).catch(reject),
    finally: (callback: () => void) => Promise.resolve(result).finally(callback)
  };
  return builder;
}

const studentContext: SearchContext = {
  userId: "user-1",
  role: "student",
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
      from: vi.fn(() => makeQueryResult([{ course_id: "course-1" }]))
    });
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
});
