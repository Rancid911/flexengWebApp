import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const searchSiteMock = vi.fn();

vi.mock("@/lib/search/search-service", () => ({
  searchSite: (...args: unknown[]) => searchSiteMock(...args)
}));

function makeRequest(query = "english") {
  return new NextRequest(`http://localhost/api/search?q=${encodeURIComponent(query)}&section=all&limit=8`);
}

describe("/api/search", () => {
  beforeEach(() => {
    searchSiteMock.mockReset();
    searchSiteMock.mockResolvedValue({ query: "english", items: [], groups: [] });
  });

  it("keeps guest search public and calls search service", async () => {
    const { GET } = await import("@/app/api/search/route");
    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    expect(searchSiteMock).toHaveBeenCalledWith({ query: "english", limit: 8, section: "all" });
  });

  it("delegates authenticated result visibility to the search service without a search.ui route gate", async () => {
    const { GET } = await import("@/app/api/search/route");
    const response = await GET(makeRequest("words"));

    expect(response.status).toBe(200);
    expect(searchSiteMock).toHaveBeenCalledWith({ query: "words", limit: 8, section: "all" });
  });

  it("normalizes invalid section and limit before calling search service", async () => {
    const { GET } = await import("@/app/api/search/route");
    const response = await GET(
      new NextRequest("http://localhost/api/search?q=words&section=staff_admin&limit=100")
    );

    expect(response.status).toBe(200);
    expect(searchSiteMock).toHaveBeenCalledWith({ query: "words", limit: 25, section: "all" });
  });
});
