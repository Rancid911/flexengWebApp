import { NextRequest, NextResponse } from "next/server";

import { parsePagination } from "@/lib/admin/http";
import { getPublishedBlogPosts } from "@/lib/blog/public";
import { withApiErrorHandling } from "@/lib/server/http";

export const GET = withApiErrorHandling(async (request: NextRequest) => {
    const url = new URL(request.url);
    const { page, pageSize, q } = parsePagination(url);
    const category = (url.searchParams.get("category") ?? "").trim();
    const tag = (url.searchParams.get("tag") ?? "").trim();
    const sort = (url.searchParams.get("sort") ?? "new").trim() === "popular" ? "popular" : "new";

    return NextResponse.json(await getPublishedBlogPosts({ page, pageSize, q, category, tag, sort }));
});
