import { NextRequest, NextResponse } from "next/server";

import { withApiErrorHandling } from "@/lib/server/http";
import { searchSite } from "@/lib/search/search-service";
import type { SearchSection } from "@/lib/search/types";

const allowedSections = new Set<SearchSection>(["all", "practice", "homework", "words", "blog", "admin"]);

export const GET = withApiErrorHandling(async (request: NextRequest) => {
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") ?? "").trim();
    const sectionParam = (url.searchParams.get("section") ?? "all").trim() as SearchSection;
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "8") || 8, 1), 25);
    const section = allowedSections.has(sectionParam) ? sectionParam : "all";

    const payload = await searchSite({ query, limit, section });
    return NextResponse.json(payload);
});
