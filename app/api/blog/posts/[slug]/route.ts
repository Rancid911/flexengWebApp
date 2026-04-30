import { NextRequest, NextResponse } from "next/server";

import { getBlogPostBySlug } from "@/lib/blog/public";
import { withApiErrorHandling } from "@/lib/server/http";

export const GET = withApiErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);
    if (!post) return NextResponse.json({ code: "NOT_FOUND", message: "Blog post not found" }, { status: 404 });
    return NextResponse.json(post);
});
